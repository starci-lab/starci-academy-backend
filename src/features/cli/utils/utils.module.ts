
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
} from "./subs/pg-sync.command"
import {
    PlaygroundSeedTestCommand,
} from "./subs/playground-seed-test.command"
import {
    CourseIdFactoryService,
} from "@modules/init/seeders/courses/id-factories/course.service"
import {
    PlaygroundStepIdFactoryService,
} from "@modules/init/seeders/courses/id-factories/playground-step.service"
import {
    PlaygroundIdFactoryService,
} from "@modules/init/seeders/courses/id-factories/playground.service"
import {
    PlaygroundStepParserService,
} from "@modules/init/seeders/courses/parsers/playground-step.service"
import {
    PlaygroundParserService,
} from "@modules/init/seeders/courses/parsers/playground.service"
import {
    PlaygroundStepPathService,
} from "@modules/init/seeders/courses/path/playground-step.service"
import {
    PlaygroundPathService,
} from "@modules/init/seeders/courses/path/playground.service"
import {
    PlaygroundProcessorService,
} from "@modules/init/seeders/courses/processors/playground-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "@modules/init/seeders/courses/processors/uuid-partition-persist-processor.service"
import {
    FilesystemContextService,
} from "@modules/init/seeders/shared/contexts/filesystem.service"
import {
    ContextLoaderService,
} from "@modules/init/seeders/shared/contexts/loader.service"
import {
    S3ContextService,
} from "@modules/init/seeders/shared/contexts/s3.service"
import {
    CoerceMdScalarService,
} from "@modules/init/seeders/shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "@modules/init/seeders/shared/extracts/extract-json-from-md.service"
import {
    MergeJsonService,
} from "@modules/init/seeders/shared/merge/merge.service"
import {
    PathResolverService,
} from "@modules/init/seeders/shared/path/resolver.service"
import {
    UpsertService,
} from "@modules/init/seeders/shared/upsert/upsert.service"

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
 * than via `SeedersModule.register(...)` -- that module also provides `SeedersService`
 * (the git-sourced init orchestrator), which this git-free CLI command must never
 * import, even transitively. Every provider below is the exact subgraph
 * `PlaygroundProcessorService` needs (confirmed per-constructor); none of them
 * reaches `InitModule` / `SeedersService` / `DataGitBootstrapService`.
 */
export class UtilsModule extends ConfigurableModuleClass {}
