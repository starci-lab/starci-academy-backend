import {
    EnvModule,
} from "@modules/env"
import {
    Module,
} from "@nestjs/common"
import {
    WinstonModule,
    WinstonLevel,
} from "@modules/winston"
import {
    ServiceName,
} from "@modules/common"
import {
    ExecaModule,
} from "@modules/execa"
import {
    MixinModule,
} from "@modules/mixin"
import {
    CliModule,
} from "@features/cli"

/**
 * CLI application root module — only imports required by {@link CliModule}.
 */
@Module({
    imports: [
        
        /** Environment module. */
        EnvModule.forRoot(),
        /** Winston module. */
        WinstonModule.register({
            serviceName: ServiceName.Cli,
            level: WinstonLevel.Debug,
            isGlobal: true,
        }),
        /** Execa module (for running external commands). */
        ExecaModule.register({
            isGlobal: true,
        }),
        /** Mixin module. */
        MixinModule.register({
            isGlobal: true,
        }),
        /** CLI module. */
        CliModule.register({
            isGlobal: true,
        }),
    ],
})
export class AppModule {}
