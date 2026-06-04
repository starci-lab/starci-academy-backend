/**
 * Nest bootstrap — ValidationPipe and listen.
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    AppModule,
} from "./app.module"

/**
 * Bootstrap Nest app — global ValidationPipe and listen on port.
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3002
        // Port from ConfigService app.port (via app.config.ts / .env).
    await app.listen(port, "0.0.0.0")
}
