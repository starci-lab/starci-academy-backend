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

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class SmtpService {
    private readonly logger = new Logger(SmtpService.name)

/**
 * Logic — Ghi/sự kiện mới qua `sendMail`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `sendMail`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    async sendMail(to: string, subject: string, text: string): Promise<{
        provider: "primary" | "secondary"
        messageId: string
    }> {
        // Thử gửi qua primary (mặc định).
        // (EN: Attempt sending via primary (default).)
        try {
            const info = await this.mailerService.sendMail({
                to,
                subject,
                text,
            })
            this.logger.log(`Email sent via PRIMARY — messageId: ${info.messageId}`)
            return { provider: "primary", messageId: info.messageId }
        } catch (primaryError) {
            this.logger.warn(
                `Primary SMTP failed: ${primaryError.message} — failover to secondary`,
            )
        }

        // Failover sang secondary.
        // (EN: Failover to secondary.)
        try {
            const info = await this.mailerService.sendMail({
                to,
                subject,
                text,
                transporterName: "secondary",
            })
            this.logger.log(`Email sent via SECONDARY — messageId: ${info.messageId}`)
            return { provider: "secondary", messageId: info.messageId }
        } catch (secondaryError) {
            this.logger.error(`Both SMTP providers failed: ${secondaryError.message}`)
            throw new Error(
                `All SMTP providers exhausted. Primary and secondary both failed.`,
            )
        }
    }
}
