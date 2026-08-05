import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/**
 * Current consecutive-day streak ending today/yesterday — gaps-and-islands
 * over the user's distinct XP-earning days.
 */
export class BlazingFoxBadge extends AbstractBadge {
    readonly slug = "blazing-fox"

    getSql(): string {
        return `(
            WITH days AS (
                SELECT DISTINCT created_at::date AS d
                FROM xp_histories WHERE user_id = $1
            ),
            islands AS (
                SELECT d, (d - (ROW_NUMBER() OVER (ORDER BY d))::int) AS island
                FROM days
            )
            SELECT COALESCE((
                SELECT COUNT(*) FROM islands
                WHERE island = (SELECT island FROM islands ORDER BY d DESC LIMIT 1)
                  AND (SELECT MAX(d) FROM days) >= CURRENT_DATE - 1
            ), 0)
        )`
    }
}
