import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    MailerModule,
    MailerOptions,
} from "@nestjs-modules/mailer"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./mailer.module-definition"
import {
    createBrevoMailerProvider,
} from "./mailer.providers"
import {
    BREVO_MAILER,
} from "./constants"

@Module({
})
/**
 * Configures Nest Mailer transport and template engine.
 *
 * The send-mail worker injects `MailerService` from this module to perform
 * actual delivery through nodemailer + Brevo SMTP with Pug templates.
 */
export class MailModule extends ConfigurableModuleClass {
    /**
     * Register the mail module.
     * @param options - The options.
     * @returns The dynamic module.
     */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const brevoMailerProvider = createBrevoMailerProvider()
        return {
            ...dynamicModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                MailerModule.forRootAsync({
                    inject: [BREVO_MAILER],
                    useFactory: (
                        mailerOptions: MailerOptions
                    ): MailerOptions => mailerOptions,
                }),
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                brevoMailerProvider,
            ],
            exports: [
                MailerModule,
                brevoMailerProvider,
            ],
        }
    }
}
