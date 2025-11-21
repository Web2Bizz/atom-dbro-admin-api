import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const addOwnerSchema = z.object({
  userId: z.number().int().positive('ID пользователя должен быть положительным целым числом'),
});

export type AddOwnerDto = z.infer<typeof addOwnerSchema>;

export class AddOwnerDtoClass {
  @ApiProperty({ description: 'ID пользователя', example: 1 })
  userId: number;
}

