import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ActivityType,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserContentEntity,
    XpSource,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    ProgressProjectionService,
    ReactionService,
    writeActivity,
} from "@modules/bussiness"
import {
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    FLAT_POINTS,
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"

/** Per-course weighted XP for a first lesson read (matches the leaderboard ×3 signal). */
const LESSON_READ_XP = 3

@CommandHandler(MarkAsReadedCommand)
@Injectable()
export class MarkAsReadedHandler
    extends ICQRSHandler<MarkAsReadedCommand, void>
    implements ICommandHandler<MarkAsReadedCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly reactionService: ReactionService,
        private readonly progressProjectionService: ProgressProjectionService,
    ) {
        super()
    }

    protected override async process(
        command: MarkAsReadedCommand,
    ): Promise<void> {
        const {
            request: {
                contentId,
                readed,
                silent,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const existing = await this.entityManager.findOne(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    contentId,
                },
            },
        )

        await this.entityManager.transaction(
            async (entityManager) => {
                const userContent = existing ?? entityManager.create(
                    UserContentEntity,
                    {
                        userId: user.id,
                        contentId,
                    },
                )
                userContent.isRead = readed
                const saved = await entityManager.save(
                    UserContentEntity,
                    userContent,
                )
                // award lesson XP + reward points only on a DELIBERATE mark-as-read
                // (silent === false) — the auto-mark-on-scroll path passes silent so
                // passive scrolling never spends the reward. Both writeXpHistory and
                // writeActivity are idempotent on the user-content refId, so claiming
                // the reward after the page already auto-marked read still grants once.
                if (readed && !silent) {
                    const content = await entityManager.findOne(
                        ContentEntity,
                        {
                            where: {
                                id: contentId,
                            },
                            relations: {
                                module: {
                                    course: true,
                                },
                            },
                        },
                    )
                    await writeXpHistory({
                        entityManager,
                        userId: user.id,
                        courseId: content?.module?.courseId ?? null,
                        source: XpSource.LessonRead,
                        amount: LESSON_READ_XP,
                        points: FLAT_POINTS.lessonRead,
                        refId: saved.id,
                    })
                    // record the read as a home-feed activity (idempotent on the
                    // user-content id, so re-reading never produces a duplicate)
                    await writeActivity({
                        entityManager,
                        userId: user.id,
                        type: ActivityType.LessonRead,
                        idempotencyKey: saved.id,
                        metadata: {
                            target: {
                                entityName: ContentEntity.name,
                                id: contentId,
                                label: content?.title ?? "",
                            },
                        },
                    })
                    // refresh the user's progress projection in the SAME tx (atomic)
                    if (content?.module?.courseId) {
                        await this.progressProjectionService.recompute({
                            userId: user.id,
                            courseId: content.module.courseId,
                            entityManager,
                        })
                    }
                }
            },
        )

        // invalidate the cached view count so the next contentReactions query recomputes it
        await this.reactionService.invalidateViewCount(contentId)
    }
}
