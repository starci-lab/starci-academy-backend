import {
    NestFactory 
} from "@nestjs/core"
import {
    BackupModule 
} from "./backup.module"
import {
    envConfig,
} from "@modules/env"

async function bootstrap() {
    const app = await NestFactory.create(BackupModule)
    await app.listen(envConfig().services.backup.port)
}
bootstrap()
