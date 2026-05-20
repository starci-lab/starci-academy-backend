import {
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
import type {
    AppConfig,
} from "./config"

/**
 * Khoi tao Nest app voi ValidationPipe toan cuc va cong tu ConfigModule.
 * (EN: Bootstraps the Nest app with a global ValidationPipe and ConfigModule port.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
    }))

    const config = app.get(ConfigService)
    const port = config.get<AppConfig>("app")?.port ?? 3000
    // Cong lang nghe lay tu ConfigModule de chay giong nhau trong Docker va local.
    // (EN: Listen port comes from ConfigModule for consistent Docker and local runs.)
    await app.listen(port, "0.0.0.0")
}
