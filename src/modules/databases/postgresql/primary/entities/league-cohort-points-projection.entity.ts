import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    LeagueCohortEntity,
} from "./league-cohort.entity"

@Entity("league_cohort_points_projections")
/**
 * CQRS projection of a league cohort's ranked week-points board -- ONE ROW PER
 * cohort. The inherited jsonb `value` holds `{ members: [{ userId, username,
 * avatar, weekPoints }] }` (ordered best -> worst), recomputed from the
 * `SUM(xp_histories.points)` GROUP BY inside the cohort's week window (the heavy
 * aggregate runs only in the projection's recompute, never inline at read time).
 * Read with a TTL lazy-refresh; kept fresh by CDC on `xp_histories`.
 */
export class LeagueCohortPointsProjectionEntity extends AbstractProjectionEntity {
    /** Target cohort id -- the natural (primary) key. */
    @PrimaryColumn({
        name: "cohort_id",
        type: "uuid",
    })
        cohortId: string

    /** The cohort this projection belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => LeagueCohortEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "cohort_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_cohort_id_league_cohort_points_projections_league_cohorts",
    })
        cohort: LeagueCohortEntity
}
