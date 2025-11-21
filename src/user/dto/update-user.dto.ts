import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';
import { UserRole } from '../user.types';

export const updateUserSchema = z.object({
  firstName: z.string().max(255, 'Имя не должно превышать 255 символов').optional(),
  lastName: z.string().max(255, 'Фамилия не должна превышать 255 символов').optional(),
  middleName: z.string().max(255, 'Отчество не должно превышать 255 символов').optional(),
  email: z.string().email('Некорректный формат email').optional(),
  avatarUrls: z.record(z.number(), z.string()).optional(),
  role: z.nativeEnum(UserRole, {
    message: 'Роль должна быть одним из: USER, MODERATOR',
  }).optional(),
  organisationId: z.number().int().positive('ID организации должен быть положительным числом').nullable().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export class UpdateUserDtoClass {
  @ApiProperty({ description: 'Имя', example: 'Иван', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Фамилия', example: 'Иванов', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Отчество', example: 'Иванович', required: false })
  middleName?: string;

  @ApiProperty({ description: 'Email', example: 'ivan@example.com', required: false })
  email?: string;

  @ApiProperty({ 
    description: 'URL аватарок. При обновлении будет преобразован в формат с ключами 4-9 и одинаковым URL', 
    example: { 4: 'https://example.com/avatar.png', 5: 'https://example.com/avatar.png', 6: 'https://example.com/avatar.png', 7: 'https://example.com/avatar.png', 8: 'https://example.com/avatar.png', 9: 'https://example.com/avatar.png' }, 
    required: false 
  })
  avatarUrls?: Record<number, string>;

  @ApiProperty({ description: 'Роль пользователя', enum: UserRole, example: UserRole.USER, required: false })
  role?: UserRole;

  @ApiProperty({ description: 'ID организации', example: 1, required: false, nullable: true })
  organisationId?: number | null;
}

