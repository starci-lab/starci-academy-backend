import {
    Column,
    Entity,
    Index,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"

@Entity("login_sessions")
@Unique(
    "UQ_login_sessions_keycloak_session",
    [
        "keycloakId",
        "sessionId",
    ],
)
// composite index for the hot path: list a user's active (non-revoked) sessions
@Index(
    "IDX_login_sessions_keycloak_revoked",
    [
        "keycloakId",
        "revokedAt",
    ],
)
/**
 * An authenticated login session bound to a single device/browser. One row per
 * (keycloakId, sessionId); the `sessionId` mirrors the value stored in the Redis
 * enforcement hash and handed to the device as the `session_id` cookie.
 *
 * Linked by `keycloakId` (the Keycloak subject) rather than a foreign key to
 * `UserEntity`: a session is created at login time, which can happen before the
 * local `UserEntity` mirror row exists (the auth guard creates that lazily on the
 * first authenticated request). Keying by subject keeps this table consistent with
 * the Redis layer, which is also keyed by subject.
 *
 * Used to power the "logged-in devices" UI (list + revoke) and to enforce the
 * max-devices-per-account policy. `revokedAt` is null while the session is active.
 */
export class LoginSessionEntity extends UuidAbstractEntity {
    @Column({
        name: "keycloak_id",
        type: "varchar",
        length: 64,
    })
        keycloakId: string

    @Column({
        name: "session_id",
        type: "varchar",
        length: 64,
    })
        sessionId: string

    @Column({
        name: "device_type",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        deviceType: string | null

    @Column({
        name: "os",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        os: string | null

    @Column({
        name: "browser",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        browser: string | null

    @Column({
        name: "ip_address",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        ipAddress: string | null

    @Column({
        name: "location",
        type: "varchar",
        length: 128,
        nullable: true,
    })
        location: string | null

    @Column({
        name: "last_seen_at",
        type: "timestamptz",
        default: () => "NOW()",
    })
        lastSeenAt: Date

    @Column({
        name: "revoked_at",
        type: "timestamptz",
        nullable: true,
    })
        revokedAt: Date | null
}
