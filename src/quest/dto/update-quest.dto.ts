import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

import { stepSchema } from './step.dto';
import { contactSchema, ContactDtoClass } from '../../organization/dto/create-organization.dto';

export const updateQuestSchema = z.object({
  title: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  experienceReward: z.number().int().min(0, 'Награда опыта должна быть неотрицательным числом').optional(),
  achievementId: z.number().int().positive('ID достижения должен быть положительным целым числом').optional(),
  cityId: z.number().int().positive('ID города должен быть положительным числом').optional(),
  organizationTypeId: z.number().int().positive('ID типа организации должен быть положительным числом').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  contacts: z.array(contactSchema).optional(),
  coverImage: z.string().max(500, 'URL обложки не должен превышать 500 символов').optional(),
  gallery: z.array(z.string().url('Элемент галереи должен быть валидным URL')).max(10, 'Галерея не может содержать более 10 изображений').optional(),
  steps: z.array(stepSchema).optional(),
  categoryIds: z.array(z.number().int().positive('ID категории должен быть положительным числом')).optional(),
});

export type UpdateQuestDto = z.infer<typeof updateQuestSchema>;

export class UpdateQuestDtoClass {
  @ApiProperty({ description: 'Название квеста', example: 'Помощь бездомным', required: false })
  title?: string;

  @ApiProperty({ description: 'Описание квеста', example: 'Оказать помощь бездомным людям в вашем городе', required: false })
  description?: string;

  @ApiProperty({ 
    description: 'Статус квеста', 
    example: 'active',
    enum: ['active', 'completed', 'archived'],
    required: false
  })
  status?: 'active' | 'completed' | 'archived';

  @ApiProperty({ description: 'Награда опыта за выполнение квеста', example: 100, required: false })
  experienceReward?: number;

  @ApiProperty({ description: 'ID достижения, которое будет присвоено при завершении квеста', example: 1, required: false })
  achievementId?: number;

  @ApiProperty({ description: 'ID города, в котором проходит квест', example: 1, required: false })
  cityId?: number;

  @ApiProperty({ description: 'ID типа организации', example: 1, required: false })
  organizationTypeId?: number;

  @ApiProperty({ description: 'Широта', example: 55.7558, required: false })
  latitude?: number;

  @ApiProperty({ description: 'Долгота', example: 37.6173, required: false })
  longitude?: number;

  @ApiProperty({ description: 'Адрес', example: 'г. Москва, ул. Примерная, д. 1', required: false })
  address?: string;

  @ApiProperty({ description: 'Контакты', example: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }], required: false, type: [ContactDtoClass] })
  contacts?: ContactDtoClass[];

  @ApiProperty({ description: 'URL обложки квеста', example: 'https://example.com/cover.jpg', required: false })
  coverImage?: string;

  @ApiProperty({ 
    description: 'Галерея изображений квеста (максимум 10)', 
    example: ['https://example.com/image1.jpg'],
    type: [String],
    maxItems: 10,
    required: false 
  })
  gallery?: string[];

  @ApiProperty({ 
    description: 'Этапы квеста', 
    type: Array,
    required: false 
  })
  steps?: any[];

  @ApiProperty({ 
    description: 'ID категорий, связанных с квестом', 
    example: [1, 2],
    type: [Number],
    required: false 
  })
  categoryIds?: number[];
}

