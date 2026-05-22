/**
 * Bootstrap Nest HTTP/microservice — ValidationPipe + listen.
 * (EN: Nest bootstrap — ValidationPipe and listen.)
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
 * Khoi tao Nest app — ValidationPipe toan cuc va lang nghe cong.
 * (EN: Bootstrap Nest app — global ValidationPipe and listen on port.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cong: ConfigService namespace app.port (tu app.config.ts / .env).
    // (EN: Port from ConfigService app.port (via app.config.ts / .env).)
    await app.listen(port, "0.0.0.0")
}
