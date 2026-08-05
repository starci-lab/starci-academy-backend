import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"
import type {
    CommunityChannel,
} from "@modules/databases/postgresql/primary/enums/community-channel"

/** Data a client sends to join community feed rooms. */
export interface SubscribeCommunityFeedData {
    /** Channel to follow for new posts; omit to follow the unfiltered "all" feed. */
    channel?: CommunityChannel | null
    /** Post to follow for comment/reaction changes; omit when only watching the feed. */
    postId?: string | null
}

/** Client -> server payload to join community feed rooms. */
export type SubscribeCommunityFeedSocketIoPayload = SocketIoPayload<SubscribeCommunityFeedData>
