/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * MongoDB config (connection URI).
 */
export interface MongoConfig {
    uri: string
}

/**
 * Logic: Map MONGO_URI environment variable to typed config.
 * Code: `registerAs` factory reading `process.env.MONGO_URI`.
 */
export const mongoConfig = registerAs(
    "mongo",
    (): MongoConfig => ({
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/app",
    }),
)
