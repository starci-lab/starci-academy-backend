/**
 * Order business-logic service — replication master/slave + partition info.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    InjectRepository,
    InjectDataSource,
} from "@nestjs/typeorm"
import {
    Repository,
    DataSource,
} from "typeorm"
import {
    OrderEntity,
    OrderStatus,
} from "./entities"

/**
 * Sample region list for seeding data.
 */
const REGIONS = ["us-east", "us-west", "eu-west", "eu-east", "ap-southeast"]

/**
 * Sample product list for seeding data.
 */
const PRODUCTS = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse"]

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    constructor(
                // Default repository — TypeORM routes per replication config.
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
                // DataSource allows explicit master or slave selection.
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Create order — write to master (primary).
     */
    async create(dto: {
        customerId: string
        product: string
        amount: number
        region: string
        status?: OrderStatus
        createdAt?: Date
    }): Promise<OrderEntity> {
                // Logic: Create QueryRunner targeting master to ensure writes go to primary.
        // Code: `createQueryRunner("master")` → `repo.create()` → `repo.save()`.
        const queryRunner = this.dataSource.createQueryRunner("master")
        try {
            const repo = queryRunner.manager.getRepository(OrderEntity)
            const order = repo.create(dto)
            return await repo.save(order)
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * List orders — read from slave (replica) for read-scaling.
     */
    async findAll(): Promise<OrderEntity[]> {
                // Logic: Read from replica to offload primary, demonstrating read-scaling.
        // Code: `createQueryRunner("slave")` → `repo.find()` order DESC, limit 100.
        const queryRunner = this.dataSource.createQueryRunner("slave")
        try {
            return await queryRunner.manager.getRepository(OrderEntity).find({
                order: { createdAt: "DESC" },
                take: 100,
            })
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Filter orders by region — read from slave, query partitioned table.
     */
    async findByRegion(region: string): Promise<OrderEntity[]> {
                // Logic: Query by region on partitioned table, PostgreSQL auto partition-prunes.
        // Code: `createQueryRunner("slave")` → `repo.find({ where: { region } })`.
        const queryRunner = this.dataSource.createQueryRunner("slave")
        try {
            return await queryRunner.manager.getRepository(OrderEntity).find({
                where: { region },
                order: { createdAt: "DESC" },
            })
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Streaming replication status — query pg_stat_replication on master.
     */
    async getReplicationStatus(): Promise<Record<string, unknown>[]> {
                // Logic: Read system view pg_stat_replication to check lag, replica state.
        // Code: `createQueryRunner("master")` → raw SQL `pg_stat_replication`.
        const queryRunner = this.dataSource.createQueryRunner("master")
        try {
            const rows = await queryRunner.query(`
                SELECT
                    client_addr,
                    state,
                    sent_lsn,
                    write_lsn,
                    flush_lsn,
                    replay_lsn,
                    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag_bytes,
                    sync_state
                FROM pg_stat_replication
            `)
            return rows as Record<string, unknown>[]
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Partition info — query pg_catalog on master.
     */
    async getPartitionInfo(): Promise<Record<string, unknown>[]> {
                // Logic: Use pg_inherits + pg_class to list child partitions of orders table.
        // Code: Raw SQL joining `pg_inherits`, `pg_class`, `pg_get_expr()`.
        const queryRunner = this.dataSource.createQueryRunner("master")
        try {
            const rows = await queryRunner.query(`
                SELECT
                    parent.relname  AS parent_table,
                    child.relname   AS partition_name,
                    pg_get_expr(child.relpartbound, child.oid) AS partition_expression,
                    pg_size_pretty(pg_relation_size(child.oid)) AS partition_size
                FROM pg_inherits
                    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
                    JOIN pg_class child  ON pg_inherits.inhrelid  = child.oid
                WHERE parent.relname = 'orders'
                ORDER BY child.relname
            `)
            return rows as Record<string, unknown>[]
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Seed sample data — write to master, spread across 12 months of 2024 and 5 regions.
     */
    async seed(count: number): Promise<{ inserted: number }> {
                // Logic: Build random order array then bulk-save via master.
        // Code: Loop `count` times → `repo.save(orders, { chunk: 200 })`.
        const statuses = Object.values(OrderStatus)
        const orders: Partial<OrderEntity>[] = []

        for (let i = 0; i < count; i++) {
            const month = (i % 12) + 1
            const day = (i % 28) + 1
            orders.push({
                customerId: `cust-${String(i + 1).padStart(4, "0")}`,
                product: PRODUCTS[i % PRODUCTS.length],
                amount: +(Math.random() * 2000 + 10).toFixed(2),
                region: REGIONS[i % REGIONS.length],
                status: statuses[i % statuses.length],
                createdAt: new Date(2024, month - 1, day),
            })
        }

        const queryRunner = this.dataSource.createQueryRunner("master")
        try {
            const repo = queryRunner.manager.getRepository(OrderEntity)
            await repo.save(orders, { chunk: 200 })
            this.logger.log(`Seeded ${orders.length} orders`)
            return { inserted: orders.length }
        } finally {
            await queryRunner.release()
        }
    }
}
