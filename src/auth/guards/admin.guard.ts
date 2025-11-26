import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { UserRole } from '../../user/user.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Если пользователь не найден, выбрасываем 401
    if (!user) {
      throw new UnauthorizedException('Не авторизован');
    }

    // Если пользователь не админ, выбрасываем 401
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Доступ разрешен только администраторам');
    }

    return true;
  }
}

