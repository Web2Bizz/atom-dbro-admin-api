import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createRegionSchema = z.object({
  name: z.string().min(1, 'Название региона обязательно').max(255, 'Название не должно превышать 255 символов'),
});

export type CreateRegionDto = z.infer<typeof createRegionSchema>;

export class CreateRegionDtoClass {
  @ApiProperty({ description: 'Название региона', example: 'Московская область' })
  name: string;
}

