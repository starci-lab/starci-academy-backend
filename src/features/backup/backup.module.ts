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
export class BackupModule extends ConfigurableModuleClass {}

