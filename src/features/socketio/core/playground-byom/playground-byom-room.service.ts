import {
    Injectable,
} from "@nestjs/common"

/** Builds the Socket.IO room name shared by one playground session's agent + browser sockets. */
@Injectable()
export class PlaygroundByomRoomService {
    /**
     * Room name for one playground session. The paired agent (`agent:pair`) and
     * the observing browser(s) (`browser:subscribe`) share this room; the
     * gateway relays every command/output/resource-report event through it.
     * @param sessionId - The `playground_sessions.id` primary id.
     * @returns The deterministic room name, e.g. `playground_byom:abc-123`.
     */
    name(sessionId: string): string {
        // namespace the id so it never collides with other room conventions
        return `playground_byom:${sessionId}`
    }
}
