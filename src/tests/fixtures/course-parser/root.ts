import path from "path"

/** Repository-owned Markdown fixtures used by hermetic course parser unit tests. */
export const COURSE_PARSER_FIXTURE_ROOT = path.join(
    process.cwd(),
    "src/tests/fixtures/course-parser/courses",
)
