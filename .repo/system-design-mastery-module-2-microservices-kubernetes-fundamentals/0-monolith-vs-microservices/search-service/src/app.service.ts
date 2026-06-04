/**
 * Core lesson service — methods documented with Logic + Code.
 */
import {
    Injectable,
} from "@nestjs/common"

/**
 * Service handling business logic for Search Service.
 */
@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
/**
 * Logic — Read/query via `getHello`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getHello(): string {
        return "Hello World!"
    }
}
