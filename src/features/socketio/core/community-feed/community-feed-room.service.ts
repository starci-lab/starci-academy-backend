import {
    Injectable,
} from "@nestjs/common"
import type {
    CommunityChannel,
} from "@modules/databases"

/**
 * Builds Socket.IO room names for the community feed. Posts fan out to a per-channel
 * room (and a global "all" room); comments + reactions fan out to a per-post room so
 * only viewers of that post refetch.
 */
@Injectable()
export class CommunityFeedRoomService {
    /**
     * Room every post change is broadcast to, regardless of channel. Clients on the
     * unfiltered "all channels" feed join this room.
     * @returns The deterministic global feed room name.
     */
    allRoom(): string {
        return "community_feed:all"
    }

    /**
     * Room for a single channel's post stream.
     * @param channel - The channel the room is scoped to.
     * @returns The deterministic channel room name.
     */
    channelRoom(channel: CommunityChannel): string {
        // namespace the channel so it never collides with other room conventions
        return `community_feed:channel:${channel}`
    }

    /**
     * Room for a single post's comment + reaction stream.
     * @param postId - The post the room is scoped to.
     * @returns The deterministic post room name.
     */
    postRoom(postId: string): string {
        // namespace the post id so it never collides with channel/all rooms
        return `community_feed:post:${postId}`
    }
}
