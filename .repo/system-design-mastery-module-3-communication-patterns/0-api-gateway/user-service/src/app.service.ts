/**
 * User Service — keeps users in memory (no DB required).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/**
 * A user record returned by the service.
 */
export type User = { id: number; name: string; email: string }

/**
 * Payload accepted when creating a user.
 */
export type CreateUserInput = { name: string; email: string }

@Injectable()
/**
 * Class `AppService` — in-memory user store for the gateway routing demo.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)
    // In-memory list preserves insertion order; resets on restart (demo only).
    private readonly users: User[] = []
    // Monotonic id counter; first created user gets id 1.
    private counter = 0

    /**
     * Logic — Append a new user and return it with a generated id.
     * Code — Increment counter, push to array, return the created record.
     */
    create(input: CreateUserInput): User {
        const created: User = { id: ++this.counter, name: input.name, email: input.email }
        this.users.push(created)
        this.logger.log(`Created user ${created.id}`)
        return created
    }

    /**
     * Logic — Return all users in insertion order.
     * Code — Return the in-memory array.
     */
    list(): User[] {
        this.logger.log("Fetching users from memory")
        return this.users
    }
}
