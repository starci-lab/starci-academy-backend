/**
 * Orders service — logic for trace generation and demo logging.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

@Injectable()
/**
 * Class `OrdersService` — lesson lab component.
 */
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    /**
     * Logic: Simulate successful order processing, log INFO with trace for Loki lookup.
     * Code: Generate trace id from timestamp, log via Winston, return response.
     */
    accept(): { status: string; trace: string } {
        const trace = `trace-${Date.now()}`
        // HOSTNAME in containers helps distinguish replicas in demos.
        this.logger.log(
            `[${process.env.HOSTNAME ?? "local"}] Order accepted trace=${trace}`,
        )
        return { status: "accepted", trace }
    }

    /**
     * Logic: Simulate order processing failure; Sentry captures exception, Winston logs ERROR to Loki.
     * Code: Log ERROR then throw Error (SentryGlobalFilter catches and sends to Sentry).
     */
    fail(): never {
        this.logger.error(
            `[${process.env.HOSTNAME ?? "local"}] Simulated order failure for Loki + Sentry demo`,
        )
        // Throw real Error — SentryGlobalFilter catches this exception and reports to Sentry dashboard.
        throw new Error("Simulated order processing failure")
    }
}
