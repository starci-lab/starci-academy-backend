import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    ReactionService,
} from "@modules/bussiness/discussion/reaction.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    FLAT_POINTS,
} from "../../../../../processors/ai/shared/xp/points-config"
import {
    writeXpHistory,
} from "../../../../../processors/ai/shared/xp/write-xp-history"

/** Per-course weighted XP for a first lesson read (matches the leaderboard x3 signal). */
const LESSON_READ_XP = 3

@CommandHandler(MarkAsReadedCommand)
@Injectable()
/**
 * Persists read progress keyed by enrollment and awards XP/activity only on a
 * deliberate (non-silent) mark -- auto-scroll must not spend the one-time reward.
 */
export class MarkAsReadedHandler
    extends ICQRSHandler<MarkAsReadedCommand, void>
    implements ICommandHandler<MarkAsReadedCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly reactionService: ReactionService,
        private readonly progressProjectionService: ProgressProjectionService,
        private readonly userService: UserService,
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

        // resolve the course for this content so we can key the row by enrollment
        // (user x course) -- the anchor going forward -- while still setting user_id
        // during the re-key transition. Reuse the loaded content for the XP branch.
        const content = await this.entityManager.findOne(
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
        const courseId = content?.module?.courseId ?? null
        const enrollment = courseId
            ? await this.userService.resolveOrCreateTrialEnrollment(
                user.id,
                courseId,
            )
            : null

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
                // key the progress row by enrollment going forward (set BOTH columns
                // during the transition); skip when the course can't be resolved.
                if (enrollment) {
                    userContent.enrollment = enrollment
                }
                const saved = await entityManager.save(
                    UserContentEntity,
                    userContent,
                )
                // award lesson XP + reward points only on a DELIBERATE mark-as-read
                // (silent === false) -- the auto-mark-on-scroll path passes silent so
                // passive scrolling never spends the reward. Both writeXpHistory's
                // refId and writeActivity's idempotencyKey key off the same
                // user-content id, so claiming the reward after the page already
                // auto-marked read still grants once.
                if (readed && !silent) {
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
