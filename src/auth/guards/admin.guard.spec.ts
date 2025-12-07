import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRole } from '../../user/user.types';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  const createMockExecutionContext = (user: any = null): ExecutionContext => {
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  describe('canActivate', () => {
    it('should allow access for admin user', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user role is ADMIN string', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user role is USER', () => {
      const context = createMockExecutionContext({
        id: 2,
        email: 'user@example.com',
        role: UserRole.USER,
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user role is USER string', () => {
      const context = createMockExecutionContext({
        id: 2,
        email: 'user@example.com',
        role: 'USER',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user is missing', () => {
      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Не авторизован');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Не авторизован');
    });

    it('should throw UnauthorizedException when user role is null', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'user@example.com',
        role: null,
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user role is undefined', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'user@example.com',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user role is empty string', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'user@example.com',
        role: '',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user role is invalid', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'user@example.com',
        role: 'INVALID_ROLE',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should use UserRole enum for comparison', () => {
      const context = createMockExecutionContext({
        id: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

