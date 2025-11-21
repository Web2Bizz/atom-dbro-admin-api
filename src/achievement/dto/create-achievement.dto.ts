import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createAchievementSchema = z.object({
  title: z.string().min(1, 'Название достижения обязательно').max(255, 'Название не должно превышать 255 символов'),
  description: z.string().optional(),
  icon: z.string().max(255, 'Иконка не должна превышать 255 символов').optional(),
  rarity: z.enum(['common', 'epic', 'rare', 'legendary', 'private'], {
    message: 'Редкость должна быть одним из: common, epic, rare, legendary, private',
  }),
});

export type CreateAchievementDto = z.infer<typeof createAchievementSchema>;

export class CreateAchievementDtoClass {
  @ApiProperty({ description: 'Название достижения', example: 'Первая помощь' })
  title: string;

  @ApiProperty({ description: 'Описание достижения', example: 'Оказать первую помощь нуждающемуся', required: false })
  description?: string;

  @ApiProperty({ description: 'Иконка достижения', example: 'medal-icon.svg', required: false })
  icon?: string;

  @ApiProperty({ 
    description: 'Редкость достижения', 
    example: 'common',
    enum: ['common', 'epic', 'rare', 'legendary', 'private']
  })
  rarity: 'common' | 'epic' | 'rare' | 'legendary' | 'private';
}

