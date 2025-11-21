import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateHelpTypeSchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
});

export type UpdateHelpTypeDto = z.infer<typeof updateHelpTypeSchema>;

export class UpdateHelpTypeDtoClass {
  @ApiProperty({ description: 'Название вида помощи', example: 'Материальная помощь', required: false })
  name?: string;
}

