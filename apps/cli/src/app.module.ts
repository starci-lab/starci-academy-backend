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
    PrimaryPostgreSQLModule,
} from "@modules/databases"
import {
    CliModule,
} from "@features/cli"

/**
 * CLI application root module — only imports required by {@link CliModule}.
 * `PrimaryPostgreSQLModule` added for `utils playground-seed` (and any future
 * subcommand needing `@InjectPrimaryPostgreSQLEntityManager` — none did before,
 * so it was never wired here; `withResolvers: false` since the CLI has no
 * GraphQL layer to resolve entity fields for).
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
        /** Primary PostgreSQL module — entity manager access for DB-touching subcommands. */
        PrimaryPostgreSQLModule.register({
            isGlobal: true,
            withResolvers: false,
        }),
        /** CLI module. */
        CliModule.register({
            isGlobal: true,
        }),
    ],
})
export class AppModule {}
