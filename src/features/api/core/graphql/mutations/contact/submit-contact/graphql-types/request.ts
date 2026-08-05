import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Allowed contact reasons (kept identical on FE + BE as plain strings so the
 * wire value matches the i18n key -- no GraphQL-enum name mapping). Routes + labels
 * the email.
 */
export const CONTACT_CATEGORIES = [
    "course_support",
    "partnership",
    "general",
] as const

/** A reason a visitor is contacting StarCi. */
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]

@InputType({
    description: "A public contact-form message.",
})
/**
 * Payload of a public contact-form submission. Anonymous (no auth) -- anyone can
 * reach out; the message is emailed to the team with the sender's address as the
 * reply-to.
 */
export class SubmitContactRequest {
    @Field(
        () => String,
        {
            description: "Sender's display name.",
        },
    )
        name: string

    @Field(
        () => String,
        {
            description: "Sender's email address (used as the reply-to).",
        },
    )
        email: string

    @Field(
        () => String,
        {
            description: "Reason for contacting: course_support | partnership | general.",
        },
    )
        category: string

    @Field(
        () => String,
        {
            description: "The message body.",
        },
    )
        message: string
}
