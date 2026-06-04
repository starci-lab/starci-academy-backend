/**
 * Inventory Service — handles stock update logic after receiving event.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — Decrements stock for product in order (mock, log only).
     * Code — Receives payload with `productId`, logs to console.
     */
    updateStock(data) {
        this.logger.log(`Updating stock for product ${data.productId}...`)
    }
}
