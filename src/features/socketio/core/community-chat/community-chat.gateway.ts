import {
    OnModuleInit,
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    CommunityChatWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    ChatMessageChangedEventPayload,
} from "@modules/event"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    CommunityChatRoomService,
} from "./community-chat-room.service"
import type {
    ChatMessageCreatedSocketIoMessage,
    SubscribeCommunityChatSocketIoPayload,
} from "./types"

@CommunityChatWebSocketGateway()
/**
 * WebSocket gateway for the `/community_chat` namespace.
 *
 * Clients join a per-conversation room and receive new-message events for that
 * conversation. Sends happen in the bussiness service, which fans out a local
 * {@link EventName.ChatMessageCreated} event; this gateway forwards it to the
 * matching room (refetch-on-event model).
 */
export class CommunityChatGateway implements OnModuleInit {
    constructor(
        private readonly communityChatRoomService: CommunityChatRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /** The namespace server instance used to emit to rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Joins the caller to a conversation's room so it receives that conversation's
     * new-message events.
     */
    @SubscribeMessage(PublicationEvent.SubscribeCommunityChat)
    handleSubscribeCommunityChat(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubscribeCommunityChatSocketIoPayload,
    ): void {
        // join the room keyed by conversation id; future emits reach this socket
        client.join(this.communityChatRoomService.name(payload.data.conversationId))
    }

    /**
     * Wires the local event listener that forwards new messages to their room.
     */
    onModuleInit(): void {
        // a new message -> push to the conversation room so participants refetch
        this.eventEmitterService.on({
            event: EventName.ChatMessageCreated,
            listener: (payload: ChatMessageChangedEventPayload) => {
                this.wsResponseService.successToRoom<ChatMessageCreatedSocketIoMessage>({
                    message: "Chat message created",
                    data: {
                        conversationId: payload.conversationId,
                        messageId: payload.messageId,
                        authorId: payload.authorId,
                    },
                    room: this.communityChatRoomService.name(payload.conversationId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.ChatMessageCreated,
                })
            },
        })
    }
}
