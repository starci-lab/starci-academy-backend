import {
    NestFactory 
} from "@nestjs/core"
import {
    BackupModule 
} from "./backup.module"
import {
    envConfig,
} from "@modules/platform/env/config"

async function bootstrap() {
    const app = await NestFactory.create(BackupModule)
    await app.listen(envConfig().services.backup.port)
}
bootstrap()
