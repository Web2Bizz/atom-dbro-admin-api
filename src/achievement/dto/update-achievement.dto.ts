import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateAchievementSchema = z.object({
  title: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  description: z.string().optional(),
  icon: z.string().max(255, 'Иконка не должна превышать 255 символов').optional(),
  rarity: z.enum(['common', 'epic', 'rare', 'legendary', 'private'], {
    message: 'Редкость должна быть одним из: common, epic, rare, legendary, private',
  }).optional(),
});

export type UpdateAchievementDto = z.infer<typeof updateAchievementSchema>;

export class UpdateAchievementDtoClass {
  @ApiProperty({ description: 'Название достижения', example: 'Первая помощь', required: false })
  title?: string;

  @ApiProperty({ description: 'Описание достижения', example: 'Оказать первую помощь нуждающемуся', required: false })
  description?: string;

  @ApiProperty({ description: 'Иконка достижения', example: 'medal-icon.svg', required: false })
  icon?: string;

  @ApiProperty({ 
    description: 'Редкость достижения', 
    example: 'common',
    enum: ['common', 'epic', 'rare', 'legendary', 'private'],
    required: false
  })
  rarity?: 'common' | 'epic' | 'rare' | 'legendary' | 'private';
}

