import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const addHelpTypeSchema = z.object({
  helpTypeId: z.number().int().positive('ID вида помощи должен быть положительным целым числом'),
});

export type AddHelpTypeDto = z.infer<typeof addHelpTypeSchema>;

export class AddHelpTypeDtoClass {
  @ApiProperty({ description: 'ID вида помощи', example: 1 })
  helpTypeId: number;
}

