/**
 * User Service — mock user data in memory (no DB required).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export type User = { id: number; name: string; email: string }

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — Returns mock user data for Kong Gateway routing test.
     * Code — Returns hardcoded User[] array.
     */
    getUsers(): User[] {
        this.logger.log("Fetching users from memory")
        return [
            { id: 1, name: "Alice", email: "alice@starci.com" },
            { id: 2, name: "Bob", email: "bob@starci.com" },
        ]
    }
}
