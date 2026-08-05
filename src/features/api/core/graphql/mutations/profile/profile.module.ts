import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./profile.module-definition"
import {
    UpdateProfileSingleMutationModule,
} from "./update-profile/update-profile.module"
import {
    GenerateAvatarPresignUrlSingleMutationModule,
} from "./generate-avatar-presign-url/generate-avatar-presign-url.module"
import {
    VerifyAvatarPresignUrlSingleMutationModule,
} from "./verify-avatar-presign-url/verify-avatar-presign-url.module"
import {
    SetWeeklyGoalSingleMutationModule,
} from "./set-weekly-goal/set-weekly-goal.module"
import {
    SetKpiTargetSingleMutationModule,
} from "./set-kpi-target/set-kpi-target.module"
import {
    PinCourseProjectSingleMutationModule,
} from "./pin-course-project/pin-course-project.module"
import {
    PinExternalProjectSingleMutationModule,
} from "./pin-external-project/pin-external-project.module"
import {
    UnpinProjectSingleMutationModule,
} from "./unpin-project/unpin-project.module"
import {
    ReorderPinnedProjectsSingleMutationModule,
} from "./reorder-pinned-projects/reorder-pinned-projects.module"
import {
    ClaimDailyQuestRewardSingleMutationModule,
} from "./claim-daily-quest-reward/claim-daily-quest-reward.module"
import {
    ClaimKpiRewardSingleMutationModule,
} from "./claim-kpi-reward/claim-kpi-reward.module"
import {
    ClaimWeeklyChallengeRewardSingleMutationModule,
} from "./claim-weekly-challenge-reward/claim-weekly-challenge-reward.module"

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
