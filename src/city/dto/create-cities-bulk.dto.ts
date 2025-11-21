import { z } from 'zod/v4';
import { createCitySchema, CreateCityDto } from './create-city.dto';

export const createCitiesBulkSchema = z.array(createCitySchema).min(1, 'Массив городов не может быть пустым');

export type CreateCitiesBulkDto = z.infer<typeof createCitiesBulkSchema>;

