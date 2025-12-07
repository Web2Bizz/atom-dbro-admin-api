import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoginLoggingInterceptor } from './login-logging.interceptor';
import { PrometheusService } from '../../prometheus/prometheus.service';

describe('LoginLoggingInterceptor', () => {
  let interceptor: LoginLoggingInterceptor;
  let prometheusService: PrometheusService;

  const createMockExecutionContext = (body: any = {}): ExecutionContext => {
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (result: any = {}) => {
    return {
      handle: vi.fn().mockReturnValue(of(result)),
    } as CallHandler;
  };

  beforeEach(async () => {
    const mockPrometheusService = {
      incrementLoginAttempts: vi.fn(),
      recordLoginDuration: vi.fn(),
    } as unknown as PrometheusService;

    // Создаем interceptor напрямую с моком prometheusService
    interceptor = new LoginLoggingInterceptor(mockPrometheusService);
    prometheusService = mockPrometheusService;
  });

  describe('intercept', () => {
    it('should log successful login', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const handler = createMockCallHandler({
        user: { id: 1, email: 'admin@example.com' },
      });

      const result = await interceptor.intercept(context, handler).toPromise();

      expect(result).toHaveProperty('user');
      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('success');
      expect(prometheusService.recordLoginDuration).toHaveBeenCalledWith('success', expect.any(Number));
      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledTimes(1);
      expect(prometheusService.recordLoginDuration).toHaveBeenCalledTimes(1);
    });

    it('should log failed login with invalid credentials', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const error = new UnauthorizedException('Неверный email или пароль');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'invalid_credentials');
      expect(prometheusService.recordLoginDuration).toHaveBeenCalledWith('failure', expect.any(Number));
      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledTimes(1);
      expect(prometheusService.recordLoginDuration).toHaveBeenCalledTimes(1);
    });

    it('should log failed login with user not found', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const error = new UnauthorizedException('Пользователь не найден');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'user_not_found');
    });

    it('should log failed login with user blocked', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const error = new UnauthorizedException('Пользователь заблокирован');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'user_blocked');
    });

    it('should log failed login with unauthorized status', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const error = new UnauthorizedException('Unauthorized');
      (error as any).status = 401;
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'unauthorized');
    });

    it('should log failed login with unknown reason', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const error = new Error('Unknown error');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'unknown');
    });

    it('should record login duration for successful login', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const handler = createMockCallHandler({
        user: { id: 1, email: 'admin@example.com' },
      });

      await interceptor.intercept(context, handler).toPromise();

      expect(prometheusService.recordLoginDuration).toHaveBeenCalledWith('success', expect.any(Number));
      const duration = vi.mocked(prometheusService.recordLoginDuration).mock.calls[0][1];
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should record login duration for failed login', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      // Создаем ошибку без status 401, чтобы проверить invalid_credentials
      const error = new Error('Неверный email или пароль');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        // Expected
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', 'invalid_credentials');
      expect(prometheusService.recordLoginDuration).toHaveBeenCalledWith('failure', expect.any(Number));
      const duration = vi.mocked(prometheusService.recordLoginDuration).mock.calls[0][1];
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors without email', async () => {
      const context = createMockExecutionContext({});
      const error = new UnauthorizedException('Invalid credentials');
      const handler = {
        handle: vi.fn().mockReturnValue(throwError(() => error)),
      } as CallHandler;

      try {
        await interceptor.intercept(context, handler).toPromise();
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(prometheusService.incrementLoginAttempts).toHaveBeenCalled();
    });

    it('should handle successful login without user id', async () => {
      const context = createMockExecutionContext({ email: 'admin@example.com' });
      const handler = createMockCallHandler({
        access_token: 'token',
      });

      await interceptor.intercept(context, handler).toPromise();

      // Метрики для успешного входа не должны быть записаны, если нет user.id
      expect(prometheusService.incrementLoginAttempts).not.toHaveBeenCalled();
    });

    it('should determine error reason from error message', async () => {
      const testCases = [
        { message: 'Неверный email', reason: 'invalid_credentials' },
        { message: 'Неверный пароль', reason: 'invalid_credentials' },
        { message: 'password incorrect', reason: 'invalid_credentials' },
        { message: 'Пользователь не найден', reason: 'user_not_found' },
        { message: 'not found', reason: 'user_not_found' },
        { message: 'заблокирован', reason: 'user_blocked' },
        { message: 'blocked', reason: 'user_blocked' },
      ];

      for (const testCase of testCases) {
        const context = createMockExecutionContext({ email: 'admin@example.com' });
        const error = new UnauthorizedException(testCase.message);
        const handler = {
          handle: vi.fn().mockReturnValue(throwError(() => error)),
        } as CallHandler;

        vi.mocked(prometheusService.incrementLoginAttempts).mockClear();
        vi.mocked(prometheusService.recordLoginDuration).mockClear();

        try {
          await interceptor.intercept(context, handler).toPromise();
        } catch (e) {
          // Expected
        }

        expect(prometheusService.incrementLoginAttempts).toHaveBeenCalledWith('failure', testCase.reason);
        expect(prometheusService.recordLoginDuration).toHaveBeenCalledWith('failure', expect.any(Number));
      }
    });
  });
});

