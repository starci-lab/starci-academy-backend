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
    ContentDiscussionWebSocketGateway,
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
    CommentChangedEventPayload,
    CommentReactionChangedEventPayload,
    ContentReactionChangedEventPayload,
} from "@modules/event"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../enums"
import {
    ContentDiscussionRoomService,
} from "./content-discussion-room.service"
import type {
    CommentChangedSocketIoMessage,
    CommentReactionChangedSocketIoMessage,
    ContentReactionChangedSocketIoMessage,
    SubscribeContentDiscussionSocketIoPayload,
} from "./types"

@ContentDiscussionWebSocketGateway()
/**
 * WebSocket gateway for the `/content_discussion` namespace.
 *
 * Clients join a per-content room and receive comment + reaction change events for that
 * content. The actual writes happen in the bussiness services, which fan out local
 * {@link EventName} events; this gateway forwards them to the matching room.
 */
export class ContentDiscussionGateway implements OnModuleInit {
    constructor(
        private readonly contentDiscussionRoomService: ContentDiscussionRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /** The namespace server instance used to emit to rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Joins the caller to a content's discussion room so it receives that content's events.
     */
    @SubscribeMessage(PublicationEvent.SubscribeContentDiscussion)
    handleSubscribeContentDiscussion(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubscribeContentDiscussionSocketIoPayload,
    ): void {
        // join the room keyed by content id; future emits to this room reach this socket
        client.join(this.contentDiscussionRoomService.name(payload.data.contentId))
    }

    /**
     * Wires local event listeners that forward discussion changes to the content room.
     */
    onModuleInit(): void {
        // a new comment -> push to the content room so other viewers refetch
        this.eventEmitterService.on({
            event: EventName.CommentCreated,
            listener: (payload: CommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommentCreated,
                    payload)
            },
        })
        // an edited comment -> same room push
        this.eventEmitterService.on({
            event: EventName.CommentUpdated,
            listener: (payload: CommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommentUpdated,
                    payload)
            },
        })
        // a soft-deleted comment -> same room push
        this.eventEmitterService.on({
            event: EventName.CommentDeleted,
            listener: (payload: CommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommentDeleted,
                    payload)
            },
        })
        // content reaction totals moved -> push the content id so clients refetch the summary
        this.eventEmitterService.on({
            event: EventName.ContentReactionChanged,
            listener: (payload: ContentReactionChangedEventPayload) => {
                this.wsResponseService.successToRoom<ContentReactionChangedSocketIoMessage>({
                    message: "Content reaction changed",
                    data: {
                        contentId: payload.contentId,
                    },
                    room: this.contentDiscussionRoomService.name(payload.contentId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.ContentReactionChanged,
                })
            },
        })
        // comment reaction totals moved -> push content + comment id for a targeted refetch
        this.eventEmitterService.on({
            event: EventName.CommentReactionChanged,
            listener: (payload: CommentReactionChangedEventPayload) => {
                this.wsResponseService.successToRoom<CommentReactionChangedSocketIoMessage>({
                    message: "Comment reaction changed",
                    data: {
                        contentId: payload.contentId,
                        commentId: payload.commentId,
                    },
                    room: this.contentDiscussionRoomService.name(payload.contentId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.CommentReactionChanged,
                })
            },
        })
    }

    /**
     * Forwards a comment create/update/delete event to its content room.
     * @param eventName - The client-facing subscription event to emit.
     * @param payload - The comment change payload from the domain layer.
     */
    private emitCommentChange(
        eventName: SubscriptionEvent,
        payload: CommentChangedEventPayload,
    ): void {
        // all three comment events share the same shape + room targeting
        this.wsResponseService.successToRoom<CommentChangedSocketIoMessage>({
            message: "Comment changed",
            data: {
                contentId: payload.contentId,
                commentId: payload.commentId,
                parentCommentId: payload.parentCommentId,
            },
            room: this.contentDiscussionRoomService.name(payload.contentId),
            namespace: this.server,
            eventName,
        })
    }
}
