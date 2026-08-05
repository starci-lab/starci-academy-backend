import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** First lessons read. */
export class BabyDucklingBadge extends AbstractBadge {
    readonly slug = "baby-duckling"

    getSql(): string {
        return "(SELECT COUNT(*) FROM user_contents WHERE user_id = $1 AND is_read = true)"
    }
}
