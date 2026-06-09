/**
 * Product Service — keeps products in memory (no DB required).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

/**
 * A product record returned by the service.
 */
export type Product = { id: number; name: string; price: number; stock: number }

/**
 * Payload accepted when creating a product.
 */
export type CreateProductInput = { name: string; price: number; stock: number }

@Injectable()
/**
 * Class `AppService` — in-memory product store for the gateway routing demo.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)
    // In-memory list preserves insertion order; resets on restart (demo only).
    private readonly products: Product[] = []
    // Monotonic id counter; first created product gets id 1.
    private counter = 0

    /**
     * Logic — Append a new product and return it with a generated id.
     * Code — Increment counter, push to array, return the created record.
     */
    create(input: CreateProductInput): Product {
        const created: Product = {
            id: ++this.counter,
            name: input.name,
            price: input.price,
            stock: input.stock,
        }
        this.products.push(created)
        this.logger.log(`Created product ${created.id}`)
        return created
    }

    /**
     * Logic — Return all products in insertion order.
     * Code — Return the in-memory array.
     */
    list(): Product[] {
        this.logger.log("Fetching products from memory")
        return this.products
    }
}
