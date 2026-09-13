import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengePremiumLockedException,
} from "@modules/platform/exceptions/errors/courses/challenge-premium-locked"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeQuery,
} from "./challenge.query"

@QueryHandler(ChallengeQuery)
@Injectable()
/**
 * Handler for the challenge query.
 */
export class ChallengeHandler
    extends ICQRSHandler<ChallengeQuery, ChallengeEntity>
    implements IQueryHandler<ChallengeQuery, ChallengeEntity> {
    constructor(
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {
        super()
    }

    /**
     * Process the challenge query.
     * @param query - Challenge query.
     * @returns Promise of ChallengeEntity.
     */
    protected override async process(query: ChallengeQuery): Promise<ChallengeEntity> {
        const {
            request,
            locale,
            user,
        } = query.params

        const objectKey = this.s3NameResolverService.challenge(
            request.id,
            locale
        )
        const challenge = await this.s3ReadService.json<ChallengeEntity>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id: request.id,
            })
        }
        // A premium content's challenge is readable only by a learner enrolled in the
        // owning course (mirrors the submit gate); free content stays open to everyone.
        const ownerContent = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    challenges: {
                        id: request.id,
                    },
                },
                relations: {
                    module: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                    module: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        if (ownerContent && !(await this.isUnlocked(
            ownerContent,
            user?.id,
        ))) {
            throw new ChallengePremiumLockedException({
                contentId: ownerContent.id,
            })
        }
        return challenge
    }

    /**
     * Whether the viewer may open a challenge owned by `ownerContent`: always for
     * free content, otherwise only for a learner enrolled in the owning course.
     * A trial row does not count as enrollment.
     * @param ownerContent Content row that owns the challenge.
     * @param userId Active user id, when authenticated.
     */
    private async isUnlocked(
        ownerContent: ContentEntity,
        userId?: string,
    ): Promise<boolean> {
        if (!ownerContent.isPremium) {
            return true
        }
        const courseId = ownerContent.module?.course?.id
        if (!userId || !courseId) {
            return false
        }
        return await this.userService.checkEnrollment(
            userId,
            courseId,
        )
    }
}
