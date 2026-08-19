import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    SubmitContactRequest,
} from "./graphql-types/request"
import {
    SubmitContactResponse,
} from "./graphql-types/response"

/** Inbox that receives contact-form messages (the founder). */
const CONTACT_INBOX = "cuongnvtse160875@gmail.com"

/** Human label per category, used in the email subject + body. */
const CATEGORY_LABEL: Record<string, string> = {
    course_support: "Course support",
    partnership: "Partnership / hiring",
    general: "General",
}

/** Escape a user-supplied string before interpolating it into the HTML body. */
const escapeHtml = (value: string): string =>
    value
        .replaceAll("&",
            "&amp;")
        .replaceAll("<",
            "&lt;")
        .replaceAll(">",
            "&gt;")
        .replaceAll("\"",
            "&quot;")

@Resolver()
/**
 * Public contact-form endpoint. Anonymous (no auth guard) -- anyone can reach out.
 * The message is delivered to the founder's inbox via the shared mailer, with the
 * sender's address set as reply-to so a reply lands back in their mailbox.
 */
export class SubmitContactResolver {
    constructor(
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Your message has been sent",
        [Locale.Vi]: "Tin nhắn của bạn đã được gửi", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitContactResponse,
        {
            name: "submitContact",
            description: "Submit a public contact-form message (emailed to the team).",
        },
    )
    async execute(
        @Args("request")
            request: SubmitContactRequest,
    ): Promise<void> {
        const label = CATEGORY_LABEL[request.category] ?? CATEGORY_LABEL.general
        const text = [
            `Category: ${label}`,
            `Name: ${request.name}`,
            `Email: ${request.email}`,
            "",
            request.message,
        ].join("\n")
        const html = [
            `<p><strong>Category:</strong> ${escapeHtml(label)}</p>`,
            `<p><strong>Name:</strong> ${escapeHtml(request.name)}</p>`,
            `<p><strong>Email:</strong> ${escapeHtml(request.email)}</p>`,
            `<p style="white-space:pre-wrap">${escapeHtml(request.message)}</p>`,
        ].join("")

        await this.enqueueSendMailJobService.enqueue({
            to: [
                {
                    address: CONTACT_INBOX,
                },
            ],
            // a reply goes straight back to the person who reached out
            replyTo: {
                address: request.email,
                name: request.name,
            },
            subject: `[StarCi contact · ${label}] ${request.name}`,
            text,
            html,
        })
    }
}
