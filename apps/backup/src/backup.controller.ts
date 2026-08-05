import {
    Controller, Get 
} from "@nestjs/common"
import {
    BackupService 
} from "./backup.service"

@Controller()
/**
 * HTTP `/` probe so the leftover `apps/backup` process has a liveness route.
 * Not the dump trigger — production dumps are `@features/backup` crons inside
 * core.
 */
export class BackupController {
    constructor(private readonly backupService: BackupService) {}

  @Get()
    getHello(): string {
        return this.backupService.getHello()
    }
}
