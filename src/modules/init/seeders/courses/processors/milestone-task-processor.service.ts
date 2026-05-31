import {
    Injectable,
} from "@nestjs/common"
import {
    MilestoneTaskEntity,
} from "@modules/databases"
import {
    MilestoneTaskParserService,
} from "../parsers"
import {
    UpsertService,
} from "../../shared"
import type {
    ProcessMilestoneTasksParams,
} from "../types"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Parses and upserts tasks for one milestone.
 */
@Injectable()
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
            }
            return task
        })
        const partition = await this.upsertService.partitionUuidSync({
            entityClass: MilestoneTaskEntity,
            entities,
            where: {
                milestoneId,
            },
        })
        await this.uuidPartitionPersistProcessorService.process({
            entityClass: MilestoneTaskEntity,
            partition,
        })
    }
}
