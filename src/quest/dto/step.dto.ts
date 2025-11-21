import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod/v4';

export const requirementSchema = z.object({
  currentValue: z.number().int().default(0),
  targetValue: z.number().int().default(0),
}).optional();

export const stepSchema = z.object({
  title: z.string().min(1, 'Название этапа обязательно').max(255, 'Название не должно превышать 255 символов'),
  description: z.string().optional(),
  status: z.string().min(1, 'Статус этапа обязателен'),
  progress: z.number().int().min(0, 'Прогресс должен быть от 0 до 100').max(100, 'Прогресс должен быть от 0 до 100'),
  requirement: requirementSchema,
  deadline: z.string().datetime().optional().or(z.date().optional()),
});

export type StepDto = z.infer<typeof stepSchema>;

export class StepDtoClass {
  @ApiProperty({ description: 'Название этапа', example: 'Собрать одежду' })
  title: string;

  @ApiProperty({ description: 'Описание этапа', example: 'Собрать теплую одежду для бездомных', required: false })
  description?: string;

  @ApiProperty({ description: 'Статус этапа', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Прогресс выполнения этапа (0-100)', example: 0, minimum: 0, maximum: 100 })
  progress: number;

  @ApiProperty({ description: 'Требование этапа (объект)', example: { currentValue: 0, targetValue: 10 }, required: false })
  requirement?: {
    currentValue: number;
    targetValue: number;
  };

  @ApiProperty({ description: 'Дедлайн этапа', example: '2024-12-31T23:59:59Z', required: false })
  deadline?: Date | string;
}

