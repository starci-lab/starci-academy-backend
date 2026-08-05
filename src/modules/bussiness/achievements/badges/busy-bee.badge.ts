import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

@Injectable()
/** Followers gained. */
export class BusyBeeBadge extends AbstractBadge {
    readonly slug = "busy-bee"

    getSql(): string {
        return "(SELECT COUNT(*) FROM user_follows WHERE following_id = $1)"
    }
}
