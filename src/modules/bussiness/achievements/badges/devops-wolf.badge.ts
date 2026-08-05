import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** Distinct lessons read inside the DevOps Mastery course. */
export class DevopsWolfBadge extends AbstractBadge {
    readonly slug = "devops-wolf"

    getSql(): string {
        return `(
            SELECT COUNT(DISTINCT uc.content_id)
            FROM user_contents uc
            JOIN contents c ON c.id = uc.content_id
            JOIN modules m ON m.id = c.module_id
            WHERE uc.user_id = $1
              AND uc.is_read = true
              AND m.course_id = 'f22c2da0-fc2d-5145-bf01-1b60426423b4'
        )`
    }
}
