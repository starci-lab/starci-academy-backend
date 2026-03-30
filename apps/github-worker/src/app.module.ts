import {
    Module 
} from "@nestjs/common"
import {
    GithubWorkerModule
} from "@features/worker"
import {
    ScheduleModule 
} from "@nestjs/schedule"
import {
    EnvModule
} from "@modules/env"
import {
    WinstonModule
} from "@modules/winston"
import {
    ServiceName
} from "@modules/common"
import {
    WinstonLevel
} from "@modules/winston"
import {
    MixinModule
} from "@modules/mixin"
import {
    SentryModule
} from "@modules/sentry"
import {
    FilesystemModule
} from "@modules/filesystem"
import {
    QdrantModule 
} from "@modules/databases"

@Module({
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
        /** Mount filesystem module. */
        FilesystemModule.register(
            {
                isGlobal: true,
            }
        ),
        /** Schedule module. */
        ScheduleModule.forRoot(
        ),
        /** Qdrant module. */
        QdrantModule.register(
            {
                isGlobal: true,
            }
        ),
        /** Github worker module. */
        GithubWorkerModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class AppModule {}
