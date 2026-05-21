/**
 * Logic — quản lý tồn kho: tạo sản phẩm, trừ kho khi nhận event.
 * Code — Mongoose `Model<ProductDocument>` thao tác collection `products`.
 * (EN Logic: Manages stock: creates products, decrements when events arrive.)
 * (EN Code: Mongoose `Model<ProductDocument>` operates on `products` collection.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    InjectModel,
} from "@nestjs/mongoose"
import {
    Model,
} from "mongoose"
import {
    Product,
    ProductDocument,
} from "./schemas"

@Injectable()
/**
 * Class `InventoryService` — thành phần lab (controller/service/module).
 * (EN: Class `InventoryService` — lesson lab component.)
 */
export class InventoryService {
    constructor(
        @InjectModel(Product.name) private readonly product: Model<ProductDocument>,
    ) {}

    /**
     * Logic — tạo sản phẩm mới trong kho.
     * Code — `new this.product({ name, stock })` → `doc.save()`.
     * (EN Logic: Creates a new product in stock.)
     * (EN Code: `new this.product({ name, stock })` → `doc.save()`.)
     */
    async create(name: string, stock: number) {
        const doc = new this.product({ name, stock })
        return doc.save()
    }

    /**
     * Logic — trừ kho sản phẩm theo tên, kiểm tra tồn kho trước khi trừ.
     * Code — `findOne({ name })` → check `stock >= quantity` → `doc.stock -= quantity` → `save()`.
     * (EN Logic: Decrements stock by product name, checks availability first.)
     * (EN Code: `findOne({ name })` → check `stock >= quantity` → `doc.stock -= quantity` → `save()`.)
     */
    private readonly logger = new Logger(InventoryService.name)
/**
 * Logic — Xử lý nghiệp vụ `decrementStockByProductName` cho lab.
 * Code — `async decrementStockByProductName()` — gọi dependency inject / client.
 * (EN Logic: Business handler `decrementStockByProductName` for the lab.)
 * (EN Code: `async decrementStockByProductName()` — uses injected deps / clients.)
 */
    async decrementStockByProductName(name: string, quantity: number) {
        const doc = await this.product.findOne({ name }).exec()
        if (!doc || doc.stock < quantity) return null
        this.logger.log(`Decrementing stock for "${name}" by ${quantity}`)
        doc.stock -= quantity
        return doc.save()
    }
}
