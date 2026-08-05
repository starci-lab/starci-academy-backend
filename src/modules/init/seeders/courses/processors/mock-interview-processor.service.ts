import {
    Injectable,
} from "@nestjs/common"
import {
    MockInterviewEntity,
} from "@modules/databases"
import {
    MockInterviewParserService,
} from "../parsers"
import {
    logInitSeederEntitySkipped,
    UpsertService,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import {
    SeedScopeService,
} from "../../../scope"
import type {
    ProcessMockInterviewParams,
} from "../types"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts course-level mock-interview TECHNICAL bank questions.
 * Self-gates on `seed.yaml` scope (unlike the legacy flashcard flag, which
 * threads `flashcardEnabled` through `ProcessCoursesParams` but is never
 * actually read at this layer) — injects {@link SeedScopeService} directly.
 */
export class MockInterviewProcessorService {
    constructor(
        private readonly mockInterviewParserService: MockInterviewParserService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        private readonly seedScopeService: SeedScopeService,
    ) { }

    /**
     * Parse and upsert mock-interview technical bank questions for one course.
     *
     * @param params - Course parse result.
     */
    async process(
        params: ProcessMockInterviewParams,
    ): Promise<void> {
        if (!this.seedScopeService.isCoursesInterviewSeederEnabled()) {
            return
        }
        const {
            courseResult,
        } = params
        try {
            const courseId = courseResult.data.id as string
            const questionResults = await this.mockInterviewParserService.parseMany({
                courseRelativePath: courseResult.relativePath,
                courseIndex: courseResult.index,
                courseId,
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: MockInterviewEntity,
                entities: questionResults.map((questionResult) => questionResult.data),
                where: {
                    courseId,
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: MockInterviewEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                MockInterviewEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
