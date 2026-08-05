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
} from "./add-github-user-to-team/add-github-user-to-team.handler"
import {
    SendMailEventHandler,
} from "./send-mail/send-mail.handler"
import {
    SyncScyllaDBEventHandler,
} from "./sync-scylladb/sync-scylladb.handler"

@Module({
})
/**
 * Module that exposes typed event-bus handlers built on top of the
 * lightweight in-memory {@link EventBus} from `@modules/bussiness`.
 *
 * Each handler represents a single domain intent and hides the detail
 * of which BullMQ queue/payload shape is used downstream.
 */
export class EventBusModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                AddGithubUserToTeamHandler,
                SendMailEventHandler,
                SyncScyllaDBEventHandler,
            ],
            exports: [
                AddGithubUserToTeamHandler,
                SendMailEventHandler,
                SyncScyllaDBEventHandler,
            ],
        }
    }
}
