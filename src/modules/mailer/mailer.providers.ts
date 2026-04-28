import {
    join,
} from "path"
import {
    Provider,
} from "@nestjs/common"
import {
    MailerOptions,
} from "@nestjs-modules/mailer"
import {
    PugAdapter,
} from "@nestjs-modules/mailer/adapters/pug.adapter"
import {
    envConfig,
} from "@modules/env"
import {
    getBrevoSmtpPassword,
} from "@modules/filesystem"
import {
    BREVO_MAILER 
} from "./constants"

/**
 * Create a provider for the Brevo mailer.
 * @returns The provider.
 */
export const createBrevoMailerProvider = (): Provider<MailerOptions> => (
    {
        /** Provide the Brevo mailer. */
        provide: BREVO_MAILER,
        /** Use a factory to create the mailer options. */
        useFactory: (): MailerOptions => ({
            /** Transport options. */
            transport: {
                host: envConfig().services.brevo.host,
                port: envConfig().services.brevo.port,
                secure: envConfig().services.brevo.secure,
                /** Authentication options. */
                auth: {
                    user: envConfig().services.brevo.username,
                    pass: getBrevoSmtpPassword().trim(),
                },
                /** Pool options. */
                pool: true,
            },
            /** Default options. */
            defaults: {
                /** From address. */
                from: `"${envConfig().services.brevo.fromName}" <${envConfig().services.brevo.fromAddress}>`,
            },
            template: {
                /** Template directory. */
                dir: join(
                    process.cwd(),
                    "templates"
                ),
                adapter: new PugAdapter(),
                /** Template options. */
                options: {
                    strict: true,
                },
            },
        }
        ),
    }
)
