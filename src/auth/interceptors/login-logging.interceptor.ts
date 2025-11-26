import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrometheusService } from '../../prometheus/prometheus.service';

/**
 * Интерцептор для логирования попыток входа
 * Логирует попытку входа, успешный вход и неуспешные попытки
 * Собирает метрики Prometheus для мониторинга
 */
@Injectable()
export class LoginLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoginLoggingInterceptor.name);

  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const loginDto = request.body;
    const email = loginDto?.email;
    const startTime = Date.now();

    if (email) {
      this.logger.log(`Попытка входа: ${email}`);
    }

    return next.handle().pipe(
      tap((result) => {
        const duration = (Date.now() - startTime) / 1000;
        
        if (email && result?.user?.id) {
          this.logger.log(`Успешный вход: ${email} (ID: ${result.user.id})`);
          
          // Записываем метрики для успешного входа
          this.prometheusService.incrementLoginAttempts('success');
          this.prometheusService.recordLoginDuration('success', duration);
        }
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const errorMessage = error.message || 'Неверный email или пароль';
        
        if (email) {
          this.logger.warn(`Неуспешный вход: ${email} - ${errorMessage}`);
        }

        // Определяем причину ошибки
        let reason = 'unknown';
        if (errorMessage.includes('email') || errorMessage.includes('пароль') || errorMessage.includes('password')) {
          reason = 'invalid_credentials';
        } else if (errorMessage.includes('не найден') || errorMessage.includes('not found')) {
          reason = 'user_not_found';
        } else if (errorMessage.includes('заблокирован') || errorMessage.includes('blocked')) {
          reason = 'user_blocked';
        } else if (error.status === 401) {
          reason = 'unauthorized';
        }

        // Записываем метрики для неуспешного входа
        this.prometheusService.incrementLoginAttempts('failure', reason);
        this.prometheusService.recordLoginDuration('failure', duration);

        return throwError(() => error);
      }),
    );
  }
}

