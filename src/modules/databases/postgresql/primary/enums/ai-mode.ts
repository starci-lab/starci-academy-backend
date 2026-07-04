import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Which AI "lane" a request runs on. Picked by the caller when enqueuing an
 * AI job (or resolved from the user's subscription when omitted), then
 * validated against what the user is actually entitled to.
 *
 * - {@link AiMode.Auto}    — free, course-included. Counted in "lượt" (uses);
 *                            only models flagged `complimentary` are served.
 * - {@link AiMode.Premium} — paid tier (Plus / Pro / Max). Credit-based; any
 *                            model category is allowed, cost varies by category.
 */
export enum AiMode {
    /** Free Auto lane — debited by uses, complimentary models only. */
    Auto = "auto",
    /** Paid Premium lane — debited by credits, any category. */
    Premium = "premium",
}

export const GraphQLTypeAiMode = createEnumType(AiMode)

registerEnumType(
    GraphQLTypeAiMode,
    {
        name: "AiMode",
        description: "Which AI lane a request runs on (auto / premium).",
        valuesMap: {
            [AiMode.Auto]: {
                description: "Free Auto lane — debited by uses, complimentary models only.",
            },
            [AiMode.Premium]: {
                description: "Paid Premium lane — debited by credits, any category.",
            },
        },
    },
)
