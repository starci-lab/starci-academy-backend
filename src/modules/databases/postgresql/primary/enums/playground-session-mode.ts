import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * How much scaffolding a learner's {@link import("../entities/playground-session.entity").PlaygroundSessionEntity}
 * run gives them. Stored as a Postgres `enum` column (not `varchar`) — this
 * is a brand-new, single-owner column with a small, stable value set, so the
 * TypeORM synchronize `ADD VALUE` footgun (shared-column collision) does not
 * apply here.
 */
export enum PlaygroundSessionMode {
    /**
     * Default. The learner sees each step's `commandHint` in the browser —
     * a guided walkthrough.
     */
    Guided = "guided",
    /**
     * The learner works without `commandHint` — the server redacts it (nulls
     * it out) from every step in the session response, forcing the learner
     * to recall/derive the command themselves.
     */
    Free = "free",
}

export const GraphQLTypePlaygroundSessionMode = createEnumType(PlaygroundSessionMode)

registerEnumType(
    GraphQLTypePlaygroundSessionMode,
    {
        name: "PlaygroundSessionMode",
        description: "How much scaffolding a playground session gives the learner.",
        valuesMap: {
            [PlaygroundSessionMode.Guided]: {
                description: "Step command hints are shown to the learner.",
            },
            [PlaygroundSessionMode.Free]: {
                description: "Step command hints are redacted — the learner works unaided.",
            },
        },
    },
)
