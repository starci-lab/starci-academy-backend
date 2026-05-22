/**
 * Service so sanh — seed du lieu va benchmark SQL vs NoSQL.
 * (EN: Compare service — seed data and benchmark SQL vs NoSQL.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    SqlService,
    CreateProductDto,
} from "@0-sql-vs-nosql/sql/sql.service"
import {
    NosqlService,
} from "@0-sql-vs-nosql/nosql/nosql.service"

/**
 * Ket qua do thoi gian truy van.
 * (EN: Query timing result.)
 */
export interface TimingResult {
    sqlMs: number
    nosqlMs: number
    sqlCount: number
    nosqlCount: number
}

/**
 * Danh sach category mau de seed du lieu.
 * (EN: Sample category list for data seeding.)
 */
const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Books",
    "Home & Garden",
    "Sports",
    "Toys",
    "Food",
    "Automotive",
]

@Injectable()
export class CompareService {
    private readonly logger = new Logger(CompareService.name)

    constructor(
        private readonly sqlService: SqlService,
        private readonly nosqlService: NosqlService,
    ) {}

    /**
     * Logic — Tao du lieu mau vao ca hai database (PostgreSQL va MongoDB).
     * Code — Xoa du lieu cu, tao mang DTO, insert dong thoi vao ca hai.
     * (EN Logic: Seed sample data into both databases (PostgreSQL and MongoDB).)
     * (EN Code: Clear old data, create DTO array, insert concurrently into both.)
     */
    async seed(count = 1000): Promise<{ seeded: number }> {
        this.logger.log(`Seeding ${count} products into both databases...`)

        // Tao mang san pham mau voi category ngau nhien.
        // (EN: Create sample product array with random categories.)
        const products: CreateProductDto[] = Array.from(
            { length: count },
            (_, i) => ({
                name: `Product-${i + 1}`,
                price: parseFloat((Math.random() * 500 + 1).toFixed(2)),
                category:
                    CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)] as string,
                metadata: {
                    sku: `SKU-${String(i + 1).padStart(6, "0")}`,
                    weight: parseFloat((Math.random() * 10).toFixed(2)),
                    inStock: Math.random() > 0.2,
                },
            }),
        )

        // Xoa du lieu cu trong ca hai database.
        // (EN: Clear old data in both databases.)
        await Promise.all([
            this.sqlService.deleteAll(),
            this.nosqlService.deleteAll(),
        ])

        // Insert dong thoi vao PostgreSQL va MongoDB.
        // (EN: Insert concurrently into PostgreSQL and MongoDB.)
        await Promise.all([
            this.sqlService.createMany(products),
            this.nosqlService.createMany(products),
        ])

        this.logger.log(`Seeded ${count} products into both databases`)
        return { seeded: count }
    }

    /**
     * Logic — So sanh hieu nang truy van giua SQL va NoSQL (findByCategory va search).
     * Code — Do thoi gian `performance.now()` cho tung truy van, tra ve ket qua.
     * (EN Logic: Compare query performance between SQL and NoSQL (findByCategory and search).)
     * (EN Code: Measure `performance.now()` for each query, return results.)
     */
    async compare(
        category = "Electronics",
    ): Promise<{ findByCategory: TimingResult; search: TimingResult }> {
        // --- Benchmark: findByCategory ---
        // Do thoi gian truy van SQL theo category.
        // (EN: Measure SQL query time by category.)
        const catSqlStart = performance.now()
        const sqlCatResults = await this.sqlService.findByCategory(category)
        const catSqlEnd = performance.now()

        // Do thoi gian truy van NoSQL theo category.
        // (EN: Measure NoSQL query time by category.)
        const catNosqlStart = performance.now()
        const nosqlCatResults =
            await this.nosqlService.findByCategory(category)
        const catNosqlEnd = performance.now()

        // --- Benchmark: search ---
        const keyword = "Product-1"
        // Do thoi gian tim kiem SQL theo keyword.
        // (EN: Measure SQL search time by keyword.)
        const searchSqlStart = performance.now()
        const sqlSearchResults = await this.sqlService.search(keyword)
        const searchSqlEnd = performance.now()

        // Do thoi gian tim kiem NoSQL theo keyword.
        // (EN: Measure NoSQL search time by keyword.)
        const searchNosqlStart = performance.now()
        const nosqlSearchResults = await this.nosqlService.search(keyword)
        const searchNosqlEnd = performance.now()

        return {
            findByCategory: {
                sqlMs: Math.round((catSqlEnd - catSqlStart) * 100) / 100,
                nosqlMs:
                    Math.round((catNosqlEnd - catNosqlStart) * 100) / 100,
                sqlCount: sqlCatResults.length,
                nosqlCount: nosqlCatResults.length,
            },
            search: {
                sqlMs:
                    Math.round((searchSqlEnd - searchSqlStart) * 100) / 100,
                nosqlMs:
                    Math.round((searchNosqlEnd - searchNosqlStart) * 100) /
                    100,
                sqlCount: sqlSearchResults.length,
                nosqlCount: nosqlSearchResults.length,
            },
        }
    }
}
