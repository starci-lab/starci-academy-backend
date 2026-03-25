import {
    NestFactory 
} from "@nestjs/core"
import {
    AppModule 
} from "./app.module"
import {
    envConfig 
} from "@modules/env"

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    await app.listen(envConfig().services.githubWorker.port)
}
bootstrap()
