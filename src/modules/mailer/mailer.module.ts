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
    BREVO_MAILER_OPTIONS,
    createBrevoMailerOptionsProvider,
} from "./mailer.providers"

/**
 * Configures Nest Mailer transport and template engine.
 *
 * The send-mail worker injects `MailerService` from this module to perform
 * actual delivery through nodemailer + Brevo SMTP with Pug templates.
 */
@Module({
    imports: [],
    providers: [],
    exports: [],
})
export class MailModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const brevoMailerOptionsProvider = createBrevoMailerOptionsProvider()

        return {
            ...dynamicModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                MailerModule.forRootAsync({
                    inject: [BREVO_MAILER_OPTIONS],
                    useFactory: (mailerOptions: MailerOptions): MailerOptions => mailerOptions,
                }),
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                brevoMailerOptionsProvider,
            ],
            exports: [
                MailerModule,
                brevoMailerOptionsProvider,
            ],
        }
    }
}
