/**
 * Config `registerAs` — chỉ đọc `process.env` tại factory.
 * (EN: Config `registerAs` — reads `process.env` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"
import * as os from "os"

/**
 * Cấu hình node CAP (mode, tên, peers).
 * (EN: CAP node config (mode, name, peers).)
 */
export interface NodeConfig {
    mode: string
    nodeName: string
    peers: Array<string>
}

/**
 * Logic — Đọc biến môi trường thành object config typed.
 * Code — `registerAs` factory: `process.env.*` → interface config.
 * (EN Logic: Map environment variables to typed config.)
 * (EN Code: `registerAs` factory reading `process.env.*`.)
 */
export const nodeConfig = registerAs(
    "node",
    (): NodeConfig => ({
        mode: process.env.MODE ?? "CP",
        nodeName: process.env.NODE_NAME ?? os.hostname(),
        peers: process.env.PEERS ? process.env.PEERS.split(",") : [],
    }),
)
