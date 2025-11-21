import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const createOrganizationTypeSchema = z.object({
  name: z.string().min(1, 'Название типа организации обязательно').max(255, 'Название не должно превышать 255 символов'),
});

export type CreateOrganizationTypeDto = z.infer<typeof createOrganizationTypeSchema>;

export class CreateOrganizationTypeDtoClass {
  @ApiProperty({ description: 'Название типа организации', example: 'Благотворительный фонд' })
  name: string;
}

