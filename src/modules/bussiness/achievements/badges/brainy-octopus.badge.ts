import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** AI-Lab eval sets passed. */
export class BrainyOctopusBadge extends AbstractBadge {
    readonly slug = "brainy-octopus"

    getSql(): string {
        return "(SELECT COUNT(DISTINCT eval_set_id) FROM ai_lab_eval_runs WHERE user_id = $1 AND passed = true)"
    }
}
