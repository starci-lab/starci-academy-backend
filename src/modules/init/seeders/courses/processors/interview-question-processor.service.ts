import {
    Injectable,
} from "@nestjs/common"
import {
    InterviewQuestionEntity,
} from "@modules/databases"
import {
    InterviewQuestionParserService,
} from "../parsers"
import {
    logInitSeederEntitySkipped,
    UpsertService,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import type {
    ProcessInterviewQuestionsParams,
} from "../types"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Parses and upserts course-scoped (technical) mock-interview questions.
 */
@Injectable()
export class InterviewQuestionProcessorService {
    constructor(
        private readonly interviewQuestionParserService: InterviewQuestionParserService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse and upsert mock-interview questions for one course.
     *
     * @param params - Course parse result.
     */
    async process(
        params: ProcessInterviewQuestionsParams,
    ): Promise<void> {
        const {
            courseResult,
        } = params
        try {
            const courseId = courseResult.data.id as string
            const interviewQuestions = await this.interviewQuestionParserService.parseMany({
                courseRelativePath: courseResult.relativePath,
                courseIndex: courseResult.index,
                courseId,
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: InterviewQuestionEntity,
                entities: interviewQuestions,
                where: {
                    courseId,
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: InterviewQuestionEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                InterviewQuestionEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
