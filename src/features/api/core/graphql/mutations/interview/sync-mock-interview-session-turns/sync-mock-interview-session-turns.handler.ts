import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EntityManager,
} from "typeorm"
import {
    MockInterviewSessionEntity,
    MockInterviewSessionTurn,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
} from "./graphql-types/response"

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
                expectedRevision,
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
                    revision: true,
                    turns: true,
                    questionIndex: true,
                    phaseIndex: true,
                    expiresAt: true,
                },
            },
        )

        // not found/not owned, or no longer resumable (already graded by
        // gradeMockInterviewSession, or abandoned by a fresh
        // startMockInterviewSession draw) -- a late/stale sync must silently
        // no-op rather than throw, so a background periodic sync never
        // surfaces an error toast mid-interview.
        if (session?.status !== "in_progress") {
            return {
                success: false,
                conflict: false,
                revision: session?.revision ?? 0,
                turns: session?.turns ?? [],
                questionIndex: session?.questionIndex ?? 0,
                phaseIndex: session?.phaseIndex ?? 0,
            }
        }

        if (session.expiresAt.getTime() <= Date.now()) {
            await this.entityManager.createQueryBuilder()
                .update(MockInterviewSessionEntity)
                .set({
                    status: "expired", revision: () => "\"revision\" + 1"
                })
                .where("id = :id",
                    {
                        id: session.id
                    })
                .andWhere("revision = :revision",
                    {
                        revision: session.revision
                    })
                .execute()
            return {
                success: false,
                conflict: false,
                revision: session.revision + 1,
                turns: session.turns ?? [],
                questionIndex: session.questionIndex,
                phaseIndex: session.phaseIndex,
            }
        }

        const nextTurns = turns.map((turn): MockInterviewSessionTurn => ({
            role: turn.role,
            phase: turn.phase,
            content: turn.content,
            questionIndex: turn.questionIndex,
            artifactHint: turn.artifactHint === "code" ? "code" : undefined,
        }))
        const currentTurns = session.turns ?? []
        const legacyPrefixValid = expectedRevision === undefined
            && questionIndex >= session.questionIndex
            && phaseIndex >= session.phaseIndex
            && currentTurns.every((turn, index) => JSON.stringify(turn) === JSON.stringify(nextTurns[index]))
        const revisionMatches = expectedRevision === session.revision
        if (!revisionMatches && !legacyPrefixValid) {
            return {
                success: false,
                conflict: true,
                revision: session.revision,
                turns: currentTurns,
                questionIndex: session.questionIndex,
                phaseIndex: session.phaseIndex,
            }
        }

        const updated = await this.entityManager.createQueryBuilder()
            .update(MockInterviewSessionEntity)
            .set({
                turns: nextTurns,
                questionIndex,
                phaseIndex,
                revision: () => "\"revision\" + 1",
            })
            .where("id = :id",
                {
                    id: session.id
                })
            .andWhere("status = 'in_progress'")
            .andWhere("revision = :revision",
                {
                    revision: session.revision
                })
            .execute()

        if (updated.affected !== 1) {
            const current = await this.entityManager.findOneByOrFail(MockInterviewSessionEntity,
                {
                    id: session.id
                })
            return {
                success: false,
                conflict: true,
                revision: current.revision,
                turns: current.turns ?? [],
                questionIndex: current.questionIndex,
                phaseIndex: current.phaseIndex,
            }
        }

        return {
            success: true,
            conflict: false,
            revision: session.revision + 1,
            turns: nextTurns,
            questionIndex,
            phaseIndex,
        }
    }
}
