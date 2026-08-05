import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./daily-quest.module-definition"
import {
    DailyQuestService,
} from "./daily-quest.service"

@Module({
    providers: [
        DailyQuestService,
    ],
    exports: [
        DailyQuestService,
    ],
})
/**
 * Daily-quest business module. Exports {@link DailyQuestService} so the GraphQL
 * `myDailyQuest` query + `claimDailyQuestReward` mutation can read today's quest
 * progress and claim the reward. The user / xp_histories / user_flashcard_reviews
 * / daily_quest_completions tables it reads are provided by the globally-registered
 * databases module.
 */
export class DailyQuestModule extends ConfigurableModuleClass {}
