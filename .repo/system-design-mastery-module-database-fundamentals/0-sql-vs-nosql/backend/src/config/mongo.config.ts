/**
 * Config `registerAs` — chi doc `process.env` tai factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cau hinh ket noi MongoDB (Mongoose).
 * (EN: MongoDB connection config (Mongoose).)
 */
export interface MongoConfig {
    uri: string
}

/**
 * Logic — Doc bien moi truong MongoDB thanh object config typed.
 * Code — `registerAs` factory: `process.env.MONGO_URI` -> interface config.
 * (EN Logic: Map MongoDB environment variable to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.MONGO_URI`.)
 */
export const mongoConfig = registerAs(
    "mongo",
    (): MongoConfig => ({
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/sql_nosql_db",
    }),
)
