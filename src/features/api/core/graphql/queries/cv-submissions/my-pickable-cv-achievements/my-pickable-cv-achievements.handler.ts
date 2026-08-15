import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CvEvidenceService,
} from "@modules/bussiness/cv-evidence/cv-evidence.service"
import {
    MyPickableCvAchievementsQuery,
} from "./my-pickable-cv-achievements.query"
import {
    MyPickableCvAchievementsViewData,
} from "./graphql-types/response"

@QueryHandler(MyPickableCvAchievementsQuery)
@Injectable()
/**
 * Handler for `myPickableCvAchievements` -- exposes the passed capstone tasks
 * the CV block editor's "pick from StarCi" flow needs (block editor,
 * Direction A toolbar-led), synchronously (no BullMQ wait).
 *
 * The SQL mirrors `GenerateCvGatherStepService.gatherMilestoneTaskAttempts`
 * (`processors/ai/generate-cv/steps`) -- same WHERE clause (passed=true), just
 * with the attempt id added so the FE can key a stable pick-list. CAPSTONE
 * ONLY (2026-07-05): challenges/achievements are deliberately NOT surfaced --
 * they don't go on the CV and don't count toward score. Every row here is
 * Verified by construction: it can only exist if a real, passed capstone does.
 */
export class MyPickableCvAchievementsHandler
    extends ICQRSHandler<MyPickableCvAchievementsQuery, MyPickableCvAchievementsViewData>
    implements IQueryHandler<MyPickableCvAchievementsQuery, MyPickableCvAchievementsViewData> {
    constructor(
        private readonly cvEvidenceService: CvEvidenceService,
    ) {
        super()
    }

    /**
     * Process the query.
     * @param query - The query.
     * @returns The view data.
     */
    protected override async process(
        query: MyPickableCvAchievementsQuery,
    ): Promise<MyPickableCvAchievementsViewData> {
        const {
            user,
        } = query.params

        // guard: the resolver is auth-guarded so `user` is present in practice,
        // but ExecuteParams types it optional -- no user means nothing to pick
        if (!user) {
            return {
                milestoneTaskAttempts: [],
            }
        }

        const snapshot = await this.cvEvidenceService.listPickable({
            userId: user.id,
        })

        return {
            milestoneTaskAttempts: snapshot.map((item) => ({
                id: item.milestoneTaskAttemptId,
                courseId: item.courseId,
                taskTitle: item.taskTitle,
                milestoneTitle: item.milestoneTitle,
                courseTitle: item.courseTitle,
                score: item.score,
            })),
        }
    }
}
