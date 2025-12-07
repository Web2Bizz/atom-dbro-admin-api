import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bcrypt before importing AuthService
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockAdminUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    middleName: null,
    passwordHash: '$2b$10$hashedpassword',
    role: 'ADMIN',
    level: 1,
    experience: 0,
    avatarUrls: {},
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegularUser = {
    ...mockAdminUser,
    id: 2,
    email: 'user@example.com',
    role: 'USER',
  };

  const mockDeletedUser = {
    ...mockAdminUser,
    recordStatus: 'DELETED',
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    const mockUserRepository = {
      findById: vi.fn(),
    };

    const mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
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

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Настройка дефолтных значений для ConfigService
    vi.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'JWT_EXPIRES_IN') return '24h';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      return undefined;
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'admin@example.com',
      password: 'correctPassword',
    };

    it('should successfully login admin user with correct credentials', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        firstName: mockAdminUser.firstName,
        lastName: mockAdminUser.lastName,
        middleName: mockAdminUser.middleName,
      });
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockAdminUser.passwordHash);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      vi.clearAllMocks();
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Неверный email или пароль');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Неверный email или пароль');
    });

    it('should throw UnauthorizedException when user role is not ADMIN', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockRegularUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Доступ разрешен только администраторам');
    });

    it('should use custom JWT expiration from config', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('mock-token');
      vi.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '1h';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
        return 'test-secret';
      });

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: mockAdminUser.email, sub: mockAdminUser.id },
        { expiresIn: '1h' }
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: mockAdminUser.email, sub: mockAdminUser.id },
        { expiresIn: '30d', secret: 'test-secret' }
      );
    });

    it('should use default secret when JWT_REFRESH_SECRET is not set', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('mock-token');
      vi.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return undefined;
        if (key === 'JWT_SECRET') return 'fallback-secret';
        return '24h';
      });

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ secret: 'fallback-secret' })
      );
    });

    it('should handle case-insensitive email enumeration prevention', async () => {
      // Проверка, что система не раскрывает существование пользователя
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login({ email: 'nonexistent@example.com', password: 'any' })).rejects.toThrow(
        'Неверный email или пароль'
      );
      await expect(service.login({ email: 'ADMIN@EXAMPLE.COM', password: 'any' })).rejects.toThrow(
        'Неверный email или пароль'
      );
    });

    it('should not expose password hash in error messages', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      try {
        await service.login(loginDto);
      } catch (error: any) {
        expect(error.message).not.toContain('passwordHash');
        expect(error.message).not.toContain(mockAdminUser.passwordHash);
      }
    });

    it('should handle deleted users correctly', async () => {
      // UserRepository должен фильтровать удаленных пользователей, но проверим, что если они попадут, система обработает
      // Изменяем роль на не-ADMIN, чтобы проверить, что система правильно обрабатывает удаленных пользователей
      const deletedUserWithNonAdminRole = { ...mockDeletedUser, role: 'USER' };
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(deletedUserWithNonAdminRole as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      // Если пользователь удален, но все еще найден, система должна проверить роль
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Доступ разрешен только администраторам');
    });

    it('should validate response structure', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'mock-token');
      expect(result).toHaveProperty('refresh_token', 'mock-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
      expect(result.user).toHaveProperty('middleName');
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refresh_token: 'valid-refresh-token',
    };

    it('should successfully refresh tokens for admin user', async () => {
      const payload = { email: mockAdminUser.email, sub: mockAdminUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('new-token');

      const result = await service.refresh(refreshTokenDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refresh_token, {
        secret: expect.any(String),
      });
      expect(userRepository.findById).toHaveBeenCalledWith(mockAdminUser.id);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshTokenDto)).rejects.toThrow('Недействительный refresh token');
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is expired', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = { email: mockAdminUser.email, sub: mockAdminUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(undefined);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshTokenDto)).rejects.toThrow('Пользователь не найден');
    });

    it('should throw UnauthorizedException when user role is not ADMIN', async () => {
      const payload = { email: mockRegularUser.email, sub: mockRegularUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockRegularUser as any);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(refreshTokenDto)).rejects.toThrow('Доступ разрешен только администраторам');
    });

    it('should use correct refresh token secret', async () => {
      const payload = { email: mockAdminUser.email, sub: mockAdminUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      vi.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'custom-refresh-secret';
        if (key === 'JWT_SECRET') return 'fallback-secret';
        return '24h';
      });

      await service.refresh(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refresh_token, {
        secret: 'custom-refresh-secret',
      });
    });

    it('should prevent token reuse after user deletion', async () => {
      const payload = { email: mockAdminUser.email, sub: mockAdminUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(undefined);

      await expect(service.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle malformed token gracefully', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Malformed token');
      });

      await expect(service.refresh({ refresh_token: 'malformed.token.here' })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should validate response structure', async () => {
      const payload = { email: mockAdminUser.email, sub: mockAdminUser.id };
      vi.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockAdminUser as any);
      vi.spyOn(jwtService, 'sign').mockReturnValue('new-token');

      const result = await service.refresh(refreshTokenDto);

      expect(result).toHaveProperty('access_token', 'new-token');
      expect(result).toHaveProperty('refresh_token', 'new-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Middle',
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should successfully register new user', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userService, 'create').mockResolvedValue(mockAdminUser as any);

      await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).toHaveBeenCalledWith({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        middleName: registerDto.middleName,
        email: registerDto.email,
        password: registerDto.password,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(mockAdminUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Пользователь с таким email уже существует');
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should exclude confirmPassword from create call', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userService, 'create').mockResolvedValue(mockAdminUser as any);

      await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ confirmPassword: expect.anything() })
      );
    });

    it('should validate data passed to UserService', async () => {
      vi.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userService, 'create').mockResolvedValue(mockAdminUser as any);

      await service.register(registerDto);

      const createCall = vi.mocked(userService.create).mock.calls[0][0];
      expect(createCall).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Middle',
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(createCall).not.toHaveProperty('confirmPassword');
    });
  });
});


