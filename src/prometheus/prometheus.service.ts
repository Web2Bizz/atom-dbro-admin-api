import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class PrometheusService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_errors_total')
    private readonly httpErrorsTotal: Counter<string>,
    @InjectMetric('login_attempts_total')
    private readonly loginAttemptsTotal: Counter<string>,
    @InjectMetric('login_duration_seconds')
    private readonly loginDuration: Histogram<string>,
  ) {}

  /**
   * Увеличивает счетчик HTTP запросов
   */
  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  /**
   * Записывает длительность HTTP запроса
   */
  recordHttpRequestDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
      },
      duration,
    );
  }

  /**
   * Увеличивает счетчик HTTP ошибок
   */
  incrementHttpErrors(method: string, route: string, statusCode: number, errorType?: string) {
    this.httpErrorsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      error_type: errorType || 'unknown',
    });
  }

  /**
   * Увеличивает счетчик попыток входа
   */
  incrementLoginAttempts(status: 'success' | 'failure', reason?: string) {
    this.loginAttemptsTotal.inc({
      status,
      reason: reason || 'unknown',
    });
  }

  /**
   * Записывает длительность попытки входа
   */
  recordLoginDuration(status: 'success' | 'failure', duration: number) {
    this.loginDuration.observe(
      {
        status,
      },
      duration,
    );
  }
}

