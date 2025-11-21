import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createQuestUpdateSchema = z.object({
  questId: z.number().int().positive('ID квеста должен быть положительным числом'),
  title: z.string().min(1, 'Название обновления обязательно').max(255, 'Название не должно превышать 255 символов'),
  text: z.string().min(1, 'Текст обновления обязателен'),
  photos: z.array(z.string().url('Элемент должен быть валидным URL')).max(5, 'Максимум 5 фотографий').optional(),
});

export type CreateQuestUpdateDto = z.infer<typeof createQuestUpdateSchema>;

export class CreateQuestUpdateDtoClass {
  @ApiProperty({ description: 'ID квеста', example: 1 })
  questId: number;

  @ApiProperty({ description: 'Название обновления', example: 'Прогресс по сбору одежды' })
  title: string;

  @ApiProperty({ description: 'Текст обновления', example: 'Собрано 50% необходимой одежды' })
  text: string;

  @ApiProperty({ 
    description: 'Фотографии обновления (максимум 5)', 
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    type: [String],
    maxItems: 5,
    required: false 
  })
  photos?: string[];
}

