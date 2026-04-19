/**
 * A single recipient of an outgoing email.
 * Name is optional; when omitted the address is used verbatim.
 */
export interface SendMailRecipient {
    /** RFC 5322 email address (e.g. `user@example.com`). */
    address: string
    /** Optional display name used in the recipient header. */
    name?: string
}

/**
 * Attachment descriptor for an outgoing email.
 * Exactly one of `contentBase64`, `path`, or `href` must be provided.
 */
export interface SendMailAttachment {
    /** Filename shown in the mail client. */
    filename: string
    /** Base64-encoded content (use for small, in-memory payloads). */
    contentBase64?: string
    /** Absolute path on the worker filesystem. */
    path?: string
    /** Remote URL fetched by the SMTP client. */
    href?: string
    /** MIME type override; otherwise derived from the filename. */
    contentType?: string
    /** Content-ID used for embedding inline images. */
    cid?: string
}

/**
 * Payload for a send-mail BullMQ job.
 *
 * The worker serialises this payload, resolves Mailcow SMTP credentials
 * from {@link envConfig}, and hands the message to nodemailer.
 */
export interface SendMailPayload {
    /** Primary recipients (`To` header). */
    to: Array<SendMailRecipient>
    /** Carbon-copy recipients (`Cc` header). */
    cc?: Array<SendMailRecipient>
    /** Blind carbon-copy recipients (`Bcc` header). */
    bcc?: Array<SendMailRecipient>
    /** Reply-to address; falls back to the configured `from` when omitted. */
    replyTo?: SendMailRecipient
    /** Override for the `From` header. Defaults to the env-configured sender. */
    from?: SendMailRecipient
    /** Email subject line. */
    subject: string
    /** HTML body. When provided, it takes precedence over `text`. */
    html?: string
    /** Plain-text body; used as a fallback and for text-only clients. */
    text?: string
    /** Optional file/inline attachments. */
    attachments?: Array<SendMailAttachment>
    /** Arbitrary additional SMTP headers (e.g. `X-Mailcow-Tag`). */
    headers?: Record<string, string>
}
