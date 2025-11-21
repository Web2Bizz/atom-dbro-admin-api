import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').max(255, 'Название не должно превышать 255 символов'),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export class CreateCategoryDtoClass {
  @ApiProperty({ description: 'Название категории', example: 'Экология' })
  name: string;
}

