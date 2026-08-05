
// Sentry must init before any other sentry symbol (filters/Nest module) is
// loaded -- importing the Nest module would pull those in too early.
import "@modules/integrations/sentry/instrument"
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
    envConfig,
} from "@modules/platform/env/config"
import compression from "compression"
import {
    setupCors,
} from "@modules/platform/cors/setup"
import {
    setupHelmet,
} from "@modules/platform/helmet/setup"
import {
    setupCookie,
} from "@modules/platform/cookie/setup"
import {
    setupSwagger,
} from "@modules/docs/utils/setup-swagger"
import {
    RedisIoAdapter,
} from "@modules/platform/socketio/adapters/redis-io-adapter"
import {
    createRedisKey,
} from "@modules/lib/native/redis/constants"
import {
    RedisInstanceKey,
} from "@modules/lib/native/redis/enums/instance-key"
import {
    RedisClient,
} from "@modules/lib/native/redis/types/client"
import {
    ContextLoggerService,
} from "@modules/platform/logger/context-logger.service"
import {
    SwaggerAuthenticationType,
} from "@modules/docs/enums/swagger-authentication"
import {
    ResponseDelayInterceptor,
} from "@modules/api/interceptors/response-delay.interceptor"

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
