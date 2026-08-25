import {
    Field, ID, ObjectType 
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse 
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse 
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Resolved identity of the active Learn AI companion.",
})
/** Stable session identity returned to the Learn shell after resolution. */
export class ResolveLearnAiCompanionData {
  @Field(() => ID,
      {
          nullable: true,
          description:
      "Stable course-companion session id, or null without an eligible enrollment.",
      })
      sessionId: string | null
}

@ObjectType({
    description: "Response wrapper for resolving a Learn AI companion.",
})
/** GraphQL envelope for the idempotent course-companion resolution result. */
export class ResolveLearnAiCompanionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ResolveLearnAiCompanionData>
{
  @Field(() => ResolveLearnAiCompanionData,
      {
          nullable: true,
      })
      data: ResolveLearnAiCompanionData
}

@ObjectType({
    description: "Result of resetting a Learn AI companion.",
})
/** Archived companion identity returned after an explicit learner reset. */
export class ResetLearnAiCompanionData {
  @Field(() => ID,
      {
          nullable: true,
          description:
      "Archived session id, or null when there was no active companion.",
      })
      archivedSessionId: string | null
}

@ObjectType({
    description: "Response wrapper for resetting a Learn AI companion.",
})
/** GraphQL envelope for the explicit course-companion reset result. */
export class ResetLearnAiCompanionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ResetLearnAiCompanionData>
{
  @Field(() => ResetLearnAiCompanionData,
      {
          nullable: true,
      })
      data: ResetLearnAiCompanionData
}
