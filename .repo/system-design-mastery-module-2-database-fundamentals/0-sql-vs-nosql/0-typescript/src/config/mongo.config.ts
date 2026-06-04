/**
 * Config `registerAs` — reads `process.env` in factory only.
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * MongoDB connection config (Mongoose).
 */
export interface MongoConfig {
    uri: string
}

/**
 * Logic: Map MongoDB environment variable to typed config.
 * Code: `registerAs` factory reading `process.env.MONGO_URI`.
 */
export const mongoConfig = registerAs(
    "mongo",
    (): MongoConfig => ({
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/sql_nosql_db",
    }),
)
