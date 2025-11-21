import { Module } from '@nestjs/common';
import { HelpTypeService } from './help-type.service';
import { HelpTypeController } from './help-type.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HelpTypeController],
  providers: [HelpTypeService],
  exports: [HelpTypeService],
})
export class HelpTypeModule {}

