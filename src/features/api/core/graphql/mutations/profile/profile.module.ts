import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./profile.module-definition"
import {
    UpdateProfileSingleMutationModule,
} from "./update-profile"
import {
    GenerateAvatarPresignUrlSingleMutationModule,
} from "./generate-avatar-presign-url"
import {
    VerifyAvatarPresignUrlSingleMutationModule,
} from "./verify-avatar-presign-url"
import {
    SetWeeklyGoalSingleMutationModule,
} from "./set-weekly-goal"
import {
    SetKpiTargetSingleMutationModule,
} from "./set-kpi-target"
import {
    PinCourseProjectSingleMutationModule,
} from "./pin-course-project"
import {
    PinExternalProjectSingleMutationModule,
} from "./pin-external-project"
import {
    UnpinProjectSingleMutationModule,
} from "./unpin-project"
import {
    ReorderPinnedProjectsSingleMutationModule,
} from "./reorder-pinned-projects"
import {
    ClaimDailyQuestRewardSingleMutationModule,
} from "./claim-daily-quest-reward"
import {
    ClaimKpiRewardSingleMutationModule,
} from "./claim-kpi-reward"
import {
    ClaimWeeklyChallengeRewardSingleMutationModule,
} from "./claim-weekly-challenge-reward"

@Module({
    imports: [
        UpdateProfileSingleMutationModule.register({
            isGlobal: true,
        }),
        GenerateAvatarPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        VerifyAvatarPresignUrlSingleMutationModule.register({
            isGlobal: true,
        }),
        SetWeeklyGoalSingleMutationModule.register({
            isGlobal: true,
        }),
        SetKpiTargetSingleMutationModule.register({
            isGlobal: true,
        }),
        PinCourseProjectSingleMutationModule.register({
            isGlobal: true,
        }),
        PinExternalProjectSingleMutationModule.register({
            isGlobal: true,
        }),
        UnpinProjectSingleMutationModule.register({
            isGlobal: true,
        }),
        ReorderPinnedProjectsSingleMutationModule.register({
            isGlobal: true,
        }),
        ClaimDailyQuestRewardSingleMutationModule.register({
            isGlobal: true,
        }),
        ClaimKpiRewardSingleMutationModule.register({
            isGlobal: true,
        }),
        ClaimWeeklyChallengeRewardSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Profile mutation group (edit display name, bio, avatar). Avatar upload is a
 * presigned-URL flow: generateAvatarPresignUrl -> client PUTs to MinIO ->
 * verifyAvatarPresignUrl persists it (mirrors the CV submission flow).
 */
export class ProfileMutationsModule extends ConfigurableModuleClass {}
