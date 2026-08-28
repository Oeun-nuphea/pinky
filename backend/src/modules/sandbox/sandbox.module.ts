import { Module } from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { TerminalGateway } from './terminal.gateway';

@Module({
  providers: [SandboxService, TerminalGateway],
  exports: [SandboxService],
})
export class SandboxModule {}
