import { Controller, Get } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  getHello(): string {
    return this.backupService.getHello();
  }
}
