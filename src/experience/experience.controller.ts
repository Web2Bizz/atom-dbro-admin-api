import { Controller, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { AddExperienceDto, addExperienceSchema, AddExperienceDtoClass } from './dto/add-experience.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('Опыт')
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Patch(':userId')
  @ApiBearerAuth()
  @ZodValidation(addExperienceSchema)
  @ApiOperation({ summary: 'Добавить опыт пользователю' })
  @ApiBody({ type: AddExperienceDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Опыт успешно добавлен, уровень обновлен',
    type: AddExperienceDtoClass,
    schema: {
      type: 'object',
      properties: {
        level: { type: 'number', example: 3 },
        experience: { type: 'number', example: 300 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async addExperience(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() addExperienceDto: AddExperienceDto,
  ) {
    return this.experienceService.addExperience(userId, addExperienceDto.amount);
  }
}

