import {
    EnvModule,
} from "@modules/env"
import {
    Module
} from "@nestjs/common"
import {
    ValidationPipe
} from "@nestjs/common"
import {
    ElasticsearchModule
} from "@modules/elasticsearch"
import {
    WinstonModule,
    WinstonLevel
} from "@modules/winston"
import {
    ServiceName
} from "@modules/common"
import {
    IoRedisInstanceKey,
    IoRedisModule,
    RedisInstanceKey,
    RedisModule
} from "@modules/native"
import {
    ThrottlerModule
} from "@modules/throttler"
import {
    FilesystemModule,
} from "@modules/filesystem"
import {
    SentryModule
} from "@modules/sentry"
import {
    MixinModule
} from "@modules/mixin"
import {
    PrimaryPostgreSQLModule,
    QdrantModule,
} from "@modules/databases"
import {
    S3Module
} from "@modules/s3"
import {
    AssetsModule
} from "@modules/assets"
import {
    PayOSModule
} from "@modules/payos"
import {
    ScheduleModule
} from "@nestjs/schedule"
import {
    ApiModule
} from "@features/api"
import {
    AxiosModule
} from "@modules/axios"
import {
    KeycloakModule
} from "@modules/keycloak"
import {
    JwtModule
} from "@nestjs/jwt"
import {
    APP_FILTER,
    APP_PIPE
} from "@nestjs/core"
import {
    AbstractExceptionHttpFilter,
} from "@modules/exceptions"
import {
    BullModule
} from "@modules/bullmq"
import {
    BussinessModule
} from "@modules/bussiness"
import {
    RoutingModule
} from "@modules/routing"
import {
    LangchainModule
} from "@modules/langchain"
import {
    RagModule
} from "@modules/rag"
import {
    CryptoModule
} from "@modules/crypto"
import {
    TotpModule
} from "@modules/totp"
import {
    SepayModule
} from "@modules/sepay"
import {
    StripeModule
} from "@modules/stripe"
import {
    PaypalModule
} from "@modules/paypal"
import {
    NowPaymentsModule
} from "@modules/nowpayments"
import {
    SocketIoModule
} from "@modules/socketio"
import {
    CQRSModule,
    EventBusModule
} from "@modules/cqrs"
import {
    CqrsModule
} from "@nestjs/cqrs"
import {
    SocketIoModule as SocketIoFeatureModule
} from "@features/socketio"
import {
    EventModule,
    EventName
} from "@modules/event"
import {
    EventEmitterModule
} from "@nestjs/event-emitter"
import {
    CacheModule
} from "@modules/cache"
import {
    StreamAsyncIteratorModule
} from "@modules/stream-async-iterator"
import {
    ValidatorsModule
} from "@modules/validators"
import {
    GoogleApisModule
} from "@modules/googleapis"
import {
    MailModule
} from "@modules/mailer"
import {
    BackupModule
} from "@features/backup"
import {
    ExecaModule
} from "@modules/execa"
import {
    CookieModule,
} from "@modules/cookie"
import {
    CsrfModule,
} from "@modules/csrf"
import {
    SessionModule,
} from "@modules/session"
import {
    CaptchaModule,
} from "@modules/captcha"
import {
    CodeModule
} from "@modules/code"
import {
    GithubModule,
} from "@modules/github"
import {
    InitModule,
} from "@modules/init"
import {
    FfmpegModule
} from "@modules/ffmpeg"
import {
    Bento4Module
} from "@modules/bento4"
import {
    VideoEncoderModule
} from "@features/video-encoder"
import {
    AiModule,
} from "@modules/ai/ai.module"
import {
    MembershipModule
} from "@modules/membership"
import {
    KafkaModule
} from "@modules/kafka"
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
