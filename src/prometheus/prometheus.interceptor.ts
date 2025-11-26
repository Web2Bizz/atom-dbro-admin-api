import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const route = this.getRoute(request);
    const startTime = Date.now();

    // Пропускаем сбор метрик для самого endpoint /metrics
    if (route === '/metrics' || request.path === '/metrics' || request.originalUrl?.includes('/metrics')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = (Date.now() - startTime) / 1000;
        // Используем статус код из response, если доступен, иначе 200
        const statusCode = response.statusCode || 200;

        // Записываем метрики для успешных запросов
        this.prometheusService.incrementHttpRequests(method, route, statusCode);
        this.prometheusService.recordHttpRequestDuration(method, route, duration);
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = error.status || error.statusCode || response.statusCode || 500;
        const errorType = error.constructor?.name || 'UnknownError';

        // Записываем метрики для ошибок
        this.prometheusService.incrementHttpRequests(method, route, statusCode);
        this.prometheusService.recordHttpRequestDuration(method, route, duration);
        this.prometheusService.incrementHttpErrors(method, route, statusCode, errorType);

        return throwError(() => error);
      }),
    );
  }

  /**
   * Получает нормализованный маршрут из запроса
   */
  private getRoute(request: any): string {
    // Используем route.path если доступен (NestJS)
    if (request.route?.path) {
      return request.route.path;
    }

    // Используем originalUrl или path
    const url = request.originalUrl || request.url || '/';

    // Убираем query параметры
    const path = url.split('?')[0];

    // Нормализуем путь (убираем версию API и префикс для более чистых метрик)
    let normalizedPath = path.replace(/^\/admin\/api\/v\d+\//, '/');
    normalizedPath = normalizedPath.replace(/^\/admin\/api\//, '/');

    // Заменяем ID параметры на :id для группировки
    normalizedPath = normalizedPath.replace(/\/\d+/g, '/:id');
    normalizedPath = normalizedPath.replace(/\/[a-f0-9-]{36}/gi, '/:id'); // UUID

    return normalizedPath || '/';
  }
}

