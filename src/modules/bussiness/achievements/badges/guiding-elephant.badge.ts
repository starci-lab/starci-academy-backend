import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/** Discussion comments posted. */
@Injectable()
export class GuidingElephantBadge extends AbstractBadge {
    readonly slug = "guiding-elephant"

    getSql(): string {
        return "(SELECT COUNT(*) FROM content_comments WHERE user_id = $1)"
    }
}
