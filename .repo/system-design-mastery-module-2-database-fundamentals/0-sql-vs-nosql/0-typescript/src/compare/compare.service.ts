/**
 * Compare service — seed data and benchmark SQL vs NoSQL.
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
 * Query timing result.
 */
export interface TimingResult {
    sqlMs: number
    nosqlMs: number
    sqlCount: number
    nosqlCount: number
}

/**
 * Sample category list for data seeding.
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
     * Logic: Seed sample data into both databases (PostgreSQL and MongoDB).
     * Code: Clear old data, create DTO array, insert concurrently into both.
     */
    async seed(count = 1000): Promise<{ seeded: number }> {
        this.logger.log(`Seeding ${count} products into both databases...`)

                // Create sample product array with random categories.
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

                // Clear old data in both databases.
        await Promise.all([
            this.sqlService.deleteAll(),
            this.nosqlService.deleteAll(),
        ])

                // Insert concurrently into PostgreSQL and MongoDB.
        await Promise.all([
            this.sqlService.createMany(products),
            this.nosqlService.createMany(products),
        ])

        this.logger.log(`Seeded ${count} products into both databases`)
        return { seeded: count }
    }

    /**
     * Logic: Compare query performance between SQL and NoSQL (findByCategory and search).
     * Code: Measure `performance.now()` for each query, return results.
     */
    async compare(
        category = "Electronics",
    ): Promise<{ findByCategory: TimingResult; search: TimingResult }> {
                // Measure SQL query time by category.
        const catSqlStart = performance.now()
        const sqlCatResults = await this.sqlService.findByCategory(category)
        const catSqlEnd = performance.now()

                // Measure NoSQL query time by category.
        const catNosqlStart = performance.now()
        const nosqlCatResults =
            await this.nosqlService.findByCategory(category)
        const catNosqlEnd = performance.now()

        // --- Benchmark: search ---
        const keyword = "Product-1"
                // Measure SQL search time by keyword.
        const searchSqlStart = performance.now()
        const sqlSearchResults = await this.sqlService.search(keyword)
        const searchSqlEnd = performance.now()

                // Measure NoSQL search time by keyword.
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
