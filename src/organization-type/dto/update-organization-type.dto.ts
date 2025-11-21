import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const updateOrganizationTypeSchema = z.object({
  name: z.string().max(255, 'Название не должно превышать 255 символов').optional(),
});

export type UpdateOrganizationTypeDto = z.infer<typeof updateOrganizationTypeSchema>;

export class UpdateOrganizationTypeDtoClass {
  @ApiProperty({ description: 'Название типа организации', example: 'Благотворительный фонд', required: false })
  name?: string;
}

