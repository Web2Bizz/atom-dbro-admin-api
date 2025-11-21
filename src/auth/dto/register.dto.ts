import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Имя обязательно').max(255, 'Имя не должно превышать 255 символов'),
    lastName: z.string().min(1, 'Фамилия обязательна').max(255, 'Фамилия не должна превышать 255 символов'),
    middleName: z.string().max(255, 'Отчество не должно превышать 255 символов').optional(),
    email: z.string().email('Некорректный формат email').min(1, 'Email обязателен'),
    password: z.string().min(1, 'Пароль обязателен'),
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароль и подтверждение пароля должны совпадать',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof registerSchema>;

export class RegisterDtoClass {
  @ApiProperty({ description: 'Имя', example: 'Иван' })
  firstName: string;

  @ApiProperty({ description: 'Фамилия', example: 'Иванов' })
  lastName: string;

  @ApiProperty({ description: 'Отчество', example: 'Иванович', required: false })
  middleName?: string;

  @ApiProperty({ description: 'Email', example: 'ivan@example.com' })
  email: string;

  @ApiProperty({ description: 'Пароль', example: 'password123' })
  password: string;

  @ApiProperty({ description: 'Подтверждение пароля', example: 'password123' })
  confirmPassword: string;
}

