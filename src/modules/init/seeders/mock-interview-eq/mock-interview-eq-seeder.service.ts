import {
    Injectable,
} from "@nestjs/common"
import {
    MockInterviewEntity,
} from "@modules/databases"
import {
    SeedScopeService,
} from "../../scope"
import {
    InterviewQuestionEqParserService,
} from "./parsers"
import {
    logInitSeederEntitySkipped,
    UpsertService,
} from "../shared"
import {
    UuidPartitionPersistProcessorService,
} from "../courses/processors"
import {
    WinstonService,
} from "@modules/winston"

@Injectable()
/**
 * Seeds behavioral (global, non-course-scoped) EQ mock-interview questions from
 * `mock-interview-eq/{bank}/questions/{question}/vi.md`. Sibling of the technical
 * (course-scoped) `MockInterviewProcessorService`, but a top-level seeder like
 * {@link AchievementSeederService} since this family has no owning course/module to
 * hang off -- every row's `courseId`/`moduleId` is `null`.
 */
export class MockInterviewEqSeederService {
    constructor(
        private readonly seedScopeService: SeedScopeService,
        private readonly interviewQuestionEqParserService: InterviewQuestionEqParserService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Parse every behavioral mock-interview bank and upsert its questions, scoped
     * to the `behavioral` family so a re-seed never touches technical rows.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.mockInterviewEq`)
        if (!this.seedScopeService.isMockInterviewEqSeederEnabled()) {
            return
        }
        try {
            const interviewQuestions = await this.interviewQuestionEqParserService.parseMany()
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: MockInterviewEntity,
                entities: interviewQuestions,
                where: {
                    family: "behavioral",
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: MockInterviewEntity,
                partition,
            })
        } catch (error) {
            // a malformed behavioral tree must not abort the whole init pipeline
            logInitSeederEntitySkipped(
                this.winstonService,
                MockInterviewEntity,
                "mock-interview-eq",
                error,
            )
        }
    }
}
