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
import Redis from "ioredis"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name)

/**
 * Logic — Xử lý message/job trong `handleSagaEvent`.
 * Code — Parse payload → side effects (DB/Redis/Kafka) → ack/return.
 * (EN Logic: Process message/job in `handleSagaEvent`.)
 * (EN Code: Parse payload → side effects → ack/return.)
 */
    async handleSagaEvent(event: SagaEvent) {
        if (event.event === "ORDER_CREATED") {
            // Idempotency guard to avoid double-capture when event is re-delivered (VI: chặn xử lý trùng khi event bị gửi lại).
            const exists = await this.payments.findOne({
                where: {
                    orderId: event.orderId 
                },
            })
            if (exists) {
                return
            }
            // Persist captured payment before emitting next step event (VI: lưu trạng thái CAPTURED trước khi phát event cho bước kế tiếp).
            await this.payments.save(
                this.payments.create({
                    orderId: event.orderId,
                    productId: event.productId,
                    quantity: event.quantity,
                    status: "CAPTURED",
                }),
            )
            // Notify inventory that payment has been captured (VI: thông báo inventory rằng thanh toán đã được capture).
            await firstValueFrom(
                this.producer.emit({
                    event: "PAYMENT_CAPTURED",
                    orderId: event.orderId,
                    productId: event.productId,
                    quantity: event.quantity,
                    amount: 99.99,
                }),
            )
            return
        }

        if (event.event === "INVENTORY_OUT_OF_STOCK") {
            // Find payment record for compensation path (VI: tìm payment tương ứng để chạy luồng bù trừ).
            const row = await this.payments.findOne({
                where: {
                    orderId: event.orderId 
                },
            })
            if (!row || row.status === "REFUNDED") {
                return
            }
            // Mark refunded before emitting PAYMENT_REFUNDED to keep state transition explicit (VI: đổi trạng thái REFUNDED trước khi phát event hoàn tiền).
            row.status = "REFUNDED"
            await this.payments.save(row)
            await firstValueFrom(
                this.producer.emit({
                    event: "PAYMENT_REFUNDED",
                    orderId: event.orderId,
                }),
            )
            this.log.log(`Refunded order "${event.orderId}"`)
        }
    }
}
