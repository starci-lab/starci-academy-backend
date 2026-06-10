import {
    Injectable,
} from "@nestjs/common"
import {
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    FlashcardDeckParserService,
} from "../parsers"
import {
    logInitSeederEntitySkipped,
    UpsertService,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import type {
    ProcessFlashcardDecksParams,
} from "../types"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Parses and upserts course-level flashcard decks.
 */
@Injectable()
export class FlashcardDeckProcessorService {
    constructor(
        private readonly flashcardDeckParserService: FlashcardDeckParserService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse and upsert flashcard decks for one course.
     *
     * @param params - Course parse result.
     */
    async process(
        params: ProcessFlashcardDecksParams,
    ): Promise<void> {
        const {
            courseResult,
        } = params
        try {
            const courseId = courseResult.data.id as string
            const flashcardDeckResults = await this.flashcardDeckParserService.parseMany({
                courseRelativePath: courseResult.relativePath,
                courseIndex: courseResult.index,
                courseId,
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: FlashcardDeckEntity,
                entities: flashcardDeckResults.map((flashcardDeckResult) => {
                    const flashcardDeck = flashcardDeckResult.data
                    flashcardDeck.course = {
                        id: courseId,
                        displayId: courseResult.data.displayId as string,
                    }
                    return flashcardDeck
                }),
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: FlashcardDeckEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                FlashcardDeckEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
