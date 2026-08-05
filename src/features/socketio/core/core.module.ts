import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./core.module-definition"
import {
    AutocompleteModule,
} from "./autocomplete/autocomplete.module"
import {
    JobNotificationsModule,
} from "./job-notifications/job-notifications.module"
import {
    ContentDiscussionModule,
} from "./content-discussion/content-discussion.module"
import {
    NotificationsModule,
} from "./notifications/notifications.module"
import {
    CommunityFeedModule,
} from "./community-feed/community-feed.module"
import {
    CommunityChatModule,
} from "./community-chat/community-chat.module"
import {
    ContentAiModule,
} from "./content-ai/content-ai.module"
import {
    SystemHealthModule,
} from "./system-health/system-health.module"
import {
    RagPlaygroundSocketModule,
} from "./rag-playground/rag-playground.module"
import {
    MockInterviewModule,
} from "./mock-interview/mock-interview.module"
import {
    PlaygroundByomSocketModule,
} from "./playground-byom/playground-byom.module"

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
        MockInterviewModule.register({
            isGlobal: true,
        }),
        SystemHealthModule.register({
            isGlobal: true,
        }),
        RagPlaygroundSocketModule.register({
            isGlobal: true,
        }),
        PlaygroundByomSocketModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Feature module bundling all real-time Socket.IO gateways of the app.
 *
 * - `/autocomplete`  namespace: Elasticsearch-powered autocomplete.
 */
export class CoreModule extends ConfigurableModuleClass {}
