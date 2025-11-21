import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const addExperienceSchema = z.object({
  amount: z.number().int().min(1, 'Количество опыта должно быть не менее 1'),
});

export type AddExperienceDto = z.infer<typeof addExperienceSchema>;

export class AddExperienceDtoClass {
  @ApiProperty({ description: 'Количество опыта для добавления', example: 100, minimum: 1 })
  amount: number;
}

