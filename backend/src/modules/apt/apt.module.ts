import { Module } from '@nestjs/common';
import { AptController } from './apt.controller';
import { AptService } from './apt.service';

@Module({
  controllers: [AptController],
  providers: [AptService],
  exports: [AptService],
})
export class AptModule {}
