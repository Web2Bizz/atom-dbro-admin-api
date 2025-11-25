import { ExecutionContext, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ValidateTokenGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Если есть ошибка или пользователь отсутствует
    if (err || !user) {
      // Если ошибка уже является HttpException, пробрасываем её, но с нашим сообщением
      if (err && (err.statusCode || err instanceof UnauthorizedException)) {
        throw new UnauthorizedException('Токен не валиден');
      }
      
      // Для всех остальных случаев невалидного токена
      throw new UnauthorizedException('Токен не валиден');
    }
    
    // Проверяем, что пользователь имеет роль ADMIN
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Доступ разрешен только администраторам');
    }
    
    return user;
  }
}

