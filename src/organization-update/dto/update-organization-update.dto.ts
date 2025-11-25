import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateOrganizationUpdateSchema = z.object({
  organizationId: z.number().int().positive('ID организации должен быть положительным числом').optional(),
  title: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  text: z.string().optional(),
  photos: z.array(z.string().url('Элемент должен быть валидным URL')).max(5, 'Максимум 5 фотографий').optional(),
});

export type UpdateOrganizationUpdateDto = z.infer<typeof updateOrganizationUpdateSchema>;

export class UpdateOrganizationUpdateDtoClass {
  @ApiProperty({ description: 'ID организации', example: 1, required: false })
  organizationId?: number;

  @ApiProperty({ description: 'Название обновления', example: 'Новые проекты организации', required: false })
  title?: string;

  @ApiProperty({ description: 'Текст обновления', example: 'Запущен новый проект помощи бездомным', required: false })
  text?: string;

  @ApiProperty({ 
    description: 'Фотографии обновления (максимум 5)', 
    example: ['https://example.com/photo1.jpg'],
    type: [String],
    maxItems: 5,
    required: false 
  })
  photos?: string[];
}

