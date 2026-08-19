import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    MilestoneParserService,
} from "../parsers/milestone.service"
import {
    MilestonePathService,
} from "../path/milestone.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProcessMilestonesParams,
} from "../types/seeder-orchestration"
import {
    MilestoneTaskProcessorService,
} from "./milestone-task-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts milestones for one course, then nested tasks.
 */
export class MilestoneProcessorService {
    constructor(
        private readonly milestoneParserService: MilestoneParserService,
        private readonly milestonePathService: MilestonePathService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        @Inject(forwardRef(() => MilestoneTaskProcessorService))
        private readonly milestoneTaskProcessorService: MilestoneTaskProcessorService,
    ) { }

    /**
     * Parse and upsert milestones and nested tasks for one course.
     *
     * @param params - Course parse result and ids.
     */
    async process(
        params: ProcessMilestonesParams,
    ): Promise<void> {
        const {
            courseResult,
            courseId,
        } = params
        try {
            const milestonePaths = await this.milestonePathService.paths({
                courseRelativePath: courseResult.relativePath,
            })
            const milestoneResults: Array<ResolvedFileResult<DeepPartial<MilestoneEntity>>> = []
            for (const path of milestonePaths) {
                const milestone = await this.milestoneParserService.parse({
                    paths: milestonePaths,
                    courseIndex: courseResult.index,
                    milestoneIndex: path.orderIndex,
                })
                milestoneResults.push({
                    data: milestone,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            }
            const entities = milestoneResults.map((milestoneResult) => {
                const milestone = milestoneResult.data
                milestone.course = {
                    id: courseId,
                    displayId: courseResult.data.displayId as string,
                }
                return milestone
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: MilestoneEntity,
                entities,
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: MilestoneEntity,
                partition,
            })
            const deletedMilestoneIds = new Set(partition.deleteEntities.map(
                (entity) => entity.id as string,
            ))
            const filteredMilestoneResults = milestoneResults.filter(
                (milestoneResult) => !deletedMilestoneIds.has(milestoneResult.data.id as string),
            )
            for (const milestoneResult of filteredMilestoneResults) {
                await this.milestoneTaskProcessorService.process({
                    courseId,
                    courseResult,
                    milestoneResult,
                })
            }
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                MilestoneEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
