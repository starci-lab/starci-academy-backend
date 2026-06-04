/**
 * Products service — seed data, query with/without index, explain plan, compare.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    DataSource,
    Repository,
} from "typeorm"
import {
    ProductEntity,
} from "./entities/product.entity"

/**
 * Sample product categories.
 */
const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Books",
    "Home & Garden",
    "Sports",
    "Toys",
    "Food & Beverage",
    "Health",
    "Automotive",
    "Music",
]

/**
 * Sample brands.
 */
const BRANDS = [
    "Acme",
    "Zenith",
    "Pinnacle",
    "Vertex",
    "Nova",
    "Apex",
    "Stellar",
    "Orbit",
    "Quantum",
    "Flux",
    "Titan",
    "Vortex",
    "Prism",
    "Nexus",
    "Echo",
]

/**
 * Sample adjectives for product names.
 */
const ADJECTIVES = [
    "Premium",
    "Ultra",
    "Pro",
    "Elite",
    "Classic",
    "Advanced",
    "Essential",
    "Deluxe",
    "Standard",
    "Compact",
]

/**
 * Sample nouns for product names.
 */
const NOUNS = [
    "Widget",
    "Gadget",
    "Device",
    "Tool",
    "Kit",
    "System",
    "Module",
    "Unit",
    "Pack",
    "Set",
]

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name)

    constructor(
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Pick a random element from an array.
     */
    private randomElement<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)] as T
    }

    /**
     * Generate a unique SKU code.
     */
    private generateSku(index: number): string {
        const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        return `${prefix}${suffix}-${Date.now()}-${index}`
    }

    /**
     * Seed product data into table — insert in batches of 500.
     */
    async seed(count: number): Promise<{ inserted: number }> {
        this.logger.log(`Seeding ${count} products...`)

        const batchSize = 500
        let inserted = 0

        for (let i = 0; i < count; i += batchSize) {
            const batch: Partial<ProductEntity>[] = []
            const currentBatch = Math.min(batchSize, count - i)

            for (let j = 0; j < currentBatch; j++) {
                const adjective = this.randomElement(ADJECTIVES)
                const noun = this.randomElement(NOUNS)
                const brand = this.randomElement(BRANDS)

                batch.push({
                    name: `${brand} ${adjective} ${noun}`,
                    sku: this.generateSku(i + j),
                    price: parseFloat((Math.random() * 999 + 1).toFixed(2)),
                    category: this.randomElement(CATEGORIES),
                    brand,
                    description: `High-quality ${adjective.toLowerCase()} ${noun.toLowerCase()} by ${brand}. Built for performance and reliability.`,
                    stock: Math.floor(Math.random() * 1000),
                    rating: parseFloat((Math.random() * 4 + 1).toFixed(1)),
                })
            }

            await this.productRepository
                .createQueryBuilder()
                .insert()
                .into(ProductEntity)
                .values(batch)
                .execute()

            inserted += currentBatch
        }

        this.logger.log(`Seeded ${inserted} products`)
        return { inserted }
    }

    /**
     * Query WITHOUT index — disable index scan to force sequential scan.
     */
    async findWithoutIndex(category: string): Promise<{
        rows: ProductEntity[]
        executionTimeMs: number
    }> {
        const start = performance.now()

                // Create separate QueryRunner to disable index scan for this session.
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()

        try {
            await queryRunner.query("SET enable_indexscan = OFF")
            await queryRunner.query("SET enable_bitmapscan = OFF")

            const rows = await queryRunner.query(
                "SELECT * FROM products WHERE category = $1 ORDER BY price ASC",
                [category],
            )

            const executionTimeMs = parseFloat(
                (performance.now() - start).toFixed(3),
            )

            return { rows, executionTimeMs }
        } finally {
                        // Re-enable index scan.
            await queryRunner.query("SET enable_indexscan = ON")
            await queryRunner.query("SET enable_bitmapscan = ON")
            await queryRunner.release()
        }
    }

    /**
     * Query WITH index — leverages composite index (category, price).
     */
    async findWithIndex(
        category: string,
        minPrice: number,
    ): Promise<{
        rows: ProductEntity[]
        executionTimeMs: number
    }> {
        const start = performance.now()

                // Query using composite index (category, price).
        const rows = await this.productRepository
            .createQueryBuilder("p")
            .where("p.category = :category", { category })
            .andWhere("p.price >= :minPrice", { minPrice })
            .orderBy("p.price", "ASC")
            .getMany()

        const executionTimeMs = parseFloat((performance.now() - start).toFixed(3))

        return { rows, executionTimeMs }
    }

    /**
     * Run EXPLAIN ANALYZE on arbitrary SQL — view execution plan.
     */
    async explainQuery(sql: string): Promise<{ plan: string }> {
        const result = await this.dataSource.query(`EXPLAIN ANALYZE ${sql}`)
        const plan = result.map((row: Record<string, string>) => row["QUERY PLAN"]).join("\n")
        return { plan }
    }

    /**
     * Compare same query with index vs without index — return plan + timing.
     */
    async compareQueries(): Promise<{
        withoutIndex: { plan: string; executionTimeMs: string }
        withIndex: { plan: string; executionTimeMs: string }
        summary: string
    }> {
        const category = this.randomElement(CATEGORIES)
        const minPrice = parseFloat((Math.random() * 200 + 50).toFixed(2))

                // Query 1: force sequential scan (disable index).
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()

        let planWithout: string
        let timeWithout: string

        try {
            await queryRunner.query("SET enable_indexscan = OFF")
            await queryRunner.query("SET enable_bitmapscan = OFF")

            const result1 = await queryRunner.query(
                `EXPLAIN ANALYZE SELECT * FROM products WHERE category = '${category}' AND price >= ${minPrice} ORDER BY price ASC`,
            )
            planWithout = result1.map((r: Record<string, string>) => r["QUERY PLAN"]).join("\n")

            const timingMatch = planWithout.match(
                /Execution Time:\s+([\d.]+)\s+ms/,
            )
            timeWithout = timingMatch ? `${timingMatch[1]} ms` : "N/A"
        } finally {
            await queryRunner.query("SET enable_indexscan = ON")
            await queryRunner.query("SET enable_bitmapscan = ON")
            await queryRunner.release()
        }

                // Query 2: use index (default).
        const result2 = await this.dataSource.query(
            `EXPLAIN ANALYZE SELECT * FROM products WHERE category = '${category}' AND price >= ${minPrice} ORDER BY price ASC`,
        )
        const planWith = result2.map((r: Record<string, string>) => r["QUERY PLAN"]).join("\n")

        const timingMatch2 = planWith.match(/Execution Time:\s+([\d.]+)\s+ms/)
        const timeWith = timingMatch2 ? `${timingMatch2[1]} ms` : "N/A"

        return {
            withoutIndex: { plan: planWithout, executionTimeMs: timeWithout },
            withIndex: { plan: planWith, executionTimeMs: timeWith },
            summary: `Query: SELECT * FROM products WHERE category='${category}' AND price >= ${minPrice} ORDER BY price ASC`,
        }
    }

    /**
     * Get products table stats — seq_scan, idx_scan, index sizes.
     */
    async getTableStats(): Promise<{
        tableStats: Record<string, unknown>
        indexStats: Record<string, unknown>[]
    }> {
        const stats = await this.dataSource.query(`
            SELECT
                relname AS table_name,
                seq_scan,
                seq_tup_read,
                idx_scan,
                idx_tup_fetch,
                n_tup_ins AS rows_inserted,
                n_tup_upd AS rows_updated,
                n_tup_del AS rows_deleted,
                n_live_tup AS live_rows,
                n_dead_tup AS dead_rows,
                last_vacuum,
                last_analyze
            FROM pg_stat_user_tables
            WHERE relname = 'products'
        `)

        const indexStats = await this.dataSource.query(`
            SELECT
                indexrelname AS index_name,
                idx_scan AS times_used,
                idx_tup_read AS tuples_read,
                idx_tup_fetch AS tuples_fetched,
                pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
            FROM pg_stat_user_indexes
            WHERE relname = 'products'
        `)

        return {
            tableStats: stats[0] ?? {},
            indexStats,
        }
    }
}
