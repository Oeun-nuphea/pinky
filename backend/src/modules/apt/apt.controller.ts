import { Controller, Get, Req } from '@nestjs/common';
import { AptService } from './apt.service';
import { Request } from 'express';

@Controller('api/apt')
export class AptController {
  constructor(private readonly aptService: AptService) {}

  @Get('info')
  getAptInfo(@Req() req: Request) {
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    return this.aptService.getRepoInstructions(`${protocol}://${host}`);
  }

  @Get('reindex')
  reindex() {
    this.aptService.generateAptRepoIndex();
    return { success: true, message: 'APT repository indexes re-generated' };
  }
}
