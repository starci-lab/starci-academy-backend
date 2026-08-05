import {
    Injectable,
} from "@nestjs/common"
import {
    MockInterviewEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview.entity"
import {
    MockInterviewParserService,
} from "../parsers/mock-interview.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    SeedScopeService,
} from "../../../scope/seed-scope.service"
import type {
    ProcessMockInterviewParams,
} from "../types/seeder-orchestration"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts course-level mock-interview TECHNICAL bank questions.
 * Self-gates on `seed.yaml` scope (unlike the legacy flashcard flag, which
 * threads `flashcardEnabled` through `ProcessCoursesParams` but is never
 * actually read at this layer) -- injects {@link SeedScopeService} directly.
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
