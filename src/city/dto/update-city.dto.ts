import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateCitySchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  regionId: z.number().int().positive('ID региона должен быть положительным целым числом').optional(),
});

export type UpdateCityDto = z.infer<typeof updateCitySchema>;

export class UpdateCityDtoClass {
  @ApiProperty({ description: 'Название города', example: 'Москва', required: false })
  name?: string;

  @ApiProperty({ description: 'Широта', example: '55.7558', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Долгота', example: '37.6173', required: false })
  longitude?: number;

  @ApiProperty({ description: 'ID региона', example: 1, required: false })
  regionId?: number;
}

