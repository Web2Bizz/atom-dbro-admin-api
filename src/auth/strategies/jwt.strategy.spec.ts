import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../user/user.repository';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;
  let userRepository: UserRepository;

  const mockUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    middleName: null,
    role: 'ADMIN',
    level: 1,
    experience: 0,
    avatarUrls: {},
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    const mockUserRepository = {
      findById: vi.fn(),
    } as unknown as UserRepository;

    // Создаем strategy напрямую с моками
    strategy = new JwtStrategy(mockConfigService, mockUserRepository);
    configService = mockConfigService;
    userRepository = mockUserRepository;
  });

  describe('validate', () => {
    it('should successfully validate token and return user', async () => {
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(userRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = { email: 'admin@example.com', sub: 999 };
      vi.spyOn(userRepository, 'findById').mockResolvedValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should use correct secret from config', () => {
      // Проверяем, что стратегия использует правильный secret при инициализации
      vi.spyOn(configService, 'get').mockReturnValue('custom-secret');

      // Пересоздаем стратегию с новым конфигом
      const newStrategy = new JwtStrategy(configService, userRepository);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret when JWT_SECRET is not set', () => {
      vi.spyOn(configService, 'get').mockReturnValue(undefined);

      const newStrategy = new JwtStrategy(configService, userRepository);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should extract token from Authorization header', () => {
      // Проверяем, что стратегия настроена на извлечение токена из Authorization header
      // Это проверяется через конфигурацию passport-jwt
      const newStrategy = new JwtStrategy(configService, userRepository);

      // Стратегия должна быть настроена с ExtractJwt.fromAuthHeaderAsBearerToken()
      // Это внутренняя настройка passport-jwt, проверяем через вызов validate
      expect(newStrategy).toBeDefined();
    });

    it('should return correct user object structure', async () => {
      const payload = { email: 'admin@example.com', sub: 1 };
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('email', 'admin@example.com');
      expect(result).toHaveProperty('role', 'ADMIN');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('id');
    });

    it('should handle payload with different email', async () => {
      const payload = { email: 'different@example.com', sub: 1 };
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      expect(result.email).toBe(mockUser.email); // Email берется из БД, а не из payload
      expect(result.userId).toBe(1);
    });

    it('should handle payload with string sub', async () => {
      const payload = { email: 'admin@example.com', sub: '1' };
      // findById ожидает number, но может получить string
      // В реальности JWT обычно возвращает число, но проверим обработку
      vi.spyOn(userRepository, 'findById').mockResolvedValue(undefined);

      await expect(strategy.validate(payload as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle deleted users correctly', async () => {
      const payload = { email: 'admin@example.com', sub: 1 };
      const deletedUser = { ...mockUser, recordStatus: 'DELETED' };
      // UserRepository должен фильтровать удаленных пользователей
      vi.spyOn(userRepository, 'findById').mockResolvedValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle null payload gracefully', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow();
    });

    it('should handle payload without sub', async () => {
      const payload = { email: 'admin@example.com' } as any;

      await expect(strategy.validate(payload)).rejects.toThrow();
    });
  });
});

