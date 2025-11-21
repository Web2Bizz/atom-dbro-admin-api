import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Старый пароль обязателен'),
  newPassword: z.string().min(1, 'Новый пароль обязателен'),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export class ChangePasswordDtoClass {
  @ApiProperty({ description: 'Старый пароль', example: 'oldPassword123' })
  oldPassword: string;

  @ApiProperty({ description: 'Новый пароль', example: 'newPassword123' })
  newPassword: string;
}

