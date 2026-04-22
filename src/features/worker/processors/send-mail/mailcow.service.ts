import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    SendMailAttachment,
    SendMailPayload,
    SendMailRecipient,
} from "@modules/bullmq"
import {
    createTransport,
    Transporter,
} from "nodemailer"

/**
 * Thin wrapper around nodemailer that targets the Mailcow SMTP gateway.
 *
 * The transporter is created once at bootstrap time and reused across
 * jobs; nodemailer internally pools SMTP connections.
 */
@Injectable()
export class MailcowService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MailcowService.name)

    private transporter!: Transporter

    onModuleInit(): void {
        const {
            host,
            port,
            secure,
            username,
            password,
            rejectUnauthorized,
        } = envConfig().services.mailcow

        this.transporter = createTransport({
            host,
            port,
            secure,
            auth: username
                ? {
                    user: username,
                    pass: password,
                }
                : undefined,
            tls: {
                rejectUnauthorized,
            },
            pool: true,
        })
    }

    onModuleDestroy(): void {
        this.transporter?.close()
    }

    /**
     * Relay the payload to Mailcow. Errors propagate so BullMQ can retry
     * according to its backoff policy.
     */
    async send(payload: SendMailPayload): Promise<void> {
        const {
            fromAddress,
            fromName,
        } = envConfig().services.mailcow

        const info = await this.transporter.sendMail({
            from: this.formatAddress(
                payload.from ?? {
                    address: fromAddress,
                    name: fromName,
                },
            ),
            to: payload.to.map((r) => this.formatAddress(r)),
            cc: payload.cc?.map((r) => this.formatAddress(r)),
            bcc: payload.bcc?.map((r) => this.formatAddress(r)),
            replyTo: payload.replyTo
                ? this.formatAddress(payload.replyTo)
                : undefined,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            headers: payload.headers,
            attachments: payload.attachments?.map((a) => this.toNodemailerAttachment(a)),
        })

        this.logger.log(
            `Mailcow accepted message ${info.messageId} for ${payload.to.map((r) => r.address).join(", ")}`,
        )
    }

    private formatAddress(recipient: SendMailRecipient): string {
        return recipient.name
            ? `"${recipient.name.replace(/"/g,
                "'")}" <${recipient.address}>`
            : recipient.address
    }

    private toNodemailerAttachment(attachment: SendMailAttachment) {
        return {
            filename: attachment.filename,
            contentType: attachment.contentType,
            cid: attachment.cid,
            content: attachment.contentBase64
                ? Buffer.from(attachment.contentBase64,
                    "base64")
                : undefined,
            path: attachment.path,
            href: attachment.href,
        }
    }
}
