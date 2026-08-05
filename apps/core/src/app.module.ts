import {
    EnvModule,
} from "@modules/platform/env/env.module"
import {
    Module
} from "@nestjs/common"
import {
    ValidationPipe
} from "@nestjs/common"
import {
    ElasticsearchModule,
} from "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    WinstonLevel,
} from "@modules/platform/winston/types/level"
import {
    WinstonModule,
} from "@modules/platform/winston/winston.module"
import {
    ServiceName,
} from "@modules/lib/common/enums/service"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    IoRedisModule,
} from "@modules/lib/native/ioredis/ioredis.module"
import {
    RedisInstanceKey,
} from "@modules/lib/native/redis/enums/instance-key"
import {
    RedisModule,
} from "@modules/lib/native/redis/redis.module"
import {
    ThrottlerModule,
} from "@modules/platform/throttler/throttler.module"
import {
    FilesystemModule,
} from "@modules/filesystem/filesystem.module"
import {
    SentryModule,
} from "@modules/integrations/sentry/sentry.module"
import {
    MixinModule,
} from "@modules/lib/mixin/mixin.module"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    QdrantModule,
} from "@modules/databases/qdrant/qdrant.module"
import {
    S3Module,
} from "@modules/integrations/s3/s3.module"
import {
    AssetsModule,
} from "@modules/lib/assets/assets.module"
import {
    PayOSModule,
} from "@modules/integrations/payos/payos.module"
import {
    ScheduleModule
} from "@nestjs/schedule"
import {
    ApiModule,
} from "@features/api/api.module"
import {
    AxiosModule,
} from "@modules/integrations/axios/axios.module"
import {
    KeycloakModule,
} from "@modules/integrations/keycloak/keycloak.module"
import {
    JwtModule
} from "@nestjs/jwt"
import {
    APP_FILTER,
    APP_PIPE
} from "@nestjs/core"
import {
    AbstractExceptionHttpFilter,
} from "@modules/platform/exceptions/filters/abstract-exception-http.filter"
import {
    BullModule,
} from "@modules/integrations/bullmq/bullmq.module"
import {
    BussinessModule,
} from "@modules/bussiness/bussiness.module"
import {
    RoutingModule,
} from "@modules/platform/routing/routing.module"
import {
    LangchainModule,
} from "@modules/integrations/langchain/langchain.module"
import {
    RagModule,
} from "@modules/integrations/rag/rag.module"
import {
    CryptoModule,
} from "@modules/crypto/crypto.module"
import {
    TotpModule,
} from "@modules/integrations/totp/totp.module"
import {
    SepayModule,
} from "@modules/integrations/sepay/sepay.module"
import {
    StripeModule,
} from "@modules/integrations/stripe/stripe.module"
import {
    PaypalModule,
} from "@modules/integrations/paypal/paypal.module"
import {
    NowPaymentsModule,
} from "@modules/integrations/nowpayments/nowpayments.module"
import {
    SocketIoModule,
} from "@modules/platform/socketio/socketio.module"
import {
    CQRSModule,
} from "@modules/platform/cqrs/cqrs.module"
import {
    EventBusModule,
} from "@modules/platform/cqrs/event-bus/event-bus.module"
import {
    CqrsModule
} from "@nestjs/cqrs"
import {
    SocketIoModule as SocketIoFeatureModule,
} from "@features/socketio/socketio.module"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventModule,
} from "@modules/platform/event/event.module"
import {
    EventEmitterModule
} from "@nestjs/event-emitter"
import {
    CacheModule,
} from "@modules/integrations/cache/cache.module"
import {
    StreamAsyncIteratorModule,
} from "@modules/lib/stream-async-iterator/stream-async-iterator.module"
import {
    ValidatorsModule,
} from "@modules/lib/validators/validators.module"
import {
    GoogleApisModule,
} from "@modules/integrations/googleapis/googleapis.module"
import {
    MailModule,
} from "@modules/integrations/mailer/mailer.module"
import {
    BackupModule,
} from "@features/backup/backup.module"
import {
    ExecaModule,
} from "@modules/integrations/execa/execa.module"
import {
    CookieModule,
} from "@modules/platform/cookie/cookie.module"
import {
    CsrfModule,
} from "@modules/platform/csrf/csrf.module"
import {
    SessionModule,
} from "@modules/platform/session/session.module"
import {
    CaptchaModule,
} from "@modules/integrations/captcha/captcha.module"
import {
    CodeModule,
} from "@modules/integrations/code/code.module"
import {
    GithubModule,
} from "@modules/integrations/github/github.module"
import {
    InitModule,
} from "@modules/init/init.module"
import {
    FfmpegModule,
} from "@modules/integrations/ffmpeg/ffmpeg.module"
import {
    Bento4Module,
} from "@modules/integrations/bento4/bento4.module"
import {
    VideoEncoderModule,
} from "@features/video-encoder/video-encoder.module"
import {
    AiModule,
} from "@modules/ai/ai.module"
import {
    MembershipModule,
} from "@modules/membership/membership.module"
import {
    KafkaModule,
} from "@modules/integrations/kafka/kafka.module"
@Module(
    {
        imports: [
            /** Environment module. */
            EnvModule.forRoot(),
            /** Winston module. */
            WinstonModule.register(
                {
                    serviceName: ServiceName.Api,
                    level: WinstonLevel.Info,
                }
            ),
            /** Elasticsearch module. */
            ElasticsearchModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Mixin module. */
            MixinModule.register({
                isGlobal: true,
            }),
            /** Sentry module. */
            SentryModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** AI module -- includes the rotating API-key balancer. */
            AiModule.register({
                isGlobal: true,
            }),
            /** Community membership module -- entitlement grant/expiry. */
            MembershipModule.register({
                isGlobal: true,
            }),
            /** Kafka infrastructure module -- shared broker client for CDC/event listeners. */
            KafkaModule.register({
                isGlobal: true,
            }),
            /** Cookie module. */
            CookieModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** CSRF protection module. */
            CsrfModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Single-session enforcement module. */
            SessionModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Captcha (Cloudflare Turnstile) module. */
            CaptchaModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Github module. */
            GithubModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Bloom filters module. */
            /** Code module. */
            CodeModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Axios module. */
            AxiosModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Execa module. */
            ExecaModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Schedule module. */
            ScheduleModule.forRoot({
                cronJobs: true,
                intervals: true,
            }),
            /** Winston module. */
            WinstonModule.register(
                {
                    serviceName: ServiceName.Api,
                    level: WinstonLevel.Verbose,
                    isGlobal: true,
                }
            ),
            /** Crypto module. */
            CryptoModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** TOTP (two-factor) module. */
            TotpModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** CQRS module. */
            CqrsModule.forRoot(),
            CQRSModule.register({
                isGlobal: true,
            }),
            /** Jwt module. */
            JwtModule.register({
                global: true,
            }),
            /** Socket.IO module. */
            SocketIoFeatureModule.register({
                isGlobal: true,
            }),
            /** Mount filesystem module. */
            FilesystemModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** S3 module. */
            S3Module.register(
                {
                    isGlobal: true,
                }
            ),
            /** Assets module -- syncs local static brand assets to MinIO on boot. */
            AssetsModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Google APIs module. */
            GoogleApisModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** PayOS module (uses S3 for snapshots). */
            PayOSModule.register(
                {
                    isGlobal: true,
                }
            ),
            SepayModule.register(
                {
                    isGlobal: true
                }
            ),
            /** Stripe client module (international card gateway). */
            StripeModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** PayPal client module (international gateway). */
            PaypalModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** NOWPayments client module (crypto gateway -- USDT/USDC). */
            NowPaymentsModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** BullMQ module. */
            BullModule.forRoot(
                {
                    isGlobal: true,
                }
            ),
            /** Primary PostgreSQL module. */
            PrimaryPostgreSQLModule.register(
                {
                    isGlobal: true,
                    withResolvers: true,
                }
            ),
            /** Bussiness module. */
            BussinessModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Routing module -- provides LabelResolverService for id-only ref rendering. */
            RoutingModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Keycloak module. */
            KeycloakModule.register(
                {
                    isGlobal: true,
                }
            ),
            StreamAsyncIteratorModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Backup module. */
            BackupModule.register({
                isGlobal: true,
            }),
            /** IoRedis module. */
            RedisModule.register(
                {
                    instanceKeys: [
                        RedisInstanceKey.Adapter,
                        RedisInstanceKey.Cache,
                    ],
                    isGlobal: true,
                }
            ),
            IoRedisModule.register(
                {
                    instanceKeys: [
                        IoRedisInstanceKey.Cache,
                    ],
                    isGlobal: true,
                }
            ),
            /** Throttler module. */
            ThrottlerModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Qdrant module. */
            QdrantModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** LangChain module. */
            LangchainModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** RAG module (vector-store retrieval: lesson index/retrieval + grading retrieval). */
            RagModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Cache module. */
            CacheModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Vaildators module. */
            ValidatorsModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Event module. */
            EventEmitterModule.forRoot(),
            EventModule.register(
                {
                    isGlobal: true,
                    nats: {
                        subjects: [
                            EventName.JobStatusUpdated,
                        ],
                    },
                }
            ),
            /** Api module. */
            ApiModule.register(
                {
                    isGlobal: true,
                    useCore: true,
                    useProcessors: true,
                }
            ),
            /** Socket module. */
            SocketIoModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Event Bus module. */
            EventBusModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Mail module (Brevo SMTP + Pug templates). */
            MailModule.register(
                {
                    isGlobal: true,
                }
            ),
            /**
             * Init module -- boot-time seed/sync orchestrator. The git-sourced
             * `InitModule` pulls the private `data` repo (diff-based) before
             * seeding; it is the only init path (the parked local-file
             * LegacyInitModule has been retired).
             */
            InitModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Ffmpeg module. */
            FfmpegModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Bento4 module. */
            Bento4Module.register(
                {
                    isGlobal: true,
                }
            ),
            /** Video encoder module. */
            VideoEncoderModule.register(
                {
                    isGlobal: true,
                    useProcessors: true,
                    useCore: true,
                }
            ),
        ],
        providers: [
            {
                provide: APP_PIPE,
                useClass: ValidationPipe,
            },
            {
                provide: APP_FILTER,
                useClass: AbstractExceptionHttpFilter,
            },
        ],
    }
)
/**
 * Core API composition root -- GraphQL, HTTP, Socket.IO, workers, backup crons,
 * video encoder, and init. Thinner apps (cli/tools/mock/agents) are slices of
 * this graph; a new global module belongs here if it must reach production
 * traffic.
 */
export class AppModule { }
