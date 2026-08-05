import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Editorial pillar of a blog post -- drives the colored chip + section filter on
 * the FE `/blog` page. The "deep-dive" pillar is the SEO magnet (long technical
 * articles), the rest support build-in-public, career, AI and case-study content.
 */
export enum BlogCategory {
    /** Long technical deep-dive extending a course topic (SEO magnet). */
    DeepDive = "deep-dive",
    /** Behind-the-scenes engineering / founder build-in-public note. */
    BuildInPublic = "build-in-public",
    /** Career, roadmap and interview-prep guidance. */
    Career = "career",
    /** AI / LLM engineering article. */
    Ai = "ai",
    /** Learner success story / case study. */
    CaseStudy = "case-study",
    /** Guided analysis of this codebase's source (open-source onboarding). */
    Codebase = "codebase",
}

/**
 * GraphQL type for the blog category enum. GraphQL enum names can only contain
 * `[_a-zA-Z0-9]`, so the hyphenated DB values (`deep-dive`, ...) are exposed under
 * snake_case member names that map back to those values.
 */
export const GraphQLTypeBlogCategory = {
    DEEP_DIVE: BlogCategory.DeepDive,
    BUILD_IN_PUBLIC: BlogCategory.BuildInPublic,
    CAREER: BlogCategory.Career,
    AI: BlogCategory.Ai,
    CASE_STUDY: BlogCategory.CaseStudy,
    CODEBASE: BlogCategory.Codebase,
}

registerEnumType(
    GraphQLTypeBlogCategory,
    {
        name: "BlogCategory",
        description: "Editorial pillar of a blog post.",
        valuesMap: {
            DEEP_DIVE: {
                description: "Long technical deep-dive extending a course topic.",
            },
            BUILD_IN_PUBLIC: {
                description: "Behind-the-scenes engineering / founder note.",
            },
            CAREER: {
                description: "Career, roadmap and interview-prep guidance.",
            },
            AI: {
                description: "AI / LLM engineering article.",
            },
            CASE_STUDY: {
                description: "Learner success story / case study.",
            },
            CODEBASE: {
                description: "Guided analysis of this codebase's source.",
            },
        },
    },
)
