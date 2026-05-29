import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    CodingProblemsSingleQueryModule,
} from "./coding-problems"
import {
    CodingProblemSingleQueryModule,
} from "./coding-problem"
import {
    MyCodingSubmissionsSingleQueryModule,
} from "./my-coding-submissions"
import {
    CodingLeaderboardSingleQueryModule,
} from "./coding-leaderboard"

/**
 * Coding-practice query group: problem list/detail, submission history, and
 * the solved-count leaderboard.
 */
@Module({
    imports: [
        CodingProblemsSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingProblemSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCodingSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingLeaderboardSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class CodingQueriesModule extends ConfigurableModuleClass {}
