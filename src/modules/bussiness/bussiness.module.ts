import {
    Module,
    DynamicModule,
    Type,
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./bussiness.module-definition"
import {
    JobsModule,
} from "./jobs/jobs.module"
import {
    OPTIONS_TYPE,
} from "./bussiness.module-definition"
import {
    TransactionsModule,
} from "./transactions/transactions.module"
import {
    BloomFiltersModule,
} from "./bloom-filters/bloom-filters.module"
import {
    UserModule,
} from "./user/user.module"
import {
    ProgressModule,
} from "./progress/progress.module"
import {
    FlashcardModule,
} from "./flashcard/flashcard.module"
import {
    CodingModule,
} from "./coding/coding.module"
import {
    DiscussionModule,
} from "./discussion/discussion.module"
import {
    NotificationModule,
} from "./notification/notification.module"
import {
    ProjectionsModule,
} from "./projections/projections.module"
import {
    LeagueModule,
} from "./league/league.module"
import {
    AchievementsModule,
} from "./achievements/achievements.module"
import {
    StreakModule,
} from "./streak/streak.module"
import {
    InstallmentPlanModule,
} from "./installment-plan/installment-plan.module"
import {
    RewardsModule,
} from "./rewards/rewards.module"
import {
    DailyQuestModule,
} from "./daily-quest/daily-quest.module"
import {
    KpiRewardModule,
} from "./kpi-reward/kpi-reward.module"
import {
    LearnerCmsModule,
} from "./learner-cms/learner-cms.module"
import {
    WeeklyChallengeModule,
} from "./weekly-challenge/weekly-challenge.module"
import {
    EsSyncModule,
} from "./es-sync/es-sync.module"
import {
    LoyaltyModule,
} from "./loyalty/loyalty.module"
import {
    CommunityModule,
} from "./community/community.module"
import {
    ChatModule,
} from "./chat/chat.module"
import {
    ContentAiModule,
} from "./content-ai/content-ai.module"
import {
    HeadhuntingsBussinessModule,
} from "./headhuntings/headhuntings.module"
import {
    CvEvidenceModule,
} from "./cv-evidence/cv-evidence.module"
import {
    CoursePricingModule,
} from "./course-pricing/course-pricing.module"

@Module({
})
/**
 * The module for the bussiness logics.
 */
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
            // import the installment-plan module (installment plan -- plan lifecycle + daily enforcement cron)
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
            // import the es-sync module (user -> Elasticsearch `users` index sync)
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
            // import the CV evidence module (passed-capstone selection + immutable snapshots)
            CvEvidenceModule.register(options),
            CoursePricingModule.register(options),
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
