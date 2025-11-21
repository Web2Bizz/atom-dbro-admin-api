import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Проверяем, существует ли пользователь
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Исключаем confirmPassword перед созданием пользователя
    const { confirmPassword, ...createUserDto } = registerDto;

    // Создаем пользователя
    await this.userService.create(createUserDto);
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Неверный email или пароль');
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверный email или пароль');
      }

      const payload = { email: user.email, sub: user.id };
      const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
      const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET') || 'your-secret-key';

      return {
        access_token: this.jwtService.sign(payload, { expiresIn: accessTokenExpiresIn }),
        refresh_token: this.jwtService.sign(payload, { 
          expiresIn: refreshTokenExpiresIn,
          secret: refreshTokenSecret,
        }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
        },
      };
    } catch (error) {
      this.logger.error(error);
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token, { secret: refreshTokenSecret });
      const user = await this.userService.findOne(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      const newPayload = { email: user.email, sub: user.id };
      const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
      const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

      return {
        access_token: this.jwtService.sign(newPayload, { expiresIn: accessTokenExpiresIn }),
        refresh_token: this.jwtService.sign(newPayload, { 
          expiresIn: refreshTokenExpiresIn,
          secret: refreshTokenSecret,
        }),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }
}

