import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/** Distinct lessons read inside the Fullstack Mastery course. */
@Injectable()
export class FullstackMonkeyBadge extends AbstractBadge {
    readonly slug = "fullstack-monkey"

    getSql(): string {
        return `(
            SELECT COUNT(DISTINCT uc.content_id)
            FROM user_contents uc
            JOIN contents c ON c.id = uc.content_id
            JOIN modules m ON m.id = c.module_id
            WHERE uc.user_id = $1
              AND uc.is_read = true
              AND m.course_id = 'b359da45-9d91-5189-8374-bda0248167b3'
        )`
    }
}
