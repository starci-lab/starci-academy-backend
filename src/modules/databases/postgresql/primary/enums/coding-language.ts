import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Programming language a user submits a coding-problem solution in.
 * The string value is the stable wire/DB value; the Judge0 numeric
 * `language_id` is mapped separately via env config (a language may map to
 * different Judge0 ids across Judge0 versions).
 */
export enum CodingLanguage {
    /** Python 3 source submission. */
    Python = "python",
    /** JavaScript (Node.js) source submission. */
    JavaScript = "javascript",
    /** TypeScript source submission (transpiled by the Judge0 language). */
    TypeScript = "typescript",
    /** Java source submission. */
    Java = "java",
    /** C++ source submission. */
    Cpp = "cpp",
}

/** GraphQL enum wrapper for {@link CodingLanguage}. */
export const GraphQLTypeCodingLanguage = createEnumType(CodingLanguage)

registerEnumType(
    GraphQLTypeCodingLanguage,
    {
        name: "CodingLanguage",
        description: "Programming language for a coding-problem submission.",
        valuesMap: {
            [CodingLanguage.Python]: {
                description: "Python 3.",
            },
            [CodingLanguage.JavaScript]: {
                description: "JavaScript (Node.js).",
            },
            [CodingLanguage.TypeScript]: {
                description: "TypeScript.",
            },
            [CodingLanguage.Java]: {
                description: "Java.",
            },
            [CodingLanguage.Cpp]: {
                description: "C++.",
            },
        },
    },
)
