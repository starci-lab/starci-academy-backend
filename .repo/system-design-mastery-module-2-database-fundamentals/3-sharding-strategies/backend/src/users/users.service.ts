/**
 * Service Users — CRUD và các thao tác sharding demo.
 * (EN: Users service — CRUD and sharding demo operations.)
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectConnection,
    InjectModel,
} from "@nestjs/mongoose"
import {
    Connection,
    Model,
} from "mongoose"
import {
    User,
    UserDocument,
    UserTier,
} from "./schemas"

/**
 * Danh sách quốc gia seed — bao gồm AMERICAS và APAC_EMEA.
 * (EN: Seed country list — includes AMERICAS and APAC_EMEA zones.)
 */
const COUNTRIES = [
    "US", "UK", "DE", "FR", "JP", "KR", "IN", "BR", "AU", "CA",
    "SG", "VN", "TH", "ID", "MX", "ES", "IT", "NL", "SE", "PL",
]

/**
 * Danh sách hạng người dùng dùng cho seed.
 * (EN: User tier list used for seeding.)
 */
const TIERS = [UserTier.Free, UserTier.Pro, UserTier.Enterprise]

/**
 * Tên và họ mẫu cho seed data.
 * (EN: Sample first and last names for seed data.)
 */
const FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
    "Henry", "Iris", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia",
]

const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
]

@Injectable()
export class UsersService {
    constructor(
        // Inject model User để thao tác CRUD.
        // (EN: Inject User model for CRUD operations.)
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        // Inject connection để chạy admin commands (collStats, listShards, ...).
        // (EN: Inject connection to run admin commands (collStats, listShards, ...).)
        @InjectConnection() private readonly connection: Connection,
    ) {}

    /**
     * Tạo user mới.
     * (EN: Create a new user.)
     */
    async create(data: Partial<User>): Promise<User> {
        const user = new this.userModel(data)
        return user.save()
    }

    /**
     * Tìm user theo userId — targeted point query (chỉ hit 1 shard vì userId là shard key).
     * (EN: Find user by userId — targeted point query (hits only 1 shard since userId is shard key).)
     */
    async findByUserId(userId: string): Promise<User | null> {
        return this.userModel.findOne({ userId }).exec()
    }

    /**
     * Tìm user theo quốc gia — range/scatter-gather query (không dùng shard key).
     * (EN: Find users by country — range/scatter-gather query (does not use shard key).)
     */
    async findByCountry(country: string): Promise<User[]> {
        return this.userModel.find({ country }).exec()
    }

    /**
     * Tìm user theo hạng — scatter-gather query.
     * (EN: Find users by tier — scatter-gather query.)
     */
    async findByTier(tier: string): Promise<User[]> {
        return this.userModel.find({ tier }).exec()
    }

    /**
     * Seed dữ liệu test — tạo `count` user ngẫu nhiên bằng insertMany.
     * (EN: Seed test data — create `count` random users via insertMany.)
     */
    async seed(count: number): Promise<{ inserted: number }> {
        const users: Partial<User>[] = []
        for (let i = 0; i < count; i++) {
            const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] ?? "John"
            const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] ?? "Doe"
            // Tạo suffix unique bằng timestamp + random string.
            // (EN: Create unique suffix using timestamp + random string.)
            const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
            users.push({
                userId: `user-${suffix}-${i}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@example.com`,
                name: `${firstName} ${lastName}`,
                country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
                tier: TIERS[Math.floor(Math.random() * TIERS.length)],
                loginCount: Math.floor(Math.random() * 500),
                lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
            })
        }
        // ordered: false — tiếp tục insert dù có document lỗi.
        // (EN: ordered: false — continue inserting even if some documents fail.)
        const result = await this.userModel.insertMany(users, { ordered: false })
        return { inserted: result.length }
    }

    /**
     * Lấy thống kê phân phối shard — dùng collStats command.
     * (EN: Get shard distribution stats — uses collStats command.)
     */
    async getShardDistribution(): Promise<unknown> {
        // collStats trả về thông tin chi tiết về collection trên mỗi shard.
        // (EN: collStats returns detailed collection info per shard.)
        const db = this.connection.db
        if (!db) throw new Error("Database connection not available")
        const result = await db.command({ collStats: "users" })
        return {
            ns: result.ns,
            sharded: result.sharded,
            count: result.count,
            size: result.size,
            storageSize: result.storageSize,
            nchunks: result.nchunks,
            shards: result.shards,
        }
    }

    /**
     * Lấy trạng thái cluster shard — listShards + config.chunks.
     * (EN: Get shard cluster status — listShards + config.chunks.)
     */
    async getShardStatus(): Promise<unknown> {
        const db = this.connection.db
        if (!db) throw new Error("Database connection not available")
        const admin = db.admin()
        // Chạy song song listShards và listDatabases.
        // (EN: Run listShards and listDatabases in parallel.)
        const [shards, databases] = await Promise.all([
            admin.command({ listShards: 1 }),
            admin.command({ listDatabases: 1 }),
        ])
        // Đọc config database để lấy thông tin chunks và sharded collections.
        // (EN: Read config database to get chunks and sharded collections info.)
        const configDb = (this.connection as any).client.db("config")
        const chunks = await configDb.collection("chunks").find({ ns: "app.users" }).toArray()
        const collections = await configDb.collection("collections").find({}).toArray()
        return {
            shards: shards.shards,
            databases: databases.databases,
            chunks: chunks.map((c: any) => ({
                shard: c.shard,
                min: c.min,
                max: c.max,
            })),
            shardedCollections: collections.map((c: any) => ({
                ns: c._id,
                key: c.key,
                unique: c.unique,
            })),
        }
    }

    /**
     * Explain query — phân tích execution plan để xem query có targeted hay scatter-gather.
     * (EN: Explain query — analyze execution plan to see if query is targeted or scatter-gather.)
     */
    async explainQuery(field: string, value: string): Promise<unknown> {
        const filter: Record<string, string> = { [field]: value }
        // executionStats cho thông tin chi tiết về số shard được scan.
        // (EN: executionStats gives detailed info on how many shards were scanned.)
        const explanation = await this.userModel
            .find(filter)
            .explain("executionStats")
        return explanation
    }
}
