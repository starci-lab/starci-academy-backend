/**
 * Checkout service — child span simulates inventory + latency; reads `traceId` from active HTTP span.
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    context,
    trace,
} from "@opentelemetry/api"

/**
 * Sleep `ms` milliseconds — simulates time-consuming internal work in the tracing lab.
 */
function delay(ms: number): Promise<void> {
    // Hand off to event loop — `resolve` runs after `ms`.
    return new Promise((resolve) => {
        setTimeout(resolve,
            ms)
    })
}

@Injectable()
/**
 * Class `CheckoutService` — lesson lab component.
 */
export class CheckoutService {
    /**
     * Logic: Two hops in one process: inbound HTTP (auto-instrumented) + internal child span for random slow step.
     * Code: `startActiveSpan` wraps `delay`; then read `trace.getSpan(context.active())?.spanContext().traceId`.
     */
    async simulateCheckout(): Promise<{ message: string; traceId: string }> {
        // Separate tracer name to namespace child spans in Jaeger (distinct from Resource `service.name`).
        const tracer = trace.getTracer("nestjs-tracing-app-checkout")

        // Child span attaches under active Nest/Express HTTP span — same trace, parent/child in UI.
        await tracer.startActiveSpan(
            "checkout.inventory_reserve",
            async (inventorySpan) => {
                const delayMs = 50 + Math.floor(Math.random() * 400)
                // Fixed attribute — learners correlate delay in Jaeger without deeper domain meaning.
                inventorySpan.setAttribute(
                    "checkout.inventory.delay_ms",
                    delayMs,
                )
                await delay(delayMs)
            },
        )

        // After child ends, active context is inbound span again — `traceId` matches response payload.
        const traceId =
            trace.getSpan(context.active())?.spanContext().traceId ?? ""

        return {
            message: "Checkout completed",
            traceId,
        }
    }
}
