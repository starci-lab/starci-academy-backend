import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ChatConversationEntity,
    ChatConversationType,
    ChatMessageEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ChatConversationNotFoundException,
    ChatForbiddenException,
    ChatMembershipRequiredException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    envConfig,
} from "@modules/env"
import {
    MembershipService,
} from "@modules/membership"
import type {
    AssertChatAccessParams,
    GetOrCreateFounderDmParams,
    ListChatMessagesParams,
    ListChatMessagesResult,
    SendChatMessageParams,
} from "./types"

/**
 * Domain service for community chat: the single global community room + per-member
 * founder DM threads, plus message listing/sending. Chat is MEMBER-ONLY (active
 * membership), enforced here; a founder DM is further restricted to its owning
 * member + the founder. Every sent message fans out a local event so the Socket.IO
 * gateway pushes it to the conversation's room.
 */
@Injectable()
export class ChatService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
        private readonly membershipService: MembershipService,
    ) {}

    /**
     * Loads (or lazily creates) the single global community chat conversation.
     * @returns The community conversation row.
     */
    async getOrCreateCommunityConversation(): Promise<ChatConversationEntity> {
        // there is exactly one community room (member = null) — find it first
        const existing = await this.entityManager.findOne(ChatConversationEntity,
            {
                where: {
                    type: ChatConversationType.Community,
                },
            })
        if (existing) {
            return existing
        }
        // first access ever → create the singleton community room
        return this.entityManager.save(this.entityManager.create(ChatConversationEntity,
            {
                type: ChatConversationType.Community,
                member: null,
            }))
    }

    /**
     * Loads (or lazily creates) a member's private founder DM conversation.
     * @param params - {@link GetOrCreateFounderDmParams}
     * @returns The member's founder DM conversation row.
     */
    async getOrCreateFounderDm({
        memberId,
    }: GetOrCreateFounderDmParams): Promise<ChatConversationEntity> {
        // one DM per member — find this member's thread first
        const existing = await this.entityManager.findOne(ChatConversationEntity,
            {
                where: {
                    type: ChatConversationType.FounderDm,
                    member: {
                        id: memberId,
                    },
                },
            })
        if (existing) {
            return existing
        }
        // first time the member opens the DM → create it
        return this.entityManager.save(this.entityManager.create(ChatConversationEntity,
            {
                type: ChatConversationType.FounderDm,
                member: {
                    id: memberId,
                },
            }))
    }

    /**
     * Loads a conversation by id, or throws if it does not exist.
     * @param conversationId - Conversation primary id.
     * @returns The conversation row.
     */
    async getConversationOrThrow(conversationId: string): Promise<ChatConversationEntity> {
        // load the row so callers can access-check + scope messages to it
        const conversation = await this.entityManager.findOne(ChatConversationEntity,
            {
                where: {
                    id: conversationId,
                },
            })
        // a missing row is a hard not-found for every caller
        if (!conversation) {
            throw new ChatConversationNotFoundException({
                conversationId,
            })
        }
        return conversation
    }

    /**
     * Lists a page of a conversation's messages (newest-first), after access checks.
     * @param params - {@link ListChatMessagesParams}
     * @returns The page of messages + total count.
     */
    async listMessages({
        conversationId,
        user,
        offset,
        limit,
    }: ListChatMessagesParams): Promise<ListChatMessagesResult> {
        // resolve + access-check the conversation before reading any message
        const conversation = await this.getConversationOrThrow(conversationId)
        await this.assertCanAccess({
            conversation,
            user,
        })
        // newest-first page; total drives the cursor in the resolver
        const [
            messages,
            total,
        ] = await this.entityManager.findAndCount(ChatMessageEntity,
            {
                where: {
                    conversation: {
                        id: conversationId,
                    },
                },
                relations: {
                    author: true,
                },
                order: {
                    createdAt: "DESC",
                },
                skip: offset,
                take: limit,
            })
        return {
            messages,
            total,
        }
    }

    /**
     * Sends a message to a conversation, after access checks, and fans out the event.
     * @param params - {@link SendChatMessageParams}
     * @returns The persisted message (author relation loaded).
     */
    async sendMessage({
        conversationId,
        body,
        user,
    }: SendChatMessageParams): Promise<ChatMessageEntity> {
        // resolve + access-check the conversation before writing
        const conversation = await this.getConversationOrThrow(conversationId)
        await this.assertCanAccess({
            conversation,
            user,
        })
        // build the row via relation ids only — no need to load full rows
        const draft = this.entityManager.create(ChatMessageEntity,
            {
                body,
                isDeleted: false,
                conversation: {
                    id: conversationId,
                },
                author: {
                    id: user.id,
                },
            })
        // persist then reload so RelationId virtual columns + author are populated
        const saved = await this.entityManager.save(draft)
        const message = await this.entityManager.findOne(ChatMessageEntity,
            {
                where: {
                    id: saved.id,
                },
                relations: {
                    author: true,
                },
            })
        // the row was just written, so it must reload; fall back defensively
        const resolved = message ?? saved
        // push to the conversation room so other participants refetch the latest
        await this.eventEmitterService.emit({
            event: EventName.ChatMessageCreated,
            payload: {
                conversationId,
                messageId: resolved.id,
                authorId: user.id,
            },
        })
        return resolved
    }

    /**
     * Asserts the user may participate in a conversation: an active membership is
     * required for any chat, and a founder DM is further restricted to its owning
     * member + the founder.
     * @param params - {@link AssertChatAccessParams}
     */
    private async assertCanAccess({
        conversation,
        user,
    }: AssertChatAccessParams): Promise<void> {
        // chat is member-only — block anyone without an active membership
        const isMember = await this.membershipService.isActive(user.id)
        if (!isMember) {
            throw new ChatMembershipRequiredException({
                userId: user.id,
            })
        }
        // a founder DM is private to its owning member + the founder
        if (conversation.type === ChatConversationType.FounderDm) {
            // the founder is identified by the configured username
            const isFounder = user.username === envConfig().community.founderUsername
            // anyone who is neither the DM's member nor the founder is forbidden
            if (conversation.memberId !== user.id && !isFounder) {
                throw new ChatForbiddenException({
                    conversationId: conversation.id,
                    userId: user.id,
                })
            }
        }
    }
}
