import {
    Injectable,
} from "@nestjs/common"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FlashcardDeckParserService,
} from "../parsers/flashcard-deck.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProcessFlashcardDecksParams,
} from "../types/seeder-orchestration"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts course-level flashcard decks.
 */
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
