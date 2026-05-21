/**
 * Controller giả lập ngân hàng — endpoint `GET /transfer` chờ 10s trước khi trả kết quả.
 * (EN: Simulated bank controller — endpoint `GET /transfer` waits 10s before returning result.)
 */
import {
    Controller,
    Get,
} from "@nestjs/common"

/**
 * Hàm dừng thực thi trong khoảng thời gian cho trước (milliseconds).
 * (EN: Pauses execution for the given duration in milliseconds.)
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

/**
 * Class `BankController` — thành phần lab (controller/service/module).
 * (EN: Class `BankController` — lesson lab component.)
 */
export class BankController {
    /**
     * Logic — giả lập xử lý chuyển khoản rất chậm (10s) để client-service kích hoạt Timeout.
     * Code — `sleep(10000)` rồi trả `{ status: "success" }`; client timeout 3s nên không bao giờ nhận được response này.
     * (EN Logic: Simulates an extremely slow transfer (10s) so client-service triggers Timeout.)
     * (EN Code: `sleep(10000)` then returns `{ status: "success" }`; client times out at 3s so never receives this.)
     */
    @Get("transfer")
    /**
 * Logic — Xử lý nghiệp vụ `transfer` cho lab.
 * Code — `async transfer()` — gọi dependency inject / client.
 * (EN Logic: Business handler `transfer` for the lab.)
 * (EN Code: `async transfer()` — uses injected deps / clients.)
 */
    async transfer(): Promise<{ status: string }> {
        // Giả lập hệ thống xử lý chậm 10 giây.
        // (EN: Simulate 10-second slow processing.)
        await sleep(10000)

        return {
            status: "success",
        }
    }
}
