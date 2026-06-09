/**
 * Order Service — keeps orders in memory (no DB required).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/**
 * An order record returned by the service.
 */
export type Order = { id: number; productId: number; quantity: number; status: string }

/**
 * Payload accepted when creating an order.
 */
export type CreateOrderInput = { productId: number; quantity: number }

@Injectable()
/**
 * Class `AppService` — in-memory order store for the gateway routing demo.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)
    // In-memory list preserves insertion order; resets on restart (demo only).
    private readonly orders: Order[] = []
    // Monotonic id counter; first created order gets id 1.
    private counter = 0

    /**
     * Logic — Append a new order, always starting in PENDING status.
     * Code — Increment counter, push to array, return the created record.
     */
    create(input: CreateOrderInput): Order {
        const created: Order = {
            id: ++this.counter,
            productId: input.productId,
            quantity: input.quantity,
            // Business rule owned by this service, not the gateway.
            status: "PENDING",
        }
        this.orders.push(created)
        this.logger.log(`Created order ${created.id}`)
        return created
    }

    /**
     * Logic — Return all orders in insertion order.
     * Code — Return the in-memory array.
     */
    list(): Order[] {
        this.logger.log("Fetching orders from memory")
        return this.orders
    }
}
