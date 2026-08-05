import {
    Injectable,
} from "@nestjs/common"

@Injectable()
/** Builds the Socket.IO room name for one user's private notification stream. */
export class NotificationRoomService {
    /**
     * Room name for a user's notifications. Only the user's own sockets join it,
     * so emits to this room reach exactly that recipient across all their devices.
     * @param userId - Recipient primary id (UserEntity id, NOT the keycloak sub).
     * @returns The deterministic room name, e.g. `notifications:abc-123`.
     */
    name(userId: string): string {
        // namespace the id so it never collides with other room conventions
        return `notifications:${userId}`
    }
}
