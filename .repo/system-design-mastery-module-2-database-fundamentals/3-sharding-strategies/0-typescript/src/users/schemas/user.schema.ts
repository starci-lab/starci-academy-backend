/**
 * Mongoose schema for User — main entity in the Sharding demo.
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
 * Mongoose hydrated document type (includes _id, __v, ...).
 */
export type UserDocument = HydratedDocument<User>

/**
 * User tier enum — secondary shard key for zone-based sharding.
 */
export enum UserTier {
    Free = "free",
    Pro = "pro",
    Enterprise = "enterprise",
}

/**
 * User schema — shard key is `userId` (hashed), fields serve demo
 * of targeted query (userId), scatter-gather query (country, tier).
 */
@Schema({ timestamps: false })
export class User {
    /**
     * Shard key — unique string userId, uses hashed sharding.
     */
    @Prop({ type: String, required: true, unique: true, index: true })
        userId: string

    /**
     * User's unique email.
     */
    @Prop({ type: String, required: true, unique: true })
        email: string

    /**
     * Display name.
     */
    @Prop({ type: String, required: true })
        name: string

    /**
     * Country code (ISO 3166-1 alpha-2) — used for zone-based sharding.
     */
    @Prop({ type: String, required: true })
        country: string

    /**
     * User tier: free / pro / enterprise.
     */
    @Prop({ type: String, enum: UserTier, default: UserTier.Free })
        tier: UserTier

    /**
     * Login count — metric for demo.
     */
    @Prop({ type: Number, default: 0 })
        loginCount: number

    /**
     * Last login timestamp.
     */
    @Prop({ type: Date, default: null })
        lastLoginAt: Date

    /**
     * Account creation timestamp.
     */
    @Prop({ type: Date, default: () => new Date() })
        createdAt: Date
}

/**
 * Create Mongoose schema from class decorator.
 */
export const UserSchema = SchemaFactory.createForClass(User)
