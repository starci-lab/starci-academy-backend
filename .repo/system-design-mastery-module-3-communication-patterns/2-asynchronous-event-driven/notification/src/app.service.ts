/**
 * Notification Service — handles push notification logic after receiving event.
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
     * Logic — Sends push notification to user (mock, log only).
     * Code — Receives payload with `orderId`, logs to console.
     */
    sendNotification(data) {
        this.logger.log(`Sending push notification to user for order ${data.orderId}...`)
    }
}
