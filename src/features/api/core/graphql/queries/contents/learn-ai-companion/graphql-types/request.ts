import {
    Field, ID, InputType, Int 
} from "@nestjs/graphql"

@InputType({
    description: "Load the active Learn AI companion for one enrolled course.",
})
/** Input for reading one course companion with bounded transcript pagination. */
export class LearnAiCompanionRequest {
  @Field(() => ID,
      {
          description: "Course currently open in Learn.",
      })
      courseId: string

  @Field(() => Int,
      {
          nullable: true,
          description: "Maximum transcript messages to return (1-100, default 50).",
      })
      limit?: number

  @Field(() => Int,
      {
          nullable: true,
          description: "Transcript offset for progressive history loading.",
      })
      offset?: number
}
