/**
 * Product Service — mock product data in memory (no DB required).
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

export type Product = { id: number; name: string; price: number }

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    /**
     * Logic — Returns mock product data for Kong Gateway routing test.
     * Code — Returns hardcoded Product[] array.
     */
    getProducts(): Product[] {
        this.logger.log("Fetching products from memory")
        return [
            { id: 101, name: "Laptop", price: 1500 },
            { id: 102, name: "Smartphone", price: 800 },
        ]
    }
}
