import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ActivityType,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserContentEntity,
} from "@modules/databases"
import {
    UserService,
    writeActivity,
} from "@modules/bussiness"
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
    ToggleFavouriteCommand,
} from "./toggle-favourite.command"

@CommandHandler(ToggleFavouriteCommand)
@Injectable()
export class ToggleFavouriteHandler
    extends ICQRSHandler<ToggleFavouriteCommand, void>
    implements ICommandHandler<ToggleFavouriteCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {
        super()
    }

    protected override async process(
        command: ToggleFavouriteCommand,
    ): Promise<void> {
        const {
            request: {
                contentId,
                isFavorite,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        let userContent = await this.entityManager.findOne(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    contentId,
                },
            },
        )

        // resolve the course for this content so we can key the row by enrollment
        // (user × course) — the anchor going forward — while still setting user_id
        // during the re-key transition. Reuse the loaded content for the activity.
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

        if (!userContent) {
            userContent = this.entityManager.create(
                UserContentEntity,
                {
                    userId: user.id,
                    contentId,
                    isFavorite,
                },
            )
        } else {
            userContent.isFavorite = isFavorite
        }
        // key the progress row by enrollment going forward (set BOTH columns
        // during the transition); skip when the course can't be resolved.
        if (enrollment) {
            userContent.enrollment = enrollment
        }
        const saved = await this.entityManager.save(userContent)

        // record a bookmark as a home-feed activity (only when turning it ON);
        // idempotencyKey is the user-content id so re-bookmarking never duplicates
        if (isFavorite) {
            await writeActivity({
                entityManager: this.entityManager,
                userId: user.id,
                type: ActivityType.LessonBookmarked,
                idempotencyKey: saved.id,
                metadata: {
                    target: {
                        entityName: ContentEntity.name,
                        id: contentId,
                        label: content?.title ?? "",
                    },
                },
            })
        }
    }
}
