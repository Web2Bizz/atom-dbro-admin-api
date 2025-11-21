import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Version,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, createUserSchema, CreateUserDtoClass } from './dto/create-user.dto';
import { UpdateUserDto, updateUserSchema, UpdateUserDtoClass } from './dto/update-user.dto';
import { UpdateUserV2Dto, updateUserV2Schema, UpdateUserV2DtoClass } from './dto/update-user-v2.dto';
import { ChangePasswordDto, changePasswordSchema, ChangePasswordDtoClass } from './dto/change-password.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Пользователи')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ZodValidation(createUserSchema)
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiBody({ type: CreateUserDtoClass })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан', type: CreateUserDtoClass })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll() {
    return this.userService.findAll();
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ZodValidation(changePasswordSchema)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Изменить пароль (требуется авторизация)' })
  @ApiBody({ type: ChangePasswordDtoClass })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 401, description: 'Неверный старый пароль или не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  changePassword(
    @CurrentUser() user: { userId: number; email: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user.userId, changePasswordDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Version('2')
  @ZodValidation(updateUserV2Schema)
  @ApiOperation({ summary: 'Обновить пользователя (v2) - принимает одну ссылку на аватар' })
  @ApiBody({ type: UpdateUserV2DtoClass })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен', type: UpdateUserV2DtoClass })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  updateV2(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserV2Dto: UpdateUserV2Dto,
  ) {
    return this.userService.updateV2(id, updateUserV2Dto);
  }

  @Patch(':id')
  @Version('1')
  @ZodValidation(updateUserSchema)
  @ApiOperation({ summary: 'Обновить пользователя (v1) - принимает объект avatarUrls' })
  @ApiBody({ type: UpdateUserDtoClass })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен', type: UpdateUserDtoClass })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}

