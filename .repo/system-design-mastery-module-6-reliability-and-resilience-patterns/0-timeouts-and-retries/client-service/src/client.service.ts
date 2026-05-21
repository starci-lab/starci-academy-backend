/**
 * Service thanh toán — gọi bank-service với Timeout 3s và Retry (Exponential Backoff + Jitter).
 * (EN: Payment service — calls bank-service with 3s Timeout and Retry (Exponential Backoff + Jitter).)
 */
import {
    GatewayTimeoutException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common"
import axios from "axios"

@Injectable()
/**
 * Class `ClientService` — thành phần lab (controller/service/module).
 * (EN: Class `ClientService` — lesson lab component.)
 */
export class ClientService {
    private readonly logger = new Logger(ClientService.name)

    /**
     * Logic — thực hiện thanh toán có bảo vệ: Timeout 3s cắt request chậm,
     *   Retry tối đa 3 lần với Exponential Backoff + Jitter tránh thundering herd.
     * Code — vòng `for` chạy tối đa `maxRetries + 1` lần; `axios.get` truyền `timeout`;
     *   nhánh catch tính `baseDelay = 2^(attempt-1) * 1000` + random jitter, rồi `setTimeout`.
     * (EN Logic: Execute payment with protection: 3s Timeout cuts slow requests,
     *   Retry up to 3 times with Exponential Backoff + Jitter to avoid thundering herd.)
     * (EN Code: `for` loop runs at most `maxRetries + 1` times; `axios.get` with `timeout`;
     *   catch branch calculates `baseDelay = 2^(attempt-1) * 1000` + random jitter, then `setTimeout`.)
     */
    async pay(): Promise<{ status: string; message: string }> {
        // Số lần thử lại tối đa: 3 lần retry + 1 lần gọi đầu.
        // (EN: Max retries: 3 retries + 1 initial call.)
        const maxRetries = 3

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                this.logger.log(`Calling Bank Service, attempt ${attempt}`)

                // Gọi bank-service với timeout 3 giây — quá 3s ném AxiosError code ECONNABORTED.
                // (EN: Call bank-service with 3s timeout — exceeding 3s throws AxiosError code ECONNABORTED.)
                await axios.get("http://bank-service:3001/transfer", {
                    timeout: 3000,
                })

                return {
                    status: "success",
                    message: "Transfer successful",
                }
            } catch (error) {
                this.logger.error(error);
                const isLastAttempt = attempt > maxRetries

                if (isLastAttempt) {
                    // Logic — hết quota retry, phân biệt timeout (504) với lỗi khác (500).
                    // (EN Logic: Retries exhausted — distinguish timeout (504) from other errors (500).)
                    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
                        throw new GatewayTimeoutException(
                            "Gateway Timeout - Bank did not respond within 3s",
                        )
                    }

                    throw new InternalServerErrorException(
                        "Payment failed after multiple retries",
                    )
                }

                // Logic — Exponential Backoff: delay tăng gấp đôi mỗi lần (1s → 2s → 4s).
                // Code — `2 ** (attempt - 1) * 1000` tính base delay theo milliseconds.
                // (EN Logic: Exponential Backoff: delay doubles each retry (1s → 2s → 4s).)
                // (EN Code: `2 ** (attempt - 1) * 1000` calculates base delay in ms.)
                const baseDelay = 2 ** (attempt - 1) * 1000

                // Logic — Jitter ngẫu nhiên 0–1000ms tránh đồng loạt retry gây thundering herd.
                // (EN Logic: Random jitter 0–1000ms prevents simultaneous retries causing thundering herd.)
                const jitter = Math.floor(Math.random() * 1000)
                const waitMs = baseDelay + jitter

                this.logger.warn(`Retry attempt ${attempt} scheduled in ${waitMs}ms`)

                await new Promise<void>((resolve) => {
                    setTimeout(resolve, waitMs)
                })
            }
        }

        throw new InternalServerErrorException("Unexpected execution flow")
    }
}
