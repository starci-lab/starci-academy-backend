import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** Distinct lessons read inside the System Design Mastery course. */
export class ArchitectRhinoBadge extends AbstractBadge {
    readonly slug = "architect-rhino"

    getSql(): string {
        return `(
            SELECT COUNT(DISTINCT uc.content_id)
            FROM user_contents uc
            JOIN contents c ON c.id = uc.content_id
            JOIN modules m ON m.id = c.module_id
            WHERE uc.user_id = $1
              AND uc.is_read = true
              AND m.course_id = '1ab239c8-ebb5-53ee-b255-dc7839a6b959'
        )`
    }
}
