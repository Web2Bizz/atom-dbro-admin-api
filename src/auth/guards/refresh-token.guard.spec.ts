import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenGuard } from './refresh-token.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const createMockExecutionContext = (body: any = {}): ExecutionContext => {
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockJwtService = {
      verify: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Настройка дефолтных значений
    vi.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_SECRET') return 'default-secret';
      return undefined;
    });
  });

  describe('canActivate', () => {
    it('should allow access with valid refresh token in body', async () => {
      const context = createMockExecutionContext({ refresh_token: 'valid-token' });
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      // Пересоздаем guard с правильным моком configService
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
          if (key === 'JWT_SECRET') return 'default-secret';
          return undefined;
        }),
      } as unknown as ConfigService;
      guard = new RefreshTokenGuard(jwtService, mockConfigService);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'refresh-secret',
      });
    });

    it('should throw UnauthorizedException when refresh_token is missing', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Refresh token не предоставлен');
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh_token is null', async () => {
      const context = createMockExecutionContext({ refresh_token: null });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Refresh token не предоставлен');
    });

    it('should throw UnauthorizedException when refresh_token is empty string', async () => {
      const context = createMockExecutionContext({ refresh_token: '' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Refresh token не предоставлен');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const context = createMockExecutionContext({ refresh_token: 'invalid-token' });
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Недействительный refresh token');
    });

    it('should throw UnauthorizedException when refresh token is expired', async () => {
      const context = createMockExecutionContext({ refresh_token: 'expired-token' });
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Недействительный refresh token');
    });

    it('should add user information to request after validation', async () => {
      const request: any = { body: { refresh_token: 'valid-token' } };
      const context = createMockExecutionContext({ refresh_token: 'valid-token' });
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      // Пересоздаем guard с правильным моком configService
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
          if (key === 'JWT_SECRET') return 'default-secret';
          return undefined;
        }),
      } as unknown as ConfigService;
      guard = new RefreshTokenGuard(jwtService, mockConfigService);

      // Мокируем getRequest для возврата нашего request объекта
      const getRequest = vi.fn().mockReturnValue(request);
      (context.switchToHttp as any).mockReturnValue({ getRequest });

      await guard.canActivate(context);

      expect(request.user).toEqual({
        userId: 1,
        email: 'admin@example.com',
      });
    });

    it('should use JWT_REFRESH_SECRET when available', async () => {
      const context = createMockExecutionContext({ refresh_token: 'valid-token' });
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      // Пересоздаем guard с новым моком configService
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'JWT_REFRESH_SECRET') return 'custom-refresh-secret';
          if (key === 'JWT_SECRET') return 'default-secret';
          return undefined;
        }),
      } as unknown as ConfigService;
      guard = new RefreshTokenGuard(jwtService, mockConfigService);

      await guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'custom-refresh-secret',
      });
    });

    it('should fallback to JWT_SECRET when JWT_REFRESH_SECRET is not set', async () => {
      const context = createMockExecutionContext({ refresh_token: 'valid-token' });
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      // Пересоздаем guard с новым моком configService
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'JWT_REFRESH_SECRET') return undefined;
          if (key === 'JWT_SECRET') return 'fallback-secret';
          return undefined;
        }),
      } as unknown as ConfigService;
      guard = new RefreshTokenGuard(jwtService, mockConfigService);

      await guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'fallback-secret',
      });
    });

    it('should use default secret when both secrets are not set', async () => {
      const context = createMockExecutionContext({ refresh_token: 'valid-token' });
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      // Пересоздаем guard с новым моком configService, который возвращает undefined
      const mockConfigService = {
        get: vi.fn(() => undefined),
      } as unknown as ConfigService;
      guard = new RefreshTokenGuard(jwtService, mockConfigService);

      await guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'your-secret-key',
      });
    });

    it('should handle malformed token gracefully', async () => {
      const context = createMockExecutionContext({ refresh_token: 'malformed.token.here' });
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Malformed token');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});

