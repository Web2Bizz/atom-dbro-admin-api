import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const loginSchema = z.object({
  email: z.string().email('Некорректный формат email').min(1, 'Email обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export class LoginDtoClass {
  @ApiProperty({ description: 'Email', example: 'ivan@example.com' })
  email: string;

  @ApiProperty({ description: 'Пароль', example: 'password123' })
  password: string;
}

