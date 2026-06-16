import {
    Injectable,
} from "@nestjs/common"

/** Result of recording or dropping a tab for a user in a room. */
interface TabChange {
    /** True when this was the user's first tab in the room (transition empty -> present). */
    isFirstTab: boolean
    /** True when this was the user's last tab in the room (transition present -> empty). */
    isLastTab: boolean
}

/**
 * In-memory presence store for lesson `2-presence-and-typing-indicators`.
 *
 * Mirrors the Redis SADD/SCARD/SREM ref-counting from the real lesson, but with
 * plain `Map`/`Set` so the sandbox needs no Redis. Structure:
 * `room -> (userId -> set of socket ids)`. A user is "online" while they hold at
 * least one socket; multiple tabs of the same user count as one presence entry.
 */
@Injectable()
export class PresenceStoreService {
    /** room -> userId -> set of live socket ids. */
    private readonly rooms = new Map<string, Map<string, Set<string>>>()

    /**
     * Record a socket (tab) for a user in a room.
     *
     * @returns Whether this was the user's first tab (so callers can broadcast `user-joined` once).
     */
    addTab(roomId: string, userId: string, socketId: string): TabChange {
        // lazily create the per-room user map
        const users = this.rooms.get(roomId) ?? new Map<string, Set<string>>()
        this.rooms.set(roomId,
            users)
        // lazily create the per-user socket set
        const sockets = users.get(userId) ?? new Set<string>()
        // first tab means the set was empty before this add
        const isFirstTab = sockets.size === 0
        // record the socket
        sockets.add(socketId)
        users.set(userId,
            sockets)
        // adding can never be the last tab
        return {
            isFirstTab, isLastTab: false 
        }
    }

    /**
     * Drop a socket (tab) for a user in a room.
     *
     * @returns Whether this was the user's last tab (so callers can broadcast `user-left` once).
     */
    removeTab(roomId: string, userId: string, socketId: string): TabChange {
        // resolve the per-room user map; nothing to do if the room is unknown
        const users = this.rooms.get(roomId)
        if (!users) return {
            isFirstTab: false, isLastTab: false 
        }
        // resolve the per-user socket set
        const sockets = users.get(userId)
        if (!sockets) return {
            isFirstTab: false, isLastTab: false 
        }
        // remove this socket
        sockets.delete(socketId)
        // last tab means the set is now empty
        const isLastTab = sockets.size === 0
        // prune empty structures so `members` stays accurate
        if (isLastTab) {
            users.delete(userId)
            if (users.size === 0) this.rooms.delete(roomId)
        }
        return {
            isFirstTab: false, isLastTab 
        }
    }

    /**
     * List the distinct user ids currently online in a room.
     */
    members(roomId: string): Array<string> {
        // an unknown room has no members
        const users = this.rooms.get(roomId)
        if (!users) return []
        // the map keys are exactly the online user ids
        return Array.from(users.keys())
    }
}
