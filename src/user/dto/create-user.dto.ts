import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';
import { UserRole } from '../user.types';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(255, 'Имя не должно превышать 255 символов'),
  lastName: z.string().min(1, 'Фамилия обязательна').max(255, 'Фамилия не должна превышать 255 символов'),
  middleName: z.string().max(255, 'Отчество не должно превышать 255 символов').optional(),
  email: z.string().email('Некорректный формат email').min(1, 'Email обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
  role: z.nativeEnum(UserRole, {
    message: 'Роль должна быть одним из: USER, MODERATOR',
  }).optional(),
  organisationId: z.number().int().positive('ID организации должен быть положительным числом').nullable().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export class CreateUserDtoClass {
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

  @ApiProperty({ description: 'Роль пользователя', enum: UserRole, example: UserRole.USER, required: false })
  role?: UserRole;

  @ApiProperty({ description: 'ID организации', example: 1, required: false, nullable: true })
  organisationId?: number | null;
}

