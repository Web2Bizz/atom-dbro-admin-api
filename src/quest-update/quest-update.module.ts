import { Module } from '@nestjs/common';
import { QuestUpdateService } from './quest-update.service';
import { QuestUpdateController } from './quest-update.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QuestUpdateController],
  providers: [QuestUpdateService],
  exports: [QuestUpdateService],
})
export class QuestUpdateModule {}

