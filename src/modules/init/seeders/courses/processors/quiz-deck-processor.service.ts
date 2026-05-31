import {
    Injectable,
} from "@nestjs/common"
import {
    QuizDeckEntity,
} from "@modules/databases"
import {
    QuizDeckParserService,
} from "../parsers"
import {
    logInitSeederEntitySkipped,
    UpsertService,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import type {
    ProcessQuizDecksParams,
} from "../types"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Parses and upserts course-level quiz decks.
 */
@Injectable()
export class QuizDeckProcessorService {
    constructor(
        private readonly quizDeckParserService: QuizDeckParserService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse and upsert quiz decks for one course.
     *
     * @param params - Course parse result.
     */
    async process(
        params: ProcessQuizDecksParams,
    ): Promise<void> {
        const {
            courseResult,
        } = params
        try {
            const courseId = courseResult.data.id as string
            const quizDeckResults = await this.quizDeckParserService.parseMany({
                courseRelativePath: courseResult.relativePath,
                courseIndex: courseResult.index,
                courseId,
                contentIdByPath: new Map<string, string>(),
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: QuizDeckEntity,
                entities: quizDeckResults.map((quizDeckResult) => quizDeckResult.data),
                where: {
                    courseId,
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: QuizDeckEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                QuizDeckEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
