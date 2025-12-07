import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ValidateTokenGuard } from './validate-token.guard';

describe('ValidateTokenGuard', () => {
  let guard: ValidateTokenGuard;

  const createMockExecutionContext = (user: any = null, err: any = null, info: any = null): ExecutionContext => {
    return {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateTokenGuard],
    }).compile();

    guard = module.get<ValidateTokenGuard>(ValidateTokenGuard);
  });

  describe('handleRequest', () => {
    it('should allow access for admin user', () => {
      const context = createMockExecutionContext();
      const user = { id: 1, email: 'admin@example.com', role: 'ADMIN' };

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should throw BadRequestException when user role is not ADMIN', () => {
      const context = createMockExecutionContext();
      const user = { id: 1, email: 'user@example.com', role: 'USER' };

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(BadRequestException);
      expect(() => guard.handleRequest(null, user, null, context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should throw UnauthorizedException when user is missing', () => {
      const context = createMockExecutionContext();

      expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null, context)).toThrow('Токен не валиден');
    });

    it('should throw UnauthorizedException when error exists and is HttpException', () => {
      const context = createMockExecutionContext();
      const error = new UnauthorizedException('Token expired');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null, null, context)).toThrow('Токен не валиден');
    });

    it('should throw UnauthorizedException when error exists but is not HttpException', () => {
      const context = createMockExecutionContext();
      const error = new Error('Some error');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null, null, context)).toThrow('Токен не валиден');
    });

    it('should throw UnauthorizedException when user is missing and error exists', () => {
      const context = createMockExecutionContext();
      const error = new Error('Validation failed');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null, null, context)).toThrow('Токен не валиден');
    });

    it('should handle case when user has null role', () => {
      const context = createMockExecutionContext();
      const user = { id: 1, email: 'user@example.com', role: null };

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(BadRequestException);
      expect(() => guard.handleRequest(null, user, null, context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should handle case when user has undefined role', () => {
      const context = createMockExecutionContext();
      const user = { id: 1, email: 'user@example.com' };

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(BadRequestException);
      expect(() => guard.handleRequest(null, user, null, context)).toThrow('Доступ разрешен только администраторам');
    });

    it('should handle case when user role is empty string', () => {
      const context = createMockExecutionContext();
      const user = { id: 1, email: 'user@example.com', role: '' };

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(BadRequestException);
      expect(() => guard.handleRequest(null, user, null, context)).toThrow('Доступ разрешен только администраторам');
    });
  });
});




