/**
 * Nest bootstrap — ValidationPipe and listen.
 */
import {
    Logger,
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    NestFactory,
} from "@nestjs/core"
import {
    AppModule,
} from "./app.module"

/**
 * Bootstrap Nest app — global ValidationPipe and listen on port.
 */
export async function bootstrap(): Promise<void> {
    const logger = new Logger("Bootstrap")
    const app = await NestFactory.create(AppModule)

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Port from ConfigService app.port (via app.config.ts).
    await app.listen(port, "0.0.0.0")
    logger.log(`API Pod is running on: ${await app.getUrl()}`)
}
