import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./backup.module-definition"
import {
    PgBackupModule 
} from "./pg"

@Module({
    imports: [
        PgBackupModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
/**
 * Feature root that globally exposes PG dump crons. Composed into core — not
 * `apps/backup` — so dumps share the API process scheduler/env instead of a
 * second deployable.
 */
export class BackupModule extends ConfigurableModuleClass {}

