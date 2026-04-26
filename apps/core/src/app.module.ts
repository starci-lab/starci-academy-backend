import {
    EnvModule
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
    PayOSModule
} from "@modules/payos"
import {
    SynchronizerModule
} from "@features/synchronizer"
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
    APP_PIPE 
} from "@nestjs/core"
import {
    BullModule
} from "@modules/bullmq"
import {
    BussinessModule 
} from "@modules/bussiness"
import {
    WorkerModule
} from "@features/worker"
import {
    LangchainModule
} from "@modules/langchain"
import {
    CryptoModule
} from "@modules/crypto"
import { 
    SepayModule 
} from "@modules/sepay"
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
    VaildatorsModule
} from "@modules/vaildators"
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
/**
 * The main module for the application.
 */
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
            /** CDN, Elasticsearch, and ScyllaDB synchronizers. */
            SynchronizerModule.register(
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
            /** Cache module. */
            CacheModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Vaildators module. */
            VaildatorsModule.register(
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
                }
            ),
            /** Worker module. */
            WorkerModule.register(
                {
                    isGlobal: true,
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
        ],
        providers: [
            {
                provide: APP_PIPE,
                useClass: ValidationPipe,
            },
        ],
    }
)
export class AppModule { }
