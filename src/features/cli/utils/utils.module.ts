
import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./utils.module-definition"
import {
    UtilsCommand,
} from "./utils.command"
import {
    PgSyncCommand,
    PlaygroundSeedTestCommand,
} from "./subs"
import {
    CourseIdFactoryService,
    PlaygroundIdFactoryService,
    PlaygroundStepIdFactoryService,
} from "@modules/init/seeders/courses/id-factories"
import {
    PlaygroundParserService,
    PlaygroundStepParserService,
} from "@modules/init/seeders/courses/parsers"
import {
    PlaygroundPathService,
    PlaygroundStepPathService,
} from "@modules/init/seeders/courses/path"
import {
    PlaygroundProcessorService,
    UuidPartitionPersistProcessorService,
} from "@modules/init/seeders/courses/processors"
import {
    CoerceMdScalarService,
    ContextLoaderService,
    ExtractJsonFromMdService,
    FilesystemContextService,
    MergeJsonService,
    PathResolverService,
    S3ContextService,
    UpsertService,
} from "@modules/init/seeders/shared"

@Module({
    providers: [
        UtilsCommand,
        PgSyncCommand,
        PlaygroundSeedTestCommand,
        PlaygroundProcessorService,
        UuidPartitionPersistProcessorService,
        PlaygroundParserService,
        PlaygroundStepParserService,
        PlaygroundPathService,
        PlaygroundStepPathService,
        PlaygroundIdFactoryService,
        PlaygroundStepIdFactoryService,
        CourseIdFactoryService,
        UpsertService,
        PathResolverService,
        ContextLoaderService,
        FilesystemContextService,
        S3ContextService,
        ExtractJsonFromMdService,
        CoerceMdScalarService,
        MergeJsonService,
    ],
})
/**
 * `PlaygroundSeedTestCommand`'s dependency graph is provided directly here rather
 * than via `SeedersModule.register(...)` — that module also provides `SeedersService`
 * (the git-sourced init orchestrator), which this git-free CLI command must never
 * import, even transitively. Every provider below is the exact subgraph
 * `PlaygroundProcessorService` needs (confirmed per-constructor); none of them
 * reaches `InitModule` / `SeedersService` / `DataGitBootstrapService`.
 */
export class UtilsModule extends ConfigurableModuleClass {}
