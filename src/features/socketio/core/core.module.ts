import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./core.module-definition"
import {
    AutocompleteModule 
} from "./autocomplete"
import {
    JobNotificationsModule,
} from "./job-notifications"
import {
    ContentDiscussionModule,
} from "./content-discussion"
import {
    AiLabModule,
} from "./ai-lab"
import {
    NotificationsModule,
} from "./notifications"
import {
    CommunityFeedModule,
} from "./community-feed"
import {
    CommunityChatModule,
} from "./community-chat"
import {
    ContentAiModule,
} from "./content-ai"
import {
    SystemHealthModule,
} from "./system-health"
import {
    RagPlaygroundSocketModule,
} from "./rag-playground"

/**
 * Feature module bundling all real-time Socket.IO gateways of the app.
 *
 * - `/autocomplete`  namespace: Elasticsearch-powered autocomplete.
 */
@Module({
    imports: [
        AutocompleteModule.register({
            isGlobal: true,
        }),
        JobNotificationsModule.register({
            isGlobal: true,
        }),
        ContentDiscussionModule.register({
            isGlobal: true,
        }),
        AiLabModule.register({
            isGlobal: true,
        }),
        NotificationsModule.register({
            isGlobal: true,
        }),
        CommunityFeedModule.register({
            isGlobal: true,
        }),
        CommunityChatModule.register({
            isGlobal: true,
        }),
        ContentAiModule.register({
            isGlobal: true,
        }),
        SystemHealthModule.register({
            isGlobal: true,
        }),
        RagPlaygroundSocketModule.register({
            isGlobal: true,
        }),
    ],
})
export class CoreModule extends ConfigurableModuleClass {}
