import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.body?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token не предоставлен');
    }

    try {
      const refreshTokenSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET') ||
        'your-secret-key';

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshTokenSecret,
      });

      // Добавляем информацию о пользователе в request для использования в контроллере
      request.user = {
        userId: payload.sub,
        email: payload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }
}

