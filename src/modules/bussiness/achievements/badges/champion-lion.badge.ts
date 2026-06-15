import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/** Highest league tier reached, as an ordinal (bronze=1 … legend=7). */
@Injectable()
export class ChampionLionBadge extends AbstractBadge {
    readonly slug = "champion-lion"

    getSql(): string {
        return `(
            SELECT COALESCE((
                SELECT CASE tier::text
                    WHEN 'bronze' THEN 1 WHEN 'silver' THEN 2 WHEN 'gold' THEN 3
                    WHEN 'platinum' THEN 4 WHEN 'diamond' THEN 5 WHEN 'champion' THEN 6
                    WHEN 'legend' THEN 7 ELSE 0 END
                FROM user_leagues WHERE user_id = $1
            ), 0)
        )`
    }
}
