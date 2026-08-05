import {
    Entity,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"

@Entity("trending_contents_projections")
/**
 * CQRS projection of the platform-wide "trending lessons this week" board -- a
 * SINGLE GLOBAL ROW keyed by the constant `key` ("global"). The inherited jsonb
 * `value` holds `{ items: [{ id, title, readCount }] }` (top-N candidates),
 * recomputed from the rolling 7-day `user_contents` GROUP BY (the heavy aggregate
 * runs only in the projection's recompute, never inline at read time). Read with a
 * TTL lazy-refresh; kept fresh by CDC on `user_contents`.
 */
export class TrendingContentsProjectionEntity extends AbstractProjectionEntity {
    /** Constant partition key ("global") -- there is exactly one trending row. */
    @PrimaryColumn({
        name: "key",
        type: "varchar",
    })
        key: string
}
