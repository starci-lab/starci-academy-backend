import {
    OnModuleInit,
    Optional,
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
import { EventEmitter2 } from "@nestjs/event-emitter"
import { UserService } from "@modules/bussiness/user/user.service"
import { EntityManager } from "typeorm"
import { InjectPrimaryPostgreSQLEntityManager } from "@modules/databases/postgresql/primary/primary.decorators"
import { CommunityPostEntity } from "@modules/databases/postgresql/primary/entities/community-post.entity"
import { CommunityScope } from "@modules/databases/postgresql/primary/enums/community-scope"
import { COURSE_COMMUNITY_CHANGED_EVENT } from "@modules/bussiness/community/community-outbox-publisher.service"
import {
    CommunityFeedWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import type {
    CommunityCommentChangedEventPayload,
    CommunityCommentReactionChangedEventPayload,
    CommunityPostChangedEventPayload,
    CommunityPostReactionChangedEventPayload,
} from "@modules/platform/event/types/event-payload/community"
import {
    PublicationEvent,
} from "../enums/publication-event"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import {
    CommunityFeedRoomService,
} from "./community-feed-room.service"
import type {
    CommunityCommentChangedSocketIoMessage,
    CommunityCommentReactionChangedSocketIoMessage,
    CommunityPostChangedSocketIoMessage,
    CommunityPostReactionChangedSocketIoMessage,
} from "./types/message"
import type {
    SubscribeCommunityFeedSocketIoPayload,
} from "./types/payload"

@CommunityFeedWebSocketGateway()
/**
 * WebSocket gateway for the `/community_feed` namespace.
 *
 * Clients join a channel room (or the global "all" room) to receive new-post
 * events, and/or a per-post room to receive comment + reaction events for that
 * post. The actual writes happen in the bussiness services, which fan out local
 * {@link EventName} events; this gateway forwards them to the matching rooms.
 */
export class CommunityFeedGateway implements OnModuleInit {
    constructor(
        private readonly communityFeedRoomService: CommunityFeedRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly eventEmitterService: EventEmitterService,
        @Optional() private readonly rawEvents?: EventEmitter2,
        @Optional() private readonly userService?: UserService,
        @Optional() @InjectPrimaryPostgreSQLEntityManager() private readonly manager?: EntityManager,
    ) {}

    /** The namespace server instance used to emit to rooms. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Joins the caller to the feed rooms it asked for: a per-post room when a
     * postId is given, a per-channel room when a channel is given, or the global
     * "all" room when neither is provided.
     */
    @SubscribeMessage(PublicationEvent.SubscribeCommunityFeed)
    handleSubscribeCommunityFeed(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubscribeCommunityFeedSocketIoPayload,
    ): Promise<void> | void {
        if (payload.data.courseId) {
            return this.subscribeCourse(client, payload.data.courseId, payload.data.postId ?? null)
        }
        // a post-detail viewer wants this post's comment/reaction stream
        if (payload.data.postId) {
            client.join(this.communityFeedRoomService.postRoom(payload.data.postId))
        }
        // a channel viewer wants new posts in that channel
        if (payload.data.channel) {
            client.join(this.communityFeedRoomService.channelRoom(payload.data.channel))
        }
        // no post + no channel -> the unfiltered "all channels" feed
        if (!payload.data.postId && !payload.data.channel) {
            client.join(this.communityFeedRoomService.allRoom())
        }
    }

    /**
     * Wires local event listeners that forward community changes to their rooms.
     */
    onModuleInit(): void {
        this.rawEvents?.on(COURSE_COMMUNITY_CHANGED_EVENT, (payload: { courseId: string; postId: string; commentId?: string | null }) => void this.emitCourseChange(payload))
        // post create/update/delete -> push to the channel room + the global feed room
        this.eventEmitterService.on({
            event: EventName.CommunityPostCreated,
            listener: (payload: CommunityPostChangedEventPayload) => {
                this.emitPostChange(SubscriptionEvent.CommunityPostCreated,
                    payload)
            },
        })
        this.eventEmitterService.on({
            event: EventName.CommunityPostUpdated,
            listener: (payload: CommunityPostChangedEventPayload) => {
                this.emitPostChange(SubscriptionEvent.CommunityPostUpdated,
                    payload)
            },
        })
        this.eventEmitterService.on({
            event: EventName.CommunityPostDeleted,
            listener: (payload: CommunityPostChangedEventPayload) => {
                this.emitPostChange(SubscriptionEvent.CommunityPostDeleted,
                    payload)
            },
        })
        // comment create/update/delete -> push to the owning post's room
        this.eventEmitterService.on({
            event: EventName.CommunityCommentCreated,
            listener: (payload: CommunityCommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommunityCommentCreated,
                    payload)
            },
        })
        this.eventEmitterService.on({
            event: EventName.CommunityCommentUpdated,
            listener: (payload: CommunityCommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommunityCommentUpdated,
                    payload)
            },
        })
        this.eventEmitterService.on({
            event: EventName.CommunityCommentDeleted,
            listener: (payload: CommunityCommentChangedEventPayload) => {
                this.emitCommentChange(SubscriptionEvent.CommunityCommentDeleted,
                    payload)
            },
        })
        // post reaction totals moved -> push the post id to its room for a refetch
        this.eventEmitterService.on({
            event: EventName.CommunityPostReactionChanged,
            listener: (payload: CommunityPostReactionChangedEventPayload) => {
                this.wsResponseService.successToRoom<CommunityPostReactionChangedSocketIoMessage>({
                    message: "Community post reaction changed",
                    data: {
                        postId: payload.postId,
                    },
                    room: this.communityFeedRoomService.postRoom(payload.postId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.CommunityPostReactionChanged,
                })
            },
        })
        // comment reaction totals moved -> push post + comment id to the post room
        this.eventEmitterService.on({
            event: EventName.CommunityCommentReactionChanged,
            listener: (payload: CommunityCommentReactionChangedEventPayload) => {
                this.wsResponseService.successToRoom<CommunityCommentReactionChangedSocketIoMessage>({
                    message: "Community comment reaction changed",
                    data: {
                        postId: payload.postId,
                        commentId: payload.commentId,
                    },
                    room: this.communityFeedRoomService.postRoom(payload.postId),
                    namespace: this.server,
                    eventName: SubscriptionEvent.CommunityCommentReactionChanged,
                })
            },
        })
    }

    private async subscribeCourse(client: TypedSocket, courseId: string, postId: string | null): Promise<void> {
        if (!client.data.userId || !this.userService || !await this.userService.checkEnrollment(client.data.userId, courseId)) return
        if (postId) {
            const exists = await this.manager?.count(CommunityPostEntity, { where: { id: postId, scope: CommunityScope.Course, course: { id: courseId }, isDeleted: false } })
            if (!exists) return
            await client.join(this.communityFeedRoomService.coursePostRoom(courseId, postId))
            return
        }
        await client.join(this.communityFeedRoomService.courseRoom(courseId))
    }

    private async emitCourseChange(payload: { courseId: string; postId: string; commentId?: string | null }): Promise<void> {
        if (!this.userService) return
        const courseRoom = this.communityFeedRoomService.courseRoom(payload.courseId)
        const postRoom = this.communityFeedRoomService.coursePostRoom(payload.courseId, payload.postId)
        const sockets = await this.server.fetchSockets()
        await Promise.all(sockets.filter((socket) => socket.rooms.has(courseRoom) || socket.rooms.has(postRoom)).map(async (socket) => {
            if (!socket.data.userId || !await this.userService?.checkEnrollment(socket.data.userId, payload.courseId)) {
                await socket.leave(courseRoom); await socket.leave(postRoom)
            }
        }))
        this.wsResponseService.successToRoom({ message: "Course community changed", data: payload, room: courseRoom, namespace: this.server, eventName: SubscriptionEvent.CommunityPostUpdated })
        this.wsResponseService.successToRoom({ message: "Course community post changed", data: payload, room: postRoom, namespace: this.server, eventName: SubscriptionEvent.CommunityPostUpdated })
    }

    /**
     * Forwards a post create/update/delete event to its channel room + the global
     * feed room so both the channel view and the "all" view refetch.
     * @param eventName - The client-facing subscription event to emit.
     * @param payload - The post change payload from the domain layer.
     */
    private emitPostChange(
        eventName: SubscriptionEvent,
        payload: CommunityPostChangedEventPayload,
    ): void {
        // the body is identical for both rooms; only the room target differs
        const body = {
            postId: payload.postId,
            channel: payload.channel,
        }
        // the channel-scoped feed
        this.wsResponseService.successToRoom<CommunityPostChangedSocketIoMessage>({
            message: "Community post changed",
            data: body,
            room: this.communityFeedRoomService.channelRoom(payload.channel),
            namespace: this.server,
            eventName,
        })
        // the unfiltered "all channels" feed
        this.wsResponseService.successToRoom<CommunityPostChangedSocketIoMessage>({
            message: "Community post changed",
            data: body,
            room: this.communityFeedRoomService.allRoom(),
            namespace: this.server,
            eventName,
        })
    }

    /**
     * Forwards a comment create/update/delete event to its owning post's room.
     * @param eventName - The client-facing subscription event to emit.
     * @param payload - The comment change payload from the domain layer.
     */
    private emitCommentChange(
        eventName: SubscriptionEvent,
        payload: CommunityCommentChangedEventPayload,
    ): void {
        // all three comment events share the same shape + room targeting
        this.wsResponseService.successToRoom<CommunityCommentChangedSocketIoMessage>({
            message: "Community comment changed",
            data: {
                postId: payload.postId,
                commentId: payload.commentId,
                parentCommentId: payload.parentCommentId,
            },
            room: this.communityFeedRoomService.postRoom(payload.postId),
            namespace: this.server,
            eventName,
        })
    }
}
