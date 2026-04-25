import { Injectable } from '@nestjs/common';

@Injectable()
export class BackupService {
  getHello(): string {
    return 'Hello World!';
  }
}
