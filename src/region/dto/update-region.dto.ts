import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateRegionSchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
});

export type UpdateRegionDto = z.infer<typeof updateRegionSchema>;

export class UpdateRegionDtoClass {
  @ApiProperty({ description: 'Название региона', example: 'Московская область', required: false })
  name?: string;
}

