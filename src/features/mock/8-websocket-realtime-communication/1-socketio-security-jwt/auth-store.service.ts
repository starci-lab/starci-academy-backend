import {
    Injectable,
} from "@nestjs/common"
import type {
    JwtUser,
} from "./types/auth"

/** Internal record kept per registered username. */
interface StoredUser {
    /** Stable numeric subject id assigned on first register. */
    sub: number
    /** Plaintext password -- in-memory only, this is a throwaway demo store. */
    password: string
}

@Injectable()
/**
 * In-memory user store for the JWT security lesson mock.
 *
 * Pure RAM -- no database. Holds username -> { sub, password } so register can
 * mint a stable subject id and login can verify the password. Reset on process
 * restart, which is fine for a sandbox.
 */
export class AuthStoreService {
    /** Registered users keyed by username. */
    private readonly users = new Map<string, StoredUser>()

    /** Auto-incrementing subject id source. */
    private nextSub = 1

    /**
     * Register (or re-register) a username with a password.
     *
     * Re-registering keeps the original subject id but updates the password, so
     * repeated demo runs stay idempotent.
     *
     * @returns The JWT user claims to embed in the issued token.
     */
    register(username: string, password: string): JwtUser {
        // reuse the existing subject id when the username is already known
        const existing = this.users.get(username)
        // assign a fresh subject id only for brand-new usernames
        const sub = existing?.sub ?? this.nextSub++
        // upsert the record with the latest password
        this.users.set(username,
            {
                sub, password 
            })
        // hand back the claims the caller signs into the access token
        return {
            sub, username 
        }
    }

    /**
     * Verify a username/password pair.
     *
     * @returns The JWT user claims when the credentials match, otherwise null.
     */
    verify(username: string, password: string): JwtUser | null {
        // look up the stored record for this username
        const record = this.users.get(username)
        // reject unknown users or password mismatches
        if (record?.password !== password) return null
        // credentials are valid -- return the claims for token signing
        return {
            sub: record.sub, username 
        }
    }
}
