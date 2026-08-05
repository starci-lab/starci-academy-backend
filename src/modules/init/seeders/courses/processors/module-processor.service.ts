import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    ModuleParserService,
} from "../parsers/module.service"
import {
    ModulePathService,
} from "../path/module.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import type {
    PartitionUuidSyncResult,
} from "../../shared/upsert/types/partition-uuid-sync"
import {
    shouldIncludeCourseModule,
} from "../../../utils/course-module-filter"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProcessModulesParams,
} from "../types/seeder-orchestration"
import {
    ContentProcessorService,
} from "./content-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts modules for one course, then nested contents and challenges.
 */
export class ModuleProcessorService {
    constructor(
        private readonly moduleParserService: ModuleParserService,
        private readonly modulePathService: ModulePathService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        @Inject(forwardRef(() => ContentProcessorService))
        private readonly contentProcessorService: ContentProcessorService,
    ) { }

    /**
     * Parse modules for one course, upsert them, then nested contents.
     *
     * @param params - Course result and module filter.
     */
    async process(
        params: ProcessModulesParams,
    ): Promise<void> {
        const {
            courseResult,
            moduleIndexFilterByDisplayId,
        } = params
        const modulePaths = await this.modulePathService.paths({
            courseRelativePath: courseResult.relativePath,
        })
        const moduleResults: Array<ResolvedFileResult<DeepPartial<ModuleEntity>>> = []
        for (const path of modulePaths) {
            try {
                const module = await this.moduleParserService.parse({
                    paths: modulePaths,
                    moduleIndex: path.orderIndex,
                    courseIndex: courseResult.index,
                })
                moduleResults.push({
                    data: module,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ModuleEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        const partition = await this.upsertService.partitionUuidSync(
            {
                entityClass: ModuleEntity,
                entities: moduleResults.map((moduleResult) => {
                    const module = moduleResult.data
                    module.course = {
                        id: courseResult.data.id as string,
                        displayId: courseResult.data.displayId as string,
                    }
                    return module
                }),
                where: {
                    course: {
                        id: courseResult.data.id as string,
                    },
                },
            },
        )
        const filteredPartition: PartitionUuidSyncResult<ModuleEntity> = {
            createEntities: partition.createEntities.filter((entity) =>
                shouldIncludeCourseModule(
                    moduleIndexFilterByDisplayId,
                    courseResult.data.displayId as string,
                    entity.orderIndex ?? 0,
                ),
            ),
            updateEntities: partition.updateEntities.filter((entity) =>
                shouldIncludeCourseModule(
                    moduleIndexFilterByDisplayId,
                    courseResult.data.displayId as string,
                    entity.orderIndex ?? 0,
                ),
            ),
            deleteEntities: partition.deleteEntities.filter(
                (entity) => shouldIncludeCourseModule(
                    moduleIndexFilterByDisplayId,
                    courseResult.data.displayId as string,
                    entity.orderIndex ?? 0,
                ),
            ),
        }
        await this.uuidPartitionPersistProcessorService.process({
            entityClass: ModuleEntity,
            partition: filteredPartition,
        })
        const deletedModuleIds = partition.deleteEntities.map(
            (entity) => entity.id as string,
        )
        const filteredModuleResults = moduleResults
            .filter(
                (moduleResult) => shouldIncludeCourseModule(
                    moduleIndexFilterByDisplayId,
                    courseResult.data.displayId as string,
                    moduleResult.index ?? 0,
                ),
            )
            .filter(
                (moduleResult) => !deletedModuleIds.includes(moduleResult.data.id as string),
            )
        for (const moduleResult of filteredModuleResults) {
            await this.contentProcessorService.process({
                courseResult,
                moduleResult,
            })
        }
    }
}
