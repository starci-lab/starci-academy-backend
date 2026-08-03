import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a course has no configured GitHub team slug mapping. */
export interface CourseGithubTeamSlugNotMappedExceptionMetadata extends AbstractExceptionMetadata {
    courseSlug: string
}

/** Thrown when no GitHub team slug is configured for the resolved course slug. */
export class CourseGithubTeamSlugNotMappedException extends AbstractException {
    constructor(
        {
            courseSlug,
            originalError,
        }: CourseGithubTeamSlugNotMappedExceptionMetadata,
    ) {
        super(
            "Course GitHub team slug is not mapped",
            "COURSE_GITHUB_TEAM_SLUG_NOT_MAPPED_EXCEPTION",
            {
                courseSlug,
                originalError,
            },
        )
    }
}
