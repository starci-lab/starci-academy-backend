import {
    createHash, randomInt, randomUUID
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    GraphQLError,
} from "graphql"
import {
    CommandHandler, ICommandHandler
} from "@nestjs/cqrs"
import {
    EntityManager
} from "typeorm"
import {
    ICQRSHandler
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    EnrollmentEntity
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    FLASHCARD_QUIZ_SESSION_DURATION_MS,
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserService
} from "@modules/bussiness/user/user.service"
import {
    ClozeParserService
} from "@modules/bussiness/flashcard/cloze/cloze-parser.service"
import {
    FLASHCARD_CLOZE_CONTRACT_VERSION,
    toPublicQuizItems,
} from "@modules/bussiness/flashcard/cloze/cloze-contract"
import type {
    ClozeQuizItemSnapshot, ClozeQuizToken
} from "@modules/bussiness/flashcard/cloze/cloze-contract"
import {
    StartFlashcardQuizSessionCommand
} from "./start-flashcard-quiz-session.command"
import {
    StartFlashcardQuizSessionData
} from "./graphql-types/response"

interface CardRow {
    id: string
    question: string
    answer: string | null
}

@CommandHandler(StartFlashcardQuizSessionCommand)
@Injectable()
/** Creates one atomic, fingerprint-idempotent, server-owned cloze session snapshot. */
export class StartFlashcardQuizSessionHandler
    extends ICQRSHandler<StartFlashcardQuizSessionCommand, StartFlashcardQuizSessionData>
    implements ICommandHandler<StartFlashcardQuizSessionCommand, StartFlashcardQuizSessionData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        private readonly userService: UserService,
        private readonly clozeParserService: ClozeParserService,
    ) { super() }

    protected override async process(command: StartFlashcardQuizSessionCommand): Promise<StartFlashcardQuizSessionData> {
        const { request, user } = command.params
        if (!user) throw new UserNotFoundException({
        })
        const deckIds = [...new Set(request.deckIds ?? [])]
            .sort((left, right) => left.localeCompare(right))
        if (deckIds.length) {
            const scopedDecks: Array<{ id: string }> = await this.entityManager.query(
                "SELECT id FROM flashcard_decks WHERE course_id = $1 AND id = ANY($2::uuid[])",
                [request.courseId,
                    deckIds],
            )
            if (scopedDecks.length !== deckIds.length) {
                throw this.error("INVALID_DECK_SCOPE")
            }
        }
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(user.id,
            request.courseId)
        const fingerprint = createHash("sha256").update(JSON.stringify({
            contractVersion: FLASHCARD_CLOZE_CONTRACT_VERSION,
            enrollmentId: enrollment.id,
            courseId: request.courseId,
            deckScope: deckIds.length ? deckIds : ["__ALL_COURSE_DECKS__"],
            requestedItemCount: request.requestedItemCount,
        })).digest("hex")

        return this.entityManager.transaction(async (manager) => {
            await manager.findOneOrFail(EnrollmentEntity,
                {
                    where: {
                        id: enrollment.id
                    },
                    lock: {
                        mode: "pessimistic_write"
                    },
                })
            const replay = await manager.findOne(FlashcardQuizSessionEntity,
                {
                    where: {
                        enrollmentId: enrollment.id, startRequestId: request.startRequestId
                    },
                })
            if (replay) {
                if (replay.startRequestFingerprint !== fingerprint) {
                    throw this.error("IDEMPOTENCY_KEY_REUSED")
                }
                return this.response(replay)
            }

            if (deckIds.length) {
                const scopedDecks: Array<{ id: string }> = await manager.query(
                    "SELECT id FROM flashcard_decks WHERE course_id = $1 AND id = ANY($2::uuid[])",
                    [request.courseId,
                        deckIds],
                )
                if (scopedDecks.length !== deckIds.length) {
                    throw this.error("INVALID_DECK_SCOPE")
                }
            }

            const rows: Array<CardRow> = await manager.query(
                `SELECT c.id, c.question, c.answer
                   FROM flashcard_cards c
                   JOIN flashcard_decks d ON d.id = c.flashcard_deck_id
                  WHERE d.course_id = $1
                    AND ($2::uuid[] IS NULL OR d.id = ANY($2::uuid[]))
                  ORDER BY md5(c.id::text || $3)`,
                [request.courseId,
                    deckIds.length ? deckIds : null,
                    request.startRequestId],
            )
            const eligible = rows.map((row) => ({
                row, parsed: this.clozeParserService.parse(row.id,
                    row.answer)
            }))
                .filter(({ parsed }) => parsed.blanks.length > 0)
            if (eligible.length < request.requestedItemCount) {
                throw this.error("INSUFFICIENT_CLOZE_CARDS",
                    {
                        requestedCount: request.requestedItemCount,
                        eligibleCount: eligible.length,
                    })
            }
            const quizItems = eligible.slice(0,
                request.requestedItemCount).map(({ row, parsed }) => {
                const allocations = parsed.blanks.map((blank) => ({
                    blank,
                    token: {
                        tokenId: randomUUID(),
                        label: blank.answer,
                    } satisfies ClozeQuizToken,
                }))
                const tokens = allocations.map(({ token }) => token)
                this.shuffle(tokens)
                const answerKey = Object.fromEntries(allocations.map(({ blank, token }) => [
                    blank.blankId,
                    token.tokenId,
                ]))
                return {
                    cardId: row.id,
                    question: row.question,
                    clozeText: parsed.text,
                    blanks: parsed.blanks.map(({ blankId, hint }) => ({
                        blankId, ...(hint ? {
                            hint
                        } : {
                        })
                    })),
                    tokens,
                    answerKey,
                } satisfies ClozeQuizItemSnapshot
            })

            await manager.update(FlashcardQuizSessionEntity,
                {
                    enrollmentId: enrollment.id,
                    status: "in_progress",
                },
                {
                    status: "abandoned",
                    invalidReason: "replaced_by_new_session",
                })
            const session = await manager.save(FlashcardQuizSessionEntity,
                {
                    enrollment,
                    contractVersion: FLASHCARD_CLOZE_CONTRACT_VERSION,
                    startRequestId: request.startRequestId,
                    startRequestFingerprint: fingerprint,
                    quizItems,
                    answerState: [],
                    answerVersion: 0,
                    scoreSnapshot: null,
                    invalidReason: null,
                    cardIds: quizItems.map(({ cardId }) => cardId),
                    currentIndex: 0,
                    results: [],
                    mode: "quick",
                    level: null,
                    coverage: null,
                    xpEarned: 0,
                    weakTags: [],
                    status: "in_progress",
                    name: null,
                })
            return this.response(session)
        })
    }

    private response(session: FlashcardQuizSessionEntity): StartFlashcardQuizSessionData {
        return {
            sessionId: session.id,
            contractVersion: FLASHCARD_CLOZE_CONTRACT_VERSION,
            items: toPublicQuizItems(session.quizItems!),
            currentIndex: session.currentIndex,
            answerState: session.answerState,
            answerVersion: session.answerVersion,
            status: session.status,
            deadlineAt: new Date(session.createdAt.getTime() + FLASHCARD_QUIZ_SESSION_DURATION_MS).toISOString(),
        }
    }

    private shuffle<T>(values: Array<T>): void {
        for (let index = values.length - 1; index > 0; index -= 1) {
            const swap = randomInt(index + 1)
            ;[values[index],
                values[swap]] = [values[swap],
                values[index]]
        }
    }

    private error(code: string, details: Record<string, unknown> = {
    }): GraphQLError {
        return new GraphQLError(code,
            {
                extensions: {
                    code,
                    ...details,
                },
            })
    }
}
