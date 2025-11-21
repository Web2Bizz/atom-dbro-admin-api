import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';
import { UserRole } from '../user.types';

export const updateUserV2Schema = z.object({
  firstName: z.string().max(255, 'Имя не должно превышать 255 символов').optional(),
  lastName: z.string().max(255, 'Фамилия не должна превышать 255 символов').optional(),
  middleName: z.string().max(255, 'Отчество не должно превышать 255 символов').optional(),
  email: z.string().email('Некорректный формат email').optional(),
  avatarUrl: z.string().url('Некорректный формат URL').optional(),
  role: z.nativeEnum(UserRole, {
    message: 'Роль должна быть одним из: USER, MODERATOR',
  }).optional(),
  organisationId: z.number().int().positive('ID организации должен быть положительным числом').nullable().optional(),
});

export type UpdateUserV2Dto = z.infer<typeof updateUserV2Schema>;

export class UpdateUserV2DtoClass {
  @ApiProperty({ description: 'Имя', example: 'Иван', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Фамилия', example: 'Иванов', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Отчество', example: 'Иванович', required: false })
  middleName?: string;

  @ApiProperty({ description: 'Email', example: 'ivan@example.com', required: false })
  email?: string;

  @ApiProperty({ 
    description: 'URL аватарки (одна ссылка). Будет преобразована в объект с ключами 4-9 и одинаковым URL', 
    example: 'https://example.com/avatar.png', 
    required: false 
  })
  avatarUrl?: string;

  @ApiProperty({ description: 'Роль пользователя', enum: UserRole, example: UserRole.USER, required: false })
  role?: UserRole;

  @ApiProperty({ description: 'ID организации', example: 1, required: false, nullable: true })
  organisationId?: number | null;
}

