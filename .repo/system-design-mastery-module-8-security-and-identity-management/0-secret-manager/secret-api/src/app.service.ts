/**
 * Service logic chính của lesson — mọi method có JSDoc Logic + Code.
 * (EN: Core lesson service — methods documented with Logic + Code.)
 */
import { Injectable } from '@nestjs/common';

@Injectable()
/**
 * Class `AppService` — thành phần lab (controller/service/module).
 * (EN: Class `AppService` — lesson lab component.)
 */
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
