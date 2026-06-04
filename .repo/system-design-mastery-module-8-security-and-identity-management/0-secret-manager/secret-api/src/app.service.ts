/**
 * Core lesson service — methods documented with Logic + Code.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
