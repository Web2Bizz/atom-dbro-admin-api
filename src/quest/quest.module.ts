import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';
import { QuestEventsService } from './quest.events';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QuestController],
  providers: [QuestService, QuestEventsService],
  exports: [QuestService, QuestEventsService],
})
export class QuestModule {}

