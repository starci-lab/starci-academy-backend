import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/** Supported locales for translations. */
export enum Locale {
    /** Serve Vietnamese copy; missing Vi falls through to `fallbackLocale`. */
    Vi = "vi",
    /** Serve English copy; also the usual `defaultLocale` / fallback. */
    En = "en",
}

/**
 * GraphQL type for the locale enum.
 */
export const GraphQLTypeLocale = createEnumType(Locale)

/**
 * Register the locale enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeLocale, 
    {
        name: "Locale",
        description: "Supported locales for translations.",
        valuesMap: {
            [Locale.Vi]: {
                description: "Vietnamese locale.",
            },
            [Locale.En]: {
                description: "English locale.",
            },
        },
    }
)