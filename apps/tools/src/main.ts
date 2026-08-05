import {
    NestFactory,
} from "@nestjs/core"
import {
    // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI tools bootstrap
    Logger,
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import type {
    NestExpressApplication,
} from "@nestjs/platform-express"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AppModule,
} from "./app.module"

/**
 * Bootstraps the local-only ops "tools" service.
 *
 * Serves a Vite ops dashboard at `/dashboard` and exposes `/api/v1/tools/*`
 * endpoints for managing cloud infra from the operator's machine. The whole
 * surface is hard-blocked (404) in production: a single front middleware short-
 * circuits every request (covering the static dashboard), while the API routes
 * are additionally guarded by {@link LocalOnlyGuard} for defense in depth.
 */
const bootstrap = async () => {
    // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI tools bootstrap
    const logger = new Logger("ToolsBootstrap")
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    // production lockdown: pretend nothing here exists. Registered before the
    // static handler and the router so it covers /dashboard AND /api/v1/tools/*.
    if (envConfig().isProduction) {
        logger.warn("Tools console started with NODE_ENV=production — all routes will return 404.")
        app.use(
            (_request: unknown, response: { status: (code: number) => { send: (body: string) => void } }) => {
                response.status(404).send("Not Found")
            },
        )
    }

    // REST surface lives under /api/v1 to mirror the core app's conventions
    app.setGlobalPrefix("api")
    app.enableVersioning({
        type: VersioningType.URI,
    })
    // validate + transform request DTOs (also powers nested @ValidateNested)
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
    }))

    // serve the built Vite dashboard at /dashboard (base is "/dashboard/")
    const dashboardDir = join(
        process.cwd(),
        "apps",
        "tools",
        "dashboard",
        "dist",
    )
    app.useStaticAssets(dashboardDir,
        {
            prefix: "/dashboard",
        })
    // redirect the bare path to the trailing-slash index so relative asset
    // URLs in index.html resolve correctly
    app.use(
        "/dashboard",
        (request: { path: string }, response: { redirect: (url: string) => void }, next: () => void) => {
            if (request.path === "/" || request.path === "") {
                response.redirect("/dashboard/")
                return
            }
            next()
        },
    )

    await app.listen(envConfig().services.tools.port)
    logger.log(`Tools console ready on http://localhost:${envConfig().services.tools.port}/dashboard/`)
}
bootstrap()
