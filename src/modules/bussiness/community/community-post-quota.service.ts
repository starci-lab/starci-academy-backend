import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    MoreThan,
} from "typeorm"
import {
    CommunityPostEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    MembershipService,
} from "@modules/membership"
import {
    CommunityPostQuotaExceededException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import type {
    AssertCanCreateCommunityPostParams,
} from "./types"

/**
 * Enforces the community post quota. Active members may post without limit; a
 * non-member may only create a bounded number of posts within a rolling window
 * (both configured via `envConfig().community`). Everyone may comment + react
 * freely — only the act of CREATING a top-level post is rate-limited.
 */
@Injectable()
export class CommunityPostQuotaService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly membershipService: MembershipService,
        private readonly dayjsService: DayjsService,
    ) {}

    /**
     * Throws when a non-member would exceed their post quota; a no-op for members.
     * @param params - {@link AssertCanCreateCommunityPostParams}
     */
    async assertCanCreatePost({
        userId,
    }: AssertCanCreateCommunityPostParams): Promise<void> {
        // active members are never rate-limited → short-circuit before any count
        const isMember = await this.membershipService.isActive(userId)
        if (isMember) {
            return
        }
        // read the configured cap + window for non-members
        const {
            nonMemberPostLimit,
            nonMemberPostWindowDays,
        } = envConfig().community
        // compute the start of the rolling window (now - windowDays)
        const windowStart = this.dayjsService
            .now()
            .subtract(nonMemberPostWindowDays,
                "day")
            .toDate()
        // count this author's posts created inside the window (deleted rows still
        // count — soft-delete must not let a user reset their quota)
        const recentPostCount = await this.entityManager.count(CommunityPostEntity,
            {
                where: {
                    author: {
                        id: userId,
                    },
                    createdAt: MoreThan(windowStart),
                },
            })
        // at or over the cap → block with a typed quota exception the FE can upsell on
        if (recentPostCount >= nonMemberPostLimit) {
            throw new CommunityPostQuotaExceededException({
                userId,
                limit: nonMemberPostLimit,
                windowDays: nonMemberPostWindowDays,
            })
        }
    }
}
