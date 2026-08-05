import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** Milestone tasks passed across the user's enrollments. */
export class CrownedOwlBadge extends AbstractBadge {
    readonly slug = "crowned-owl"

    getSql(): string {
        return `(
            SELECT COUNT(DISTINCT umt.id)
            FROM enrollments e
            JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
            JOIN user_milestone_task_attempts umta
                ON umta.user_milestone_task_id = umt.id AND umta.passed = true
            WHERE e.user_id = $1
        )`
    }
}
