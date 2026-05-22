/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình MongoDB (URI kết nối).
 * (EN: MongoDB config (connection URI).)
 */
export interface MongoConfig {
    uri: string
}

/**
 * Logic — Đọc biến môi trường MONGO_URI thành object config typed.
 * Code — `registerAs` factory: `process.env.MONGO_URI` → interface config.
 * (EN Logic: Map MONGO_URI environment variable to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.MONGO_URI`.)
 */
export const mongoConfig = registerAs(
    "mongo",
    (): MongoConfig => ({
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/app",
    }),
)
