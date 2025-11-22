import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return user || null;
    }
    
    // Если есть ошибка или пользователь отсутствует
    if (err || !user) {
      // Если ошибка уже является HttpException (например, UnauthorizedException из JwtStrategy), пробрасываем её
      if (err && (err.statusCode || err instanceof UnauthorizedException)) {
        throw err;
      }
      
      // Определяем сообщение об ошибке
      let message = 'Необходима авторизация';
      if (info?.message) {
        message = info.message;
      } else if (info?.name === 'JsonWebTokenError') {
        message = 'Недействительный токен';
      } else if (info?.name === 'TokenExpiredError') {
        message = 'Токен истёк';
      } else if (!user && !err) {
        message = 'Токен не предоставлен или недействителен';
      }
      
      // Всегда выбрасываем UnauthorizedException для корректного статуса 401
      throw new UnauthorizedException(message);
    }
    
    return user;
  }
}

