import {
    Module 
} from "@nestjs/common"
import {
    BackupController 
} from "./backup.controller"
import {
    BackupService 
} from "./backup.service"

@Module({
    imports: [],
    controllers: [BackupController],
    providers: [BackupService],
})
/**
 * Nest scaffold root for `apps/backup`. Do not add dump providers here -- that
 * would fork the cron path from `@features/backup` already wired into core.
 */
export class BackupModule {}
