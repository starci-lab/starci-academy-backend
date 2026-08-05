import {
    Injectable 
} from "@nestjs/common"

@Injectable()
/**
 * Scaffold hello-world so the `apps/backup` package still boots. Real
 * dump/encrypt/upload lives in `PgBackupService` under `@features/backup`.
 */
export class BackupService {
    getHello(): string {
        return "Hello World!"
    }
}
