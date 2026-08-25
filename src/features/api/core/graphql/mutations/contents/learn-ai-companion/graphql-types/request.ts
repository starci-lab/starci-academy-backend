import {
    Field, ID, InputType 
} from "@nestjs/graphql"

@InputType({
    description:
    "Resolve the current learner's persistent AI companion for one enrolled course.",
})
/** Input for idempotently resolving the active course companion in Learn. */
export class ResolveLearnAiCompanionRequest {
  @Field(() => ID,
      {
          description: "Course currently open in Learn.",
      })
      courseId: string
}

@InputType({
    description:
    "Archive the current learner's AI companion for one enrolled course.",
})
/** Input for intentionally ending the current course-companion continuity. */
export class ResetLearnAiCompanionRequest {
  @Field(() => ID,
      {
          description: "Course whose active Learn companion should be reset.",
      })
      courseId: string
}
