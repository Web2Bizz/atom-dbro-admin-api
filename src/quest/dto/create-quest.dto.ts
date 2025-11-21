import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';
import { stepSchema, StepDtoClass } from './step.dto';
import { contactSchema, ContactDtoClass } from '../../organization/dto/create-organization.dto';

export const createAchievementForQuestSchema = z.object({
  title: z.string().min(1, 'Название достижения обязательно').max(255, 'Название не должно превышать 255 символов'),
  description: z.string().optional(),
  icon: z.string().max(255, 'Иконка не должна превышать 255 символов').optional(),
});

export type CreateAchievementForQuestDto = z.infer<typeof createAchievementForQuestSchema>;

export class CreateAchievementForQuestDtoClass {
  @ApiProperty({ description: 'Название достижения', example: 'Помощник бездомным' })
  title: string;

  @ApiProperty({ description: 'Описание достижения', example: 'Помог бездомным людям', required: false })
  description?: string;

  @ApiProperty({ description: 'Иконка достижения', example: 'medal-icon.svg', required: false })
  icon?: string;
}

export const createQuestSchema = z.object({
  title: z.string().min(1, 'Название квеста обязательно').max(255, 'Название не должно превышать 255 символов'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  experienceReward: z.number().int().min(0, 'Награда опыта должна быть неотрицательным числом').optional(),
  achievement: createAchievementForQuestSchema.optional(),
  cityId: z.number().int().positive('ID города должен быть положительным числом'),
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

export type CreateQuestDto = z.infer<typeof createQuestSchema>;

export class CreateQuestDtoClass {
  @ApiProperty({ description: 'Название квеста', example: 'Помощь бездомным' })
  title: string;

  @ApiProperty({ description: 'Описание квеста', example: 'Оказать помощь бездомным людям в вашем городе', required: false })
  description?: string;

  @ApiProperty({ 
    description: 'Статус квеста', 
    example: 'active',
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  })
  status?: 'active' | 'completed' | 'archived';

  @ApiProperty({ description: 'Награда опыта за выполнение квеста', example: 100, default: 0 })
  experienceReward?: number;

  @ApiProperty({ 
    description: 'Данные для создания достижения, которое будет присвоено при завершении квеста. Достижение автоматически получит rarity = "private" и будет привязано к квесту.',
    type: CreateAchievementForQuestDtoClass,
    required: false
  })
  achievement?: CreateAchievementForQuestDtoClass;

  @ApiProperty({ description: 'ID города, в котором проходит квест', example: 1 })
  cityId: number;

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
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
    maxItems: 10,
    required: false 
  })
  gallery?: string[];

  @ApiProperty({ 
    description: 'Этапы квеста', 
    type: [StepDtoClass],
    required: false 
  })
  steps?: StepDtoClass[];

  @ApiProperty({ 
    description: 'ID категорий, связанных с квестом', 
    example: [1, 2],
    type: [Number],
    required: false 
  })
  categoryIds?: number[];
}

