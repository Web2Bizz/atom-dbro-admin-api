import { z } from 'zod/v4';
import { contactSchema } from './create-organization.dto';

// Схема для массового создания, где cityId может быть 0 (для поиска по адресу)
const createOrganizationBulkItemSchema = z.object({
  name: z.string().min(1, 'Название организации обязательно').max(255, 'Название не должно превышать 255 символов'),
  cityId: z.number().int().nonnegative('ID города должен быть неотрицательным целым числом'), // Разрешаем 0
  typeId: z.number().int().positive('ID типа организации должен быть положительным целым числом'),
  helpTypeIds: z.array(z.number().int().positive('ID вида помощи должен быть положительным целым числом')).min(1, 'Необходимо указать хотя бы один вид помощи').refine((ids) => new Set(ids).size === ids.length, {
    message: 'Виды помощи должны быть уникальными',
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  summary: z.string().optional(),
  mission: z.string().optional(),
  description: z.string().optional(),
  goals: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
  address: z.string().optional(),
  contacts: z.array(contactSchema).optional(),
  gallery: z.array(z.string()).optional(),
}).refine((data) => {
  // Если cityId = 0, должен быть указан address для поиска города
  if (data.cityId === 0 && !data.address) {
    return false;
  }
  return true;
}, {
  message: 'Если cityId = 0, необходимо указать address для поиска города',
  path: ['address'],
});

export const createOrganizationsBulkSchema = z.array(createOrganizationBulkItemSchema).min(1, 'Массив организаций не может быть пустым');

export type CreateOrganizationsBulkDto = z.infer<typeof createOrganizationsBulkSchema>;

