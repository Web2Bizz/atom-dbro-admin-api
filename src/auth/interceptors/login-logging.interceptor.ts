import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * Интерцептор для логирования попыток входа
 * Логирует попытку входа, успешный вход и неуспешные попытки
 */
@Injectable()
export class LoginLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoginLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const loginDto = request.body;
    const email = loginDto?.email;

    if (email) {
      this.logger.log(`Попытка входа: ${email}`);
    }

    return next.handle().pipe(
      tap((result) => {
        if (email && result?.user?.id) {
          this.logger.log(`Успешный вход: ${email} (ID: ${result.user.id})`);
        }
      }),
      catchError((error) => {
        if (email) {
          this.logger.warn(
            `Неуспешный вход: ${email} - ${error.message || 'Неверный email или пароль'}`,
          );
        }
        return throwError(() => error);
      }),
    );
  }
}

