import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';
import { contactSchema, ContactDtoClass } from './create-organization.dto';

export const updateOrganizationSchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  cityId: z.number().int().positive('ID города должен быть положительным целым числом').optional(),
  organizationTypeId: z.number().int().positive('ID типа организации должен быть положительным целым числом').optional(),
  helpTypeIds: z.array(z.number().int().positive('ID вида помощи должен быть положительным целым числом')).optional().refine((ids) => !ids || new Set(ids).size === ids.length, {
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
});

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

export class UpdateOrganizationDtoClass {
  @ApiProperty({ description: 'Название организации', example: 'Благотворительный фонд', required: false })
  name?: string;

  @ApiProperty({ description: 'ID города', example: 1, required: false })
  cityId?: number;

  @ApiProperty({ description: 'ID типа организации', example: 1, required: false })
  organizationTypeId?: number;

  @ApiProperty({ description: 'ID видов помощи', example: [1, 2, 3], required: false, type: [Number] })
  helpTypeIds?: number[];

  @ApiProperty({ description: 'Широта', example: '55.7558', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Долгота', example: '37.6173', required: false })
  longitude?: number;

  @ApiProperty({ description: 'Краткое описание', example: 'Благотворительный фонд помощи детям', required: false })
  summary?: string;

  @ApiProperty({ description: 'Миссия организации', example: 'Помощь детям из малообеспеченных семей', required: false })
  mission?: string;

  @ApiProperty({ description: 'Полное описание организации', example: 'Наша организация занимается...', required: false })
  description?: string;

  @ApiProperty({ description: 'Цели организации', example: ['Цель 1', 'Цель 2'], required: false, type: [String] })
  goals?: string[];

  @ApiProperty({ description: 'Потребности организации', example: ['Нужда 1', 'Нужда 2'], required: false, type: [String] })
  needs?: string[];

  @ApiProperty({ description: 'Адрес организации', example: 'г. Москва, ул. Примерная, д. 1', required: false })
  address?: string;

  @ApiProperty({ description: 'Контакты организации', example: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }], required: false, type: [ContactDtoClass] })
  contacts?: ContactDtoClass[];

  @ApiProperty({ description: 'Галерея изображений (URL)', example: ['https://example.com/image1.jpg'], required: false, type: [String] })
  gallery?: string[];
}

