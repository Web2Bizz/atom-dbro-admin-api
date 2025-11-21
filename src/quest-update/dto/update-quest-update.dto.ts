import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateQuestUpdateSchema = z.object({
  questId: z.number().int().positive('ID квеста должен быть положительным числом').optional(),
  title: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  text: z.string().optional(),
  photos: z.array(z.string().url('Элемент должен быть валидным URL')).max(5, 'Максимум 5 фотографий').optional(),
});

export type UpdateQuestUpdateDto = z.infer<typeof updateQuestUpdateSchema>;

export class UpdateQuestUpdateDtoClass {
  @ApiProperty({ description: 'ID квеста', example: 1, required: false })
  questId?: number;

  @ApiProperty({ description: 'Название обновления', example: 'Прогресс по сбору одежды', required: false })
  title?: string;

  @ApiProperty({ description: 'Текст обновления', example: 'Собрано 50% необходимой одежды', required: false })
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

