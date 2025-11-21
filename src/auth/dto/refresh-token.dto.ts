import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token обязателен'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export class RefreshTokenDtoClass {
  @ApiProperty({ 
    description: 'Refresh token для обновления access token', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  refresh_token: string;
}


