import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createHelpTypeSchema = z.object({
  name: z.string().min(1, 'Название вида помощи обязательно').max(255, 'Название не должно превышать 255 символов'),
});

export type CreateHelpTypeDto = z.infer<typeof createHelpTypeSchema>;

export class CreateHelpTypeDtoClass {
  @ApiProperty({ description: 'Название вида помощи', example: 'Материальная помощь' })
  name: string;
}

