import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    MyPickableCvAchievementsQuery,
} from "./my-pickable-cv-achievements.query"
import {
    MyPickableCvAchievementsViewData,
    PickableMilestoneAchievement,
} from "./graphql-types"

/** Row shape returned by the PASSED milestone-task-attempts SQL. */
interface MilestoneTaskAttemptRow {
    id: string
    task_title: string
    milestone_title: string
    course_title: string
    score: number
}

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
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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

        const milestoneTaskAttempts = await this.loadMilestoneTaskAttempts(user.id)

        return {
            milestoneTaskAttempts,
        }
    }

    /**
     * PASSED milestone/capstone task attempts for the user, most recent first.
     * @param userId - The user id.
     * @returns The pickable milestone achievements.
     */
    private async loadMilestoneTaskAttempts(userId: string): Promise<Array<PickableMilestoneAchievement>> {
        const rows = await this.entityManager.query(
            `
            SELECT mta.id AS id, mt.title AS task_title, m.title AS milestone_title,
                   c.title AS course_title, mta.score AS score
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = $1 AND mta.passed = true
            ORDER BY mta.created_at DESC
            `,
            [
                userId,
            ],
        ) as Array<MilestoneTaskAttemptRow>

        return rows.map((row) => ({
            id: row.id,
            taskTitle: row.task_title,
            milestoneTitle: row.milestone_title,
            courseTitle: row.course_title,
            score: Number(row.score ?? 0),
        }))
    }
}
