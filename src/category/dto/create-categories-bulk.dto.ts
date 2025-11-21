import { z } from 'zod/v4';
import { createCategorySchema, CreateCategoryDto } from './create-category.dto';

export const createCategoriesBulkSchema = z.array(createCategorySchema).min(1, 'Массив категорий не может быть пустым');

export type CreateCategoriesBulkDto = z.infer<typeof createCategoriesBulkSchema>;

