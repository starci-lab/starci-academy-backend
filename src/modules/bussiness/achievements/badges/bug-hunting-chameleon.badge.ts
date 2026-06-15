import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/** Coding-practice problems solved (an accepted submission). */
@Injectable()
export class BugHuntingChameleonBadge extends AbstractBadge {
    readonly slug = "bug-hunting-chameleon"

    getSql(): string {
        return "(SELECT COUNT(DISTINCT coding_problem_id) FROM coding_submissions WHERE user_id = $1 AND verdict = 'accepted')"
    }
}
