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
    EditGlobalChatMessageRequest,
    MarkGlobalChatReadRequest,
    ModerateGlobalChatRequest,
    ReactGlobalChatMessageRequest,
    RemoveGlobalChatMessageRequest,
    ReportGlobalChatRequest,
    SendGlobalChatMessageRequest,
    SetGlobalChatNotificationsRequest,
    SetGlobalChatRoleRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin GraphQL mutation adapter; transactions and policy stay in the domain service. */
export class GlobalChatMutationService {
    constructor(private readonly domain: GlobalChatDomainService) {}

    send(user: UserEntity, request: SendGlobalChatMessageRequest) {
        return this.domain.sendMessage({
            user,
            commandId: request.clientCommandId,
            body: request.body,
            replyToId: request.replyToId,
            mentionUserIds: request.mentionUserIds,
        })
    }

    react(user: UserEntity, request: ReactGlobalChatMessageRequest) {
        return this.domain.toggleReaction({
            user,
            commandId: request.clientCommandId,
            messageId: request.messageId,
            emoji: request.emoji,
        })
    }

    edit(user: UserEntity, request: EditGlobalChatMessageRequest) {
        return this.domain.editMessage({
            user,
            commandId: request.clientCommandId,
            messageId: request.messageId,
            body: request.body,
            expectedVersion: request.expectedVersion,
        })
    }

    remove(user: UserEntity, request: RemoveGlobalChatMessageRequest) {
        return this.domain.removeMessage({
            user,
            commandId: request.clientCommandId,
            messageId: request.messageId,
            expectedVersion: request.expectedVersion,
        })
    }

    markRead(user: UserEntity, request: MarkGlobalChatReadRequest) {
        return this.domain.markRead({
            user,
            commandId: request.clientCommandId,
            messageId: request.messageId,
        })
    }

    report(user: UserEntity, request: ReportGlobalChatRequest) {
        return this.domain.report({
            user,
            commandId: request.clientCommandId,
            messageId: request.messageId,
            reportedUserId: request.reportedUserId,
            category: request.category,
            details: request.details,
        })
    }

    moderate(user: UserEntity, request: ModerateGlobalChatRequest) {
        return this.domain.moderate({
            user,
            commandId: request.clientCommandId,
            caseId: request.caseId,
            action: request.action,
            reason: request.reason,
            expectedVersion: request.expectedVersion,
            mutedUntil: request.mutedUntil,
        })
    }

    async setRole(user: UserEntity, request: SetGlobalChatRoleRequest) {
        const room = await this.domain.roomState(user)
        await this.domain.setRole({
            actor: user,
            targetUserId: request.targetUserId,
            role: request.role,
        })
        return {
            commandId: request.clientCommandId,
            conversationId: room.conversationId,
            status: request.role,
        }
    }

    notifications(user: UserEntity, request: SetGlobalChatNotificationsRequest) {
        return this.domain.setNotificationsMuted({
            user,
            commandId: request.clientCommandId,
            muted: request.muted,
        })
    }
}
