import {
    Injectable,
} from "@nestjs/common"

/** Builds the Socket.IO room name for a content's discussion (comments + reactions). */
@Injectable()
export class ContentDiscussionRoomService {
    /**
     * Room name for a content's discussion. All viewers of one content share this room.
     * @param contentId - Content primary id.
     * @returns The deterministic room name, e.g. `content_discussion:abc-123`.
     */
    name(contentId: string): string {
        // namespace the id so it never collides with other room conventions
        return `content_discussion:${contentId}`
    }
}
