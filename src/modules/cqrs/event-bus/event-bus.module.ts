import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./event-bus.module-definition"
import {
    AddGithubUserToTeamHandler,
} from "./add-github-user-to-team"
import {
    SendMailEventHandler,
} from "./send-mail"

/**
 * Module that exposes typed event-bus handlers built on top of the
 * lightweight in-memory {@link EventBus} from `@modules/bussiness`.
 *
 * Each handler represents a single domain intent and hides the detail
 * of which BullMQ queue/payload shape is used downstream.
 */
@Module({
})
export class EventBusModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                AddGithubUserToTeamHandler,
                SendMailEventHandler,
            ],
            exports: [
                AddGithubUserToTeamHandler,
                SendMailEventHandler,
            ],
        }
    }
}
