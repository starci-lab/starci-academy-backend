import {
    Injectable 
} from "@nestjs/common"
import {
    GlobalChatService as GlobalChatDomainService 
} from "@modules/bussiness/chat/global-chat.service"
import type {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    GlobalChatMessagesRequest,
    GlobalChatModerationQueueRequest,
} from "./graphql-types/request"

@Injectable()
/** GraphQL read adapter; domain service retains eligibility and projection ownership. */
export class GlobalChatQueryService {
    constructor(private readonly globalChatService: GlobalChatDomainService) {}

    room(user: UserEntity) {
        return this.globalChatService.roomState(user)
    }

    messages(user: UserEntity, request: GlobalChatMessagesRequest) {
        return this.globalChatService.listMessages({
            user,
            cursor: request.cursor,
            limit: request.limit,
        })
    }

    async moderationQueue(
        user: UserEntity,
        request: GlobalChatModerationQueueRequest,
    ) {
        const items = await this.globalChatService.moderationQueue({
            user,
            status: request.status,
            limit: request.limit,
        })
        return {
            items: items.map((item) => ({
                ...item,
                evidenceJson: JSON.stringify(item.evidence),
            })),
        }
    }
}
