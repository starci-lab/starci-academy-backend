import {
    Injectable,
    Optional,
} from "@nestjs/common"
import {
    ProSubscriptionService,
} from "../pro-subscription/pro-subscription.service"
import type {
    EntityManager 
} from "typeorm"
import {
    ChatParticipationEntity 
} from "@modules/databases/postgresql/primary/entities/chat-participation.entity"
import {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MembershipService 
} from "@modules/membership/membership.service"
import {
    ChatForbiddenException,
    ChatMembershipRequiredException,
} from "@modules/platform/exceptions/errors/community/chat"

/** Actor, room and optional transaction manager evaluated by Global Chat policy. */
export interface GlobalChatPolicyParams {
  conversationId: string;
  user: UserEntity;
  entityManager?: EntityManager;
}

@Injectable()
/** One server-owned eligibility and sanction policy shared by GraphQL and Socket.IO. */
export class GlobalChatPolicyService {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    private readonly membershipService: MembershipService,
    @Optional()
    private readonly proSubscriptionService?: ProSubscriptionService,
    ) {}

    async assertCanRead(
        params: GlobalChatPolicyParams,
    ): Promise<ChatParticipationEntity | null> {
        const { conversationId, user } = params
        const entitled = await this.membershipService.isActive(user.id)
            || await this.proSubscriptionService?.isActive(user.id)
        if (!entitled) {
            throw new ChatMembershipRequiredException({
                userId: user.id,
            })
        }
        const manager = params.entityManager ?? this.entityManager
        const participation = await manager.findOne(ChatParticipationEntity,
            {
                where: {
                    conversation: {
                        id: conversationId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        if (participation?.accessState === "banned") {
            throw new ChatForbiddenException({
                conversationId,
                userId: user.id,
            })
        }
        return participation
    }

    async assertCanWrite(
        params: GlobalChatPolicyParams,
    ): Promise<ChatParticipationEntity | null> {
        const participation = await this.assertCanRead(params)
        if (participation?.accessState !== "muted") {
            return participation
        }
        if (
            participation.mutedUntil &&
      participation.mutedUntil.getTime() <= Date.now()
        ) {
            participation.accessState = "active"
            participation.mutedUntil = null
            await (params.entityManager ?? this.entityManager).save(participation)
            return participation
        }
        throw new ChatForbiddenException({
            conversationId: params.conversationId,
            userId: params.user.id,
        })
    }

    async assertModerator(
        params: GlobalChatPolicyParams,
    ): Promise<ChatParticipationEntity> {
        const participation = await this.assertCanRead(params)
        if (
            !participation ||
      !["moderator",
          "admin"].includes(participation.role)
        ) {
            throw new ChatForbiddenException({
                conversationId: params.conversationId,
                userId: params.user.id,
            })
        }
        return participation
    }
}
