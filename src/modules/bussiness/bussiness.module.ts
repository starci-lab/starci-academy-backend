import {
    Module,
    DynamicModule,
    Type,
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./bussiness.module-definition"
import {
    JobsModule
} from "./jobs"
import {
    OPTIONS_TYPE,
} from "./bussiness.module-definition"
import {
    TransactionsModule,
} from "./transactions"
import {
    BloomFiltersModule,
} from "./bloom-filters"
import {
    UserModule,
} from "./user"
import {
    ProgressModule,
} from "./progress"
import {
    FlashcardModule,
} from "./flashcard"
import {
    CodingModule,
} from "./coding"
import {
    DiscussionModule,
} from "./discussion"
import {
    AiLabModule,
} from "./ai-lab"
import {
    NotificationModule,
} from "./notification"
import {
    ProjectionsModule,
} from "./projections"
import {
    LeagueModule,
} from "./league"
import {
    AchievementsModule,
} from "./achievements"
import {
    StreakModule,
} from "./streak"
import {
    InstallmentPlanModule,
} from "./installment-plan"
import {
    RewardsModule,
} from "./rewards"
import {
    DailyQuestModule,
} from "./daily-quest"
import {
    KpiRewardModule,
} from "./kpi-reward"
import {
    LearnerCmsModule,
} from "./learner-cms"
import {
    WeeklyChallengeModule,
} from "./weekly-challenge"
import {
    EsSyncModule,
} from "./es-sync"
import {
    LoyaltyModule,
} from "./loyalty"
import {
    CommunityModule,
} from "./community"
import {
    ChatModule,
} from "./chat"
import {
    ContentAiModule,
} from "./content-ai"
import {
    HeadhuntingsBussinessModule,
} from "./headhuntings"

/**
 * The module for the bussiness logics.
 */
@Module({
})
export class BussinessModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const modules: Array<DynamicModule | Type<unknown>> = [
            // import the jobs module
            JobsModule.register(options),
            // import the transactions module
            TransactionsModule.register(options),
            // import the bloom filters module
            BloomFiltersModule.register(options),
            // import the user module
            UserModule.register(options),
            // import the progress module
            ProgressModule.register(options),
            // import the flashcard (interview-prep) module
            FlashcardModule.register(options),
            // import the coding-practice module
            CodingModule.register(options),
            // import the content discussion (comments + reactions) module
            DiscussionModule.register(options),
            // import the AI Lab (playground + eval grading) module
            AiLabModule.register(options),
            // import the in-app notifications module
            NotificationModule.register(options),
            // import the CQRS projections module (progress + content + stats read-models)
            ProjectionsModule.register(options),
            // import the weekly-league module (tiers + cohorts + reset cron)
            LeagueModule.register(options),
            // import the achievements module (badge award engine)
            AchievementsModule.register(options),
            // import the streak-freeze module (buy + daily auto-protect cron)
            StreakModule.register(options),
            // import the installment-plan module (trả góp — plan lifecycle + daily enforcement cron)
            InstallmentPlanModule.register(options),
            // import the reward-store (Coin shop) module (catalog + wallet + redeem)
            RewardsModule.register(options),
            // import the daily-quest module (today's tasks + claim reward)
            DailyQuestModule.register(options),
            // import the kpi-reward module (weekly-KPI floor tracking + coin claim)
            KpiRewardModule.register(options),
            // import the learner self-management CMS reads (plain paginated lists)
            LearnerCmsModule.register(options),
            // import the weekly-challenge module (auto-rotate read-only event)
            WeeklyChallengeModule.register(options),
            // import the es-sync module (user → Elasticsearch `users` index sync)
            EsSyncModule.register(options),
            // import the loyalty-discount module (engagement-based course discount)
            LoyaltyModule.register(options),
            // import the community module (feed posts + comments + reactions)
            CommunityModule.register(options),
            // import the chat module (community room + founder DM threads)
            ChatModule.register(options),
            // import the content-AI module (grounded lesson Q&A, free model)
            ContentAiModule.register(options),
            // import the headhuntings module (CV-score gate on consultant contact details)
            HeadhuntingsBussinessModule.register(options),
        ]
        return {
            ...dynamicModule,
            imports: [
                ...modules,
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
            ],
            exports: [
                ...modules,
            ],
        }
    }
}