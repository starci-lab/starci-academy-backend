/**
 * Mongoose schema cho User — entity chính trong demo Sharding.
 * (EN: Mongoose schema for User — main entity in the Sharding demo.)
 */
import {
    Prop,
    Schema,
    SchemaFactory,
} from "@nestjs/mongoose"
import {
    HydratedDocument,
} from "mongoose"

/**
 * Kiểu document hydrated của Mongoose (bao gồm _id, __v, ...).
 * (EN: Mongoose hydrated document type (includes _id, __v, ...).)
 */
export type UserDocument = HydratedDocument<User>

/**
 * Enum hạng người dùng — shard key phụ cho zone-based sharding.
 * (EN: User tier enum — secondary shard key for zone-based sharding.)
 */
export enum UserTier {
    Free = "free",
    Pro = "pro",
    Enterprise = "enterprise",
}

/**
 * Schema User — shard key là `userId` (hashed), các field phục vụ demo
 * targeted query (userId), scatter-gather query (country, tier).
 * (EN: User schema — shard key is `userId` (hashed), fields serve demo
 * of targeted query (userId), scatter-gather query (country, tier).)
 */
@Schema({ timestamps: false })
export class User {
    /**
     * Shard key — userId dạng string unique, dùng hashed sharding.
     * (EN: Shard key — unique string userId, uses hashed sharding.)
     */
    @Prop({ type: String, required: true, unique: true, index: true })
        userId: string

    /**
     * Email duy nhất của user.
     * (EN: User's unique email.)
     */
    @Prop({ type: String, required: true, unique: true })
        email: string

    /**
     * Tên hiển thị.
     * (EN: Display name.)
     */
    @Prop({ type: String, required: true })
        name: string

    /**
     * Mã quốc gia (ISO 3166-1 alpha-2) — dùng cho zone-based sharding.
     * (EN: Country code (ISO 3166-1 alpha-2) — used for zone-based sharding.)
     */
    @Prop({ type: String, required: true })
        country: string

    /**
     * Hạng người dùng: free / pro / enterprise.
     * (EN: User tier: free / pro / enterprise.)
     */
    @Prop({ type: String, enum: UserTier, default: UserTier.Free })
        tier: UserTier

    /**
     * Số lần đăng nhập — metric cho demo.
     * (EN: Login count — metric for demo.)
     */
    @Prop({ type: Number, default: 0 })
        loginCount: number

    /**
     * Thời điểm đăng nhập gần nhất.
     * (EN: Last login timestamp.)
     */
    @Prop({ type: Date, default: null })
        lastLoginAt: Date

    /**
     * Thời điểm tạo tài khoản.
     * (EN: Account creation timestamp.)
     */
    @Prop({ type: Date, default: () => new Date() })
        createdAt: Date
}

/**
 * Tạo schema Mongoose từ class decorator.
 * (EN: Create Mongoose schema from class decorator.)
 */
export const UserSchema = SchemaFactory.createForClass(User)
