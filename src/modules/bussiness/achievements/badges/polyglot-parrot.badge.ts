import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/** Courses enrolled in. */
@Injectable()
export class PolyglotParrotBadge extends AbstractBadge {
    readonly slug = "polyglot-parrot"

    getSql(): string {
        return "(SELECT COUNT(*) FROM enrollments WHERE user_id = $1)"
    }
}
