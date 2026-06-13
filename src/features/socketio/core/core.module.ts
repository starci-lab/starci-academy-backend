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
    ],
})
export class CoreModule extends ConfigurableModuleClass {}
