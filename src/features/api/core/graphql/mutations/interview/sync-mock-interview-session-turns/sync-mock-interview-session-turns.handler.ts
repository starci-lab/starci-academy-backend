import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewSessionEntity,
    MockInterviewSessionTurn,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SyncMockInterviewSessionTurnsCommand,
} from "./sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsData,
} from "./graphql-types"

@CommandHandler(SyncMockInterviewSessionTurnsCommand)
@Injectable()
/**
 * Applies one `syncMockInterviewSessionTurns` sync -- small enough (a single
 * ownership-scoped lookup + guard + update) that, unlike
 * `startMockInterviewSession`/`gradeMockInterviewSession`, it does not
 * warrant a separate domain service; the logic lives directly in the handler.
 */
export class SyncMockInterviewSessionTurnsHandler
    extends ICQRSHandler<SyncMockInterviewSessionTurnsCommand, SyncMockInterviewSessionTurnsData>
    implements ICommandHandler<SyncMockInterviewSessionTurnsCommand, SyncMockInterviewSessionTurnsData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: SyncMockInterviewSessionTurnsCommand,
    ): Promise<SyncMockInterviewSessionTurnsData> {
        const {
            request: {
                sessionId,
                turns,
                questionIndex,
                phaseIndex,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // ownership check mirrors `gradeMockInterviewSession`'s
        // `resolveTrustedPromptIdentity` -- a session can never be synced on
        // behalf of a different learner's draw. Scoped through the relation
        // (`enrollment: { user: { id } }`), NOT the virtual `enrollment.userId`
        // @RelationId column, which TypeORM cannot filter on directly.
        const session = await this.entityManager.findOne(
            MockInterviewSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: user.id,
                        },
                    },
                },
                select: {
                    id: true,
                    status: true,
                },
            },
        )

        // not found/not owned, or no longer resumable (already graded by
        // gradeMockInterviewSession, or abandoned by a fresh
        // startMockInterviewSession draw) -- a late/stale sync must silently
        // no-op rather than throw, so a background periodic sync never
        // surfaces an error toast mid-interview.
        if (!session || session.status !== "in_progress") {
            return {
                success: false,
            }
        }

        await this.entityManager.update(
            MockInterviewSessionEntity,
            {
                id: session.id,
            },
            {
                turns: turns.map((turn): MockInterviewSessionTurn => ({
                    role: turn.role,
                    phase: turn.phase,
                    content: turn.content,
                    questionIndex: turn.questionIndex,
                    artifactHint: turn.artifactHint === "code" ? "code" : undefined,
                })),
                questionIndex,
                phaseIndex,
            },
        )

        return {
            success: true,
        }
    }
}
