import {
    OnModuleInit 
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace 
} from "socket.io"
import {
    CommunityChatWebSocketGateway 
} from "@modules/platform/socketio/decorators/gateway"
import {
    socketIoKeycloakAuthMiddleware 
} from "@modules/platform/socketio/middlewares/keycloak-auth"
import {
    WsResponseService 
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket 
} from "@modules/platform/socketio/types/socket"
import {
    EventName 
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService 
} from "@modules/platform/event/event-emitter.service"
import {
    ChatService 
} from "@modules/bussiness/chat/chat.service"
import type {
    ChatMessageChangedEventPayload,
    GlobalChatInvalidatedEventPayload,
} from "@modules/platform/event/types/event-payload/chat"
import {
    PublicationEvent 
} from "../enums/publication-event"
import {
    SubscriptionEvent 
} from "../enums/subscription-event"
import {
    CommunityChatRoomService 
} from "./community-chat-room.service"
import type {
    ChatMessageCreatedSocketIoMessage,
    CommunityChatSubscriptionSocketIoMessage,
    GlobalChatInvalidatedSocketIoMessage,
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
    private readonly chatService: ChatService,
    private readonly wsResponseService: WsResponseService,
    private readonly eventEmitterService: EventEmitterService,
    ) {}

  /** The namespace server instance used to emit to rooms. */
  @WebSocketServer()
    private readonly server: Namespace

  /**
   * Authenticate the namespace before any subscription handler can run. The
   * middleware stamps the verified Keycloak subject on `client.data.userId`;
   * room authorization below resolves that subject to the local user row.
   */
  afterInit(): void {
      this.server.use(socketIoKeycloakAuthMiddleware)
  }

  /**
   * Joins the caller to a conversation's room so it receives that conversation's
   * new-message events.
   */
  @SubscribeMessage(PublicationEvent.SubscribeCommunityChat)
  async handleSubscribeCommunityChat(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SubscribeCommunityChatSocketIoPayload,
  ): Promise<void> {
      const conversationId = payload.data.conversationId
      // Authentication alone is insufficient: community chat is member-only,
      // and founder DMs are private to their owner and the founder. Authorize
      // before joining so guessing a UUID never becomes a data-exfiltration path.
      try {
          await this.chatService.assertCanSubscribe({
              conversationId,
              keycloakId: client.data.userId,
          })
          await client.join(this.communityChatRoomService.name(conversationId))
          this.wsResponseService.success<CommunityChatSubscriptionSocketIoMessage>({
              client,
              eventName: SubscriptionEvent.CommunityChatSubscription,
              message: "Community chat subscription authorized",
              data: {
                  conversationId,
              },
          })
      } catch (error) {
      // Emit a stable terminal result instead of throwing an untyped socket
      // exception. Most importantly, this branch never calls `join()`.
          this.wsResponseService.error({
              client,
              eventName: SubscriptionEvent.CommunityChatSubscription,
              error: error as Error,
          })
      }
  }

  /**
   * Wires the local event listener that forwards new messages to their room.
   */
  onModuleInit(): void {
      // a new message -> push to the conversation room so participants refetch
      this.eventEmitterService.on({
          event: EventName.ChatMessageCreated,
          listener: (payload: ChatMessageChangedEventPayload) => {
              this.wsResponseService.successToRoom<ChatMessageCreatedSocketIoMessage>(
                  {
                      message: "Chat message created",
                      data: {
                          conversationId: payload.conversationId,
                          messageId: payload.messageId,
                          authorId: payload.authorId,
                      },
                      room: this.communityChatRoomService.name(payload.conversationId),
                      namespace: this.server,
                      eventName: SubscriptionEvent.ChatMessageCreated,
                  },
              )
          },
      })
      this.eventEmitterService.on({
          event: EventName.GlobalChatInvalidated,
          listener: (payload: GlobalChatInvalidatedEventPayload) => {
              this.wsResponseService.successToRoom<GlobalChatInvalidatedSocketIoMessage>(
                  {
                      message: "Global Chat state changed",
                      data: {
                          conversationId: payload.conversationId,
                          messageId: payload.messageId,
                      },
                      room: this.communityChatRoomService.name(payload.conversationId),
                      namespace: this.server,
                      eventName: SubscriptionEvent.GlobalChatInvalidated,
                  },
              )
          },
      })
  }
}
