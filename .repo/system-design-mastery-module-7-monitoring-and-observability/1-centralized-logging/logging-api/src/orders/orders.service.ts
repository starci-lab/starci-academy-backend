/**
 * Service đơn hàng — logic tạo trace và ghi log demo.
 * (EN: Orders service — logic for trace generation and demo logging.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"

@Injectable()
/**
 * Class `OrdersService` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersService` — lesson lab component.)
 */
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    /**
     * Logic — mô phỏng xử lý đơn hàng thành công, ghi INFO kèm trace để tra Loki.
     * Code — tạo trace id từ timestamp, ghi log qua Winston, trả response.
     * (EN Logic: Simulate successful order processing, log INFO with trace for Loki lookup.)
     * (EN Code: Generate trace id from timestamp, log via Winston, return response.)
     */
    accept(): { status: string; trace: string } {
        const trace = `trace-${Date.now()}`
        // HOSTNAME trong container giúp phân biệt replica khi demo.
        // (EN: HOSTNAME in containers helps distinguish replicas in demos.)
        this.logger.log(
            `[${process.env.HOSTNAME ?? "local"}] Order accepted trace=${trace}`,
        )
        return { status: "accepted", trace }
    }

    /**
     * Logic — mô phỏng lỗi xử lý đơn hàng; Sentry bắt exception, Winston ghi ERROR vào Loki.
     * Code — ghi log ERROR rồi throw Error (SentryGlobalFilter bắt và gửi lên Sentry).
     * (EN Logic: Simulate order processing failure; Sentry captures exception, Winston logs ERROR to Loki.)
     * (EN Code: Log ERROR then throw Error (SentryGlobalFilter catches and sends to Sentry).)
     */
    fail(): never {
        this.logger.error(
            `[${process.env.HOSTNAME ?? "local"}] Simulated order failure for Loki + Sentry demo`,
        )
        // Throw Error thật — SentryGlobalFilter bắt exception này và báo lên Sentry dashboard.
        // (EN: Throw real Error — SentryGlobalFilter catches this exception and reports to Sentry dashboard.)
        throw new Error("Simulated order processing failure")
    }
}
