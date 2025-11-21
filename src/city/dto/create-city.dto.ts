import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createCitySchema = z.object({
  name: z.string().min(1, 'Название города обязательно').max(255, 'Название не должно превышать 255 символов'),
  latitude: z.number(),
  longitude: z.number(),
  regionId: z.number().int().positive('ID региона должен быть положительным целым числом'),
});

export type CreateCityDto = z.infer<typeof createCitySchema>;

export class CreateCityDtoClass {
  @ApiProperty({ description: 'Название города', example: 'Москва' })
  name: string;

  @ApiProperty({ description: 'Широта', example: '55.7558' })
  latitude: number;

  @ApiProperty({ description: 'Долгота', example: '37.6173' })
  longitude: number;

  @ApiProperty({ description: 'ID региона', example: 1 })
  regionId: number;
}

