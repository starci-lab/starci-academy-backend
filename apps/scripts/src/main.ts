import {
    NestFactory 
} from "@nestjs/core"
import {
    ScriptsModule 
} from "./app.module"

async function bootstrap() {
    const app = await NestFactory.create(ScriptsModule)
    await app.listen(process.env.port ?? 3000)
}
bootstrap()
