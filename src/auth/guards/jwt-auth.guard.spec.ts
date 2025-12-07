import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (
    isPublic = false,
    user: any = null,
    err: any = null,
    info: any = null
  ): ExecutionContext => {
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    return context;
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    // Создаем guard напрямую с моком reflector
    guard = new JwtAuthGuard(mockReflector);
    reflector = mockReflector;
  });

  describe('canActivate', () => {
    it('should allow access for public endpoints', () => {
      const context = createMockExecutionContext(true);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for non-public endpoints', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const superCanActivateSpy = vi.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');

      // Мокируем super.canActivate
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      superCanActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should allow access for public endpoints even without user', () => {
      const context = createMockExecutionContext(true);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.handleRequest(null, null, null, context);

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when error exists and is HttpException', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const error = new UnauthorizedException('Token expired');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is missing', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null, context)).toThrow('Токен не предоставлен или недействителен');
    });

    it('should throw UnauthorizedException with correct message for JsonWebTokenError', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      // Если есть message, оно используется вместо специального сообщения
      const info = { name: 'JsonWebTokenError' };

      expect(() => guard.handleRequest(null, null, info, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info, context)).toThrow('Недействительный токен');
    });

    it('should throw UnauthorizedException with correct message for TokenExpiredError', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      // Если есть message, оно используется вместо специального сообщения
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(null, null, info, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info, context)).toThrow('Токен истёк');
    });

    it('should throw UnauthorizedException with custom message from info', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const info = { message: 'Custom error message' };

      expect(() => guard.handleRequest(null, null, info, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info, context)).toThrow('Custom error message');
    });

    it('should throw BadRequestException when user role is not ADMIN', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const user = { id: 1, email: 'user@example.com', role: 'USER' };

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(BadRequestException);
      expect(() => guard.handleRequest(null, user, null, context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should allow access for admin user', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const user = { id: 1, email: 'admin@example.com', role: 'ADMIN' };

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException with default message when no specific error info', () => {
      const context = createMockExecutionContext(false);
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
      // Когда нет user и нет err, используется сообщение "Токен не предоставлен или недействителен"
      expect(() => guard.handleRequest(null, null, null, context)).toThrow('Токен не предоставлен или недействителен');
    });
  });
});

