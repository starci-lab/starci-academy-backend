import {
    Field,
    GraphQLISODateTime,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse 
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse 
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description:
    "Stable active companion identity for one enrollment and course.",
})
/** Course-owned session metadata exposed only by the dedicated Learn API. */
export class LearnAiCompanionSessionType {
  @Field(() => ID)
      id: string

  @Field(() => ID)
      courseId: string

  @Field(() => ID)
      enrollmentId: string

  @Field(() => String,
      {
          nullable: true,
      })
      title: string | null

  @Field(() => GraphQLISODateTime,
      {
          nullable: true,
      })
      archivedAt: Date | null

  @Field(() => GraphQLISODateTime)
      updatedAt: Date
}

@ObjectType({
    description: "One visible message in the course companion transcript.",
})
/** One learner or assistant message restored across Learn page transitions. */
export class LearnAiCompanionMessageType {
  @Field(() => String)
      role: string

  @Field(() => String)
      content: string
}

@ObjectType({
    description: "Durable delivery state for one companion request.",
})
/** Request journal state used by Learn to reconcile retries and reconnects. */
export class LearnAiCompanionTurnType {
  @Field(() => String)
      streamId: string

  @Field(() => String)
      state: string

  @Field(() => String,
      {
          nullable: true,
      })
      response: string | null

  @Field(() => String,
      {
          nullable: true,
      })
      errorCode: string | null

  @Field(() => Int)
      attemptCount: number

  @Field(() => GraphQLISODateTime)
      updatedAt: Date
}

@ObjectType({
    description:
    "Current course companion, transcript, and durable request lifecycle.",
})
/** Complete continuity snapshot consumed by the Learn companion shell. */
export class LearnAiCompanionData {
  @Field(() => LearnAiCompanionSessionType,
      {
          nullable: true,
      })
      session: LearnAiCompanionSessionType | null

  @Field(() => [LearnAiCompanionMessageType])
      messages: Array<LearnAiCompanionMessageType>

  @Field(() => [LearnAiCompanionTurnType])
      turns: Array<LearnAiCompanionTurnType>
}

@ObjectType({
    description: "Response wrapper for the Learn AI companion query.",
})
/** GraphQL envelope for the active course-companion continuity snapshot. */
export class LearnAiCompanionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LearnAiCompanionData>
{
  @Field(() => LearnAiCompanionData,
      {
          nullable: true,
      })
      data: LearnAiCompanionData
}
