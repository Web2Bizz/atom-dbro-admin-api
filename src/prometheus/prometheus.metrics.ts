import { Counter, Histogram } from 'prom-client';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

/**
 * Метрика: Общее количество HTTP запросов
 */
export const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

/**
 * Метрика: Длительность HTTP запросов
 */
export const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * Метрика: Общее количество HTTP ошибок
 */
export const httpErrorsTotal = makeCounterProvider({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
});

/**
 * Метрика: Общее количество попыток входа
 */
export const loginAttemptsTotal = makeCounterProvider({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'reason'],
});

/**
 * Метрика: Длительность попыток входа
 */
export const loginDuration = makeHistogramProvider({
  name: 'login_duration_seconds',
  help: 'Duration of login attempts in seconds',
  labelNames: ['status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

