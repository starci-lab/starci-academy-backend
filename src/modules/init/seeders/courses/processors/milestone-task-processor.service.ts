import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneTaskParserService,
} from "../parsers/milestone-task.service"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import type {
    ProcessMilestoneTasksParams,
} from "../types/seeder-orchestration"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts tasks for one milestone.
 */
export class MilestoneTaskProcessorService {
    constructor(
        private readonly milestoneTaskParserService: MilestoneTaskParserService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse and upsert milestone tasks.
     *
     * @param params - Course and milestone parse results.
     */
    async process(
        params: ProcessMilestoneTasksParams,
    ): Promise<void> {
        const {
            courseResult,
            milestoneResult,
        } = params
        const milestoneId = milestoneResult.data.id as string
        const taskResults = await this.milestoneTaskParserService.parseMany({
            milestoneRelativePath: milestoneResult.relativePath,
            courseIndex: courseResult.index,
            milestoneIndex: milestoneResult.index,
        })
        const entities = taskResults.map((taskResult) => {
            const task = taskResult.data
            task.milestone = {
                id: milestoneId,
                orderIndex: milestoneResult.index ?? milestoneResult.data.orderIndex,
                course: {
                    displayId: courseResult.data.displayId as string,
                },
            }
            return task
        })
        const partition = await this.upsertService.partitionUuidSync({
            entityClass: MilestoneTaskEntity,
            entities,
            where: {
                milestone: {
                    id: milestoneId,
                },
            },
        })
        await this.uuidPartitionPersistProcessorService.process({
            entityClass: MilestoneTaskEntity,
            partition,
        })
    }
}
