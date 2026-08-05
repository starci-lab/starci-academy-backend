import {
    EnvModule,
} from "@modules/platform/env/env.module"
import {
    Module,
} from "@nestjs/common"
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
    ExecaModule,
} from "@modules/integrations/execa/execa.module"
import {
    MixinModule,
} from "@modules/lib/mixin/mixin.module"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    CryptoModule,
} from "@modules/crypto/crypto.module"
import {
    FilesystemModule,
} from "@modules/filesystem/filesystem.module"
import {
    S3Module,
} from "@modules/integrations/s3/s3.module"
import {
    CliModule,
} from "@features/cli/cli.module"

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
        /** Primary PostgreSQL module -- entity manager access for DB-touching subcommands. */
        PrimaryPostgreSQLModule.register({
            isGlobal: true,
            withResolvers: false,
        }),
        /** Crypto module -- `Sha256Service` for deterministic seed id factories. */
        CryptoModule.register({
            isGlobal: true,
        }),
        /** Mount filesystem module -- `MountStorageService` local secrets/config. */
        FilesystemModule.register({
            isGlobal: true,
        }),
        /** S3 module -- `S3ReadService` fallback context reader for seed parsers. */
        S3Module.register({
            isGlobal: true,
        }),
        /** CLI module. */
        CliModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * CLI application root -- only imports required by {@link CliModule}.
 * `PrimaryPostgreSQLModule` added for `utils playground-seed` (and any future
 * subcommand needing `@InjectPrimaryPostgreSQLEntityManager` -- none did before,
 * so it was never wired here; `withResolvers: false` since the CLI has no
 * GraphQL layer to resolve entity fields for).
 * `CryptoModule` / `FilesystemModule` / `S3Module` added for
 * `utils playground-seed-test` -- the seeder's shared parser/context services
 * transitively need `Sha256Service`, `MountStorageService`, and `S3ReadService`.
 * None of the three pulls in `InitModule`/`SeedersService`/`DataGitBootstrapService`.
 */
export class AppModule {}
