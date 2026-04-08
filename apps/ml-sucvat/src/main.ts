import {
    NestFactory 
} from "@nestjs/core"
import {
    MlSucvatModule 
} from "./ml-sucvat.module"

async function bootstrap() {
    const app = await NestFactory.create(MlSucvatModule)
    await app.listen(process.env.port ?? 3002)
}
bootstrap()
