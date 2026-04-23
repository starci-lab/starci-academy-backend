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

export const BREVO_MAILER_OPTIONS = "BREVO_MAILER_OPTIONS"

export const createBrevoMailerOptionsProvider = (): Provider<MailerOptions> => ({
    provide: BREVO_MAILER_OPTIONS,
    useFactory: (): MailerOptions => ({
        transport: {
            host: envConfig().services.brevo.host,
            port: envConfig().services.brevo.port,
            secure: envConfig().services.brevo.secure,
            auth: {
                user: envConfig().services.brevo.username,
                pass: getBrevoSmtpPassword().trim(),
            },
            pool: true,
        },
        defaults: {
            from: `"${envConfig().services.brevo.fromName}" <${envConfig().services.brevo.fromAddress}>`,
        },
        template: {
            dir: join(__dirname,
                "templates"),
            adapter: new PugAdapter(),
            options: {
                strict: true,
            },
        },
    }),
})
