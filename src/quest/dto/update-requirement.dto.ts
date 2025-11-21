import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateRequirementSchema = z.object({
  currentValue: z.number().int().min(0, 'currentValue должен быть неотрицательным числом'),
});

export type UpdateRequirementDto = z.infer<typeof updateRequirementSchema>;

export class UpdateRequirementDtoClass {
  @ApiProperty({ 
    description: 'Новое значение currentValue', 
    example: 5, 
    minimum: 0 
  })
  currentValue: number;
}

