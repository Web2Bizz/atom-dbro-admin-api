import { Module } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { AchievementRepository } from './achievement.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AchievementController],
  providers: [AchievementService, AchievementRepository],
  exports: [AchievementService, AchievementRepository],
})
export class AchievementModule {}

