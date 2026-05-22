/**
 * Service xử lý nghiệp vụ đơn hàng — replication master/slave + partition info.
 * (EN: Order business-logic service — replication master/slave + partition info.)
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
 * Danh sách khu vực mẫu để seed dữ liệu.
 * (EN: Sample region list for seeding data.)
 */
const REGIONS = ["us-east", "us-west", "eu-west", "eu-east", "ap-southeast"]

/**
 * Danh sách sản phẩm mẫu để seed dữ liệu.
 * (EN: Sample product list for seeding data.)
 */
const PRODUCTS = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse"]

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    constructor(
        // Repository mặc định — TypeORM route theo replication config.
        // (EN: Default repository — TypeORM routes per replication config.)
        @InjectRepository(OrderEntity)
        private readonly orderRepository: Repository<OrderEntity>,
        // DataSource cho phép chọn rõ master hoặc slave.
        // (EN: DataSource allows explicit master or slave selection.)
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Tạo đơn hàng — ghi vào master (primary).
     * (EN: Create order — write to master (primary).)
     */
    async create(dto: {
        customerId: string
        product: string
        amount: number
        region: string
        status?: OrderStatus
        createdAt?: Date
    }): Promise<OrderEntity> {
        // Logic — Tạo QueryRunner chỉ định master để đảm bảo ghi vào primary.
        // Code — `createQueryRunner("master")` → `repo.create()` → `repo.save()`.
        // (EN Logic: Create QueryRunner targeting master to ensure writes go to primary.)
        // (EN Code: `createQueryRunner("master")` → `repo.create()` → `repo.save()`.)
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
     * Lấy danh sách đơn hàng — đọc từ slave (replica) để scale read.
     * (EN: List orders — read from slave (replica) for read-scaling.)
     */
    async findAll(): Promise<OrderEntity[]> {
        // Logic — Đọc từ replica giảm tải cho primary, minh hoạ read-scaling.
        // Code — `createQueryRunner("slave")` → `repo.find()` order DESC, limit 100.
        // (EN Logic: Read from replica to offload primary, demonstrating read-scaling.)
        // (EN Code: `createQueryRunner("slave")` → `repo.find()` order DESC, limit 100.)
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
     * Lọc đơn hàng theo khu vực — đọc từ slave, truy vấn bảng phân vùng.
     * (EN: Filter orders by region — read from slave, query partitioned table.)
     */
    async findByRegion(region: string): Promise<OrderEntity[]> {
        // Logic — Truy vấn theo region trên bảng phân vùng, PostgreSQL tự partition-prune.
        // Code — `createQueryRunner("slave")` → `repo.find({ where: { region } })`.
        // (EN Logic: Query by region on partitioned table, PostgreSQL auto partition-prunes.)
        // (EN Code: `createQueryRunner("slave")` → `repo.find({ where: { region } })`.)
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
     * Trạng thái streaming replication — truy vấn pg_stat_replication trên master.
     * (EN: Streaming replication status — query pg_stat_replication on master.)
     */
    async getReplicationStatus(): Promise<Record<string, unknown>[]> {
        // Logic — Đọc view hệ thống pg_stat_replication để xem lag, trạng thái replica.
        // Code — `createQueryRunner("master")` → raw SQL `pg_stat_replication`.
        // (EN Logic: Read system view pg_stat_replication to check lag, replica state.)
        // (EN Code: `createQueryRunner("master")` → raw SQL `pg_stat_replication`.)
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
     * Thông tin phân vùng — truy vấn pg_catalog trên master.
     * (EN: Partition info — query pg_catalog on master.)
     */
    async getPartitionInfo(): Promise<Record<string, unknown>[]> {
        // Logic — Dùng pg_inherits + pg_class để liệt kê partition con của bảng orders.
        // Code — Raw SQL join `pg_inherits`, `pg_class`, `pg_get_expr()`.
        // (EN Logic: Use pg_inherits + pg_class to list child partitions of orders table.)
        // (EN Code: Raw SQL joining `pg_inherits`, `pg_class`, `pg_get_expr()`.)
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
     * Seed dữ liệu mẫu — ghi vào master, trải đều 12 tháng 2024 và 5 khu vực.
     * (EN: Seed sample data — write to master, spread across 12 months of 2024 and 5 regions.)
     */
    async seed(count: number): Promise<{ inserted: number }> {
        // Logic — Tạo mảng đơn hàng ngẫu nhiên rồi bulk-save qua master.
        // Code — Vòng lặp `count` lần → `repo.save(orders, { chunk: 200 })`.
        // (EN Logic: Build random order array then bulk-save via master.)
        // (EN Code: Loop `count` times → `repo.save(orders, { chunk: 200 })`.)
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
