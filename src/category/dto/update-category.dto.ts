import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateCategorySchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export class UpdateCategoryDtoClass {
  @ApiProperty({ description: 'Название категории', example: 'Экология', required: false })
  name?: string;
}

