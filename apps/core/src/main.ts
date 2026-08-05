
// Sentry must init before any other `@modules/sentry` symbol (filters/Nest
// module) is loaded -- a barrel import would pull those in too early.
// eslint-disable-next-line starci-be/no-deep-module-import
import "@modules/sentry/instrument"
import {
    NestFactory
} from "@nestjs/core"
import type {
    NestExpressApplication
} from "@nestjs/platform-express"
import {
    AppModule
} from "./app.module"
import {
    envConfig 
} from "@modules/env"
import compression from "compression"
import {
    setupCors
} from "@modules/cors"
import {
    setupHelmet
} from "@modules/helmet"
import {
    setupCookie
} from "@modules/cookie"
import {
    setupSwagger 
} from "@modules/docs"
import {
    RedisIoAdapter 
} from "@modules/socketio"
import {
    createRedisKey, 
    RedisClient,
    RedisInstanceKey
} from "@modules/native"
import {
    ContextLoggerService 
} from "@modules/logger"
import {
    SwaggerAuthenticationType
} from "@modules/docs"
import {
    ResponseDelayInterceptor
} from "@modules/api"

const bootstrap = async () => {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
        {
            logger: new ContextLoggerService(),
            // keep the raw request buffer so Stripe webhook signatures can be verified
            rawBody: true,
        }
    )
    // trust the single upstream reverse proxy (Traefik) so `req.ip` reflects the
    // real client address from `X-Forwarded-For` instead of the proxy's IP --
    // needed for accurate per-device session IP/geo capture
    app.set("trust proxy",
        1)
    // set the app to the globalThis object
    globalThis.__APP__ = app
    // security headers must be attached before any route handler runs
    setupHelmet(app)
    setupCors(app)
    setupCookie(app)
    setupSwagger({
        app,
        title: "Starci Academy API",
        description: "Starci Academy API provides secure and structured access to the core backend services.",
        version: "1.0.0",
        basePath: "/api",
        useScalarDocs: true,
        swaggerEndpoint: "/swagger",
        scalarDocsEndpoint: "/scalar",
        enableAuthentication: true,
        authenticationType: SwaggerAuthenticationType.Bearer,
        authenticationName: "Authorization",
        enableVersioning: true,
    })
    app.use(compression())
    // dev-only artificial latency so the FE can exercise loading/skeleton states;
    // self-gated (off in production / unless API_RESPONSE_DELAY_ENABLE=true)
    app.useGlobalInterceptors(new ResponseDelayInterceptor())
    const redis = app.get<RedisClient>(
        createRedisKey(RedisInstanceKey.Adapter), 
        {
            strict: false 
        }
    )
    const redisIoAdapter = new RedisIoAdapter(app)
    redisIoAdapter.setClient(redis)
    await redisIoAdapter.connect()
    app.useWebSocketAdapter(redisIoAdapter)
    await app.listen(envConfig().services.core.port)
}
bootstrap()
