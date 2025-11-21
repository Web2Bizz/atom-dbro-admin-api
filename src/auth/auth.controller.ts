import { Controller, Post, Body, HttpCode, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, loginSchema, LoginDtoClass } from './dto/login.dto';
import { RefreshTokenDto, refreshTokenSchema, RefreshTokenDtoClass } from './dto/refresh-token.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { LoginLoggingInterceptor } from './interceptors/login-logging.interceptor';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(LoginLoggingInterceptor)
  @ZodValidation(loginSchema)
  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiBody({ type: LoginDtoClass })
  @ApiResponse({ status: 200, description: 'Успешный вход', type: LoginDtoClass })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ZodValidation(refreshTokenSchema)
  @ApiOperation({ summary: 'Обновить access token используя refresh token (требуется валидный refresh token в body)' })
  @ApiBody({ type: RefreshTokenDtoClass })
  @ApiResponse({ status: 200, description: 'Токены успешно обновлены', type: RefreshTokenDtoClass })
  @ApiResponse({ status: 401, description: 'Недействительный refresh token или refresh token не предоставлен' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }
}

