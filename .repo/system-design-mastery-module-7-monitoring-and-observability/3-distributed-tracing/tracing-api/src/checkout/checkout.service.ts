/**
 * Service Checkout — span con giả lập inventory + độ trễ; đọc `traceId` từ span HTTP đang active.
 * (EN: Checkout service — child span simulates inventory + latency; reads `traceId` from active HTTP span.)
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    context,
    trace,
} from "@opentelemetry/api"

/**
 * Trì hoãn `ms` miligiây — mô phỏng thao tác nội bộ tốn thời gian trong lab tracing.
 * (EN: Sleep `ms` milliseconds — simulates time-consuming internal work in the tracing lab.)
 */
function delay(ms: number): Promise<void> {
    // Giao cho event loop — callback `resolve` chạy sau `ms`.
    // (EN: Hand off to event loop — `resolve` runs after `ms`.)
    return new Promise((resolve) => {
        setTimeout(resolve,
            ms)
    })
}

@Injectable()
/**
 * Class `CheckoutService` — thành phần lab (controller/service/module).
 * (EN: Class `CheckoutService` — lesson lab component.)
 */
export class CheckoutService {
    /**
     * Logic — tái hiện hai “hop” trong một process: HTTP inbound (instrumentation tự động) + bước nội bộ có span con để minh hoạ nút chậm ngẫu nhiên.
     * Code — `startActiveSpan` bọc `delay`; sau đó `trace.getSpan(context.active())?.spanContext().traceId`.
     * (EN Logic: Two hops in one process: inbound HTTP (auto-instrumented) + internal child span for random slow step.)
     * (EN Code: `startActiveSpan` wraps `delay`; then read `trace.getSpan(context.active())?.spanContext().traceId`.)
     */
    async simulateCheckout(): Promise<{ message: string; traceId: string }> {
        // Tracer tách tên để filter/namespace span con trong Jaeger (khác `service.name` trên Resource).
        // (EN: Separate tracer name to namespace child spans in Jaeger (distinct from Resource `service.name`).)
        const tracer = trace.getTracer("nestjs-tracing-app-checkout")

        // Span con gắn dưới span HTTP của Nest/Express đang active — cùng trace, quan hệ cha–con trên UI.
        // (EN: Child span attaches under active Nest/Express HTTP span — same trace, parent/child in UI.)
        await tracer.startActiveSpan(
            "checkout.inventory_reserve",
            async (inventorySpan) => {
                const delayMs = 50 + Math.floor(Math.random() * 400)
                // Attribute cố định — học viên đối chiếu độ trễ trên Jaeger không cần đoạn này là gì chi tiết.
                // (EN: Fixed attribute — learners correlate delay in Jaeger without deeper domain meaning.)
                inventorySpan.setAttribute(
                    "checkout.inventory.delay_ms",
                    delayMs,
                )
                await delay(delayMs)
            },
        )

        // Sau khi span con kết thúc, context active trở lại span inbound — `traceId` trùng payload response.
        // (EN: After child ends, active context is inbound span again — `traceId` matches response payload.)
        const traceId =
            trace.getSpan(context.active())?.spanContext().traceId ?? ""

        return {
            message: "Checkout completed",
            traceId,
        }
    }
}
