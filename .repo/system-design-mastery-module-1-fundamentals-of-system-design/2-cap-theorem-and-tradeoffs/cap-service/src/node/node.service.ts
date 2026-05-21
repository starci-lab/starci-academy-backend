/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import * as os from "os"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class NodeService {
    private readonly logger = new Logger(NodeService.name)

/**
 * Logic — Đọc/truy vấn dữ liệu qua `getBalance`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getBalance`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getBalance(): BalanceResponse {
        return {
            balance: this.balance,
            nodeName: this.nodeName,
            servedBy: os.hostname(),
            mode: this.mode,
            timestamp: new Date().toISOString(),
        }
    }

    /**
 * Logic — Xử lý nghiệp vụ `transfer` cho lab.
 * Code — `async transfer()` — gọi dependency inject / client.
 * (EN Logic: Business handler `transfer` for the lab.)
 * (EN Code: `async transfer()` — uses injected deps / clients.)
 */
    async transfer(amount: number): Promise<TransferResponse> {
        const start = Date.now()
        this.logger.log(`Processing transfer: ${amount}`)

        if (this.mode === "CP") {
            // Trong chế độ CP: Bắt buộc phải đồng bộ thành công mới ghi local.
            // (EN: CP Mode: Must sync successfully before local write.)
            try {
                await this.syncToPeers(amount)
                this.balance += amount
                return {
                    status: "success",
                    message: "Consistency guaranteed (CP)",
                    newBalance: this.balance,
                    duration: `${Date.now() - start}ms`,
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error"
                this.logger.error(`Sync failed in CP mode: ${message}`)
                throw new HttpException(
                    "Network Partition Detected: Cannot guarantee consistency. Transaction aborted to protect data.",
                    HttpStatus.SERVICE_UNAVAILABLE,
                )
            }
        } else {
            // Trong chế độ AP: Ghi local ngay lập tức, đồng bộ sau (Eventual Consistency).
            // (EN: AP Mode: Write local immediately, sync later.)
            this.balance += amount
            this.syncToPeers(amount).catch((error): void => {
                const message = error instanceof Error ? error.message : "Unknown error"
                this.logger.warn(`Background sync failed in AP mode (Expected during partition): ${message}`)
            })

            return {
                status: "success",
                message: "Availability prioritized (AP). Data may be inconsistent temporarily.",
                newBalance: this.balance,
                duration: `${Date.now() - start}ms`,
            }
        }
    }

    /**
 * Logic — Xử lý nghiệp vụ `syncToPeers` cho lab.
 * Code — `async syncToPeers()` — gọi dependency inject / client.
 * (EN Logic: Business handler `syncToPeers` for the lab.)
 * (EN Code: `async syncToPeers()` — uses injected deps / clients.)
 */
    private async syncToPeers(amount: number): Promise<void> {
        const syncPromises = this.peers.map((peer) => {
            return firstValueFrom(
                this.httpService.post(`${peer}/internal/sync`, { amount }, { timeout: 2000 }),
            )
        })
        await Promise.all(syncPromises)
    }

    /**
 * Logic — Xử lý nghiệp vụ `applySync` cho lab.
 * Code — `applySync()` — logic trong service/controller.
 * (EN Logic: Business handler `applySync` for the lab.)
 * (EN Code: `applySync()` — in-class handler logic.)
 */
    applySync(amount: number): SyncResponse {
        this.balance += amount
        this.logger.log(`Applied sync from peer: +${amount}. New balance: ${this.balance}`)
        return {
            status: "synced",
        }
    }
}
