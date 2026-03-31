import type {
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Locale,
} from "@modules/databases"

/**
 * Get the locale from the cookie.
 * @param context - The execution context.
 * @returns The locale from the cookie.
 */
export const getLocaleFromCookie = (context: ExecutionContext): Locale | undefined => {
    try {
        const gqlContext = GqlExecutionContext.create(context)
        const ctx = gqlContext.getContext()
        const req = ctx?.req

        const cookies = req?.cookies
        const cookieLocale = cookies?.locale

        if (
            typeof cookieLocale === "string" &&
            Object.values(Locale).includes(cookieLocale as Locale)
        ) {
            return cookieLocale as Locale
        }

        const cookieHeader = req?.headers?.cookie
        if (typeof cookieHeader === "string") {
            const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/i)
            if (match?.[1]) {
                const raw = decodeURIComponent(match[1].trim())
                if (Object.values(Locale).includes(raw as Locale)) {
                    return raw as Locale
                }
            }
        }
    } catch {
        //
    }
    return undefined
}

/**
 * Get the locale from the accept language header.
 * @param context - The execution context.
 * @returns The locale from the accept language header.
 */
export const getLocaleFromAcceptLanguage = (context: ExecutionContext): Locale | undefined => {
    try {
        const gqlContext = GqlExecutionContext.create(context)
        const ctx = gqlContext.getContext()
        const req = ctx?.req

        const raw = req?.headers?.["accept-language"]
        if (typeof raw !== "string") return undefined

        const parts = raw.split(",").map((p: string) => p.trim().toLowerCase())

        for (const part of parts) {
            const lang = part.split(";")[0]

            if (lang.startsWith("vi")) return Locale.Vi
            if (lang.startsWith("en")) return Locale.En
        }
    } catch {
        //
    }
    return undefined
}

/**
 * Resolve the locale from the cookie or accept language header.
 * @param context - The execution context.
 * @returns The resolved locale.
 */
export const resolveLocale = (context: ExecutionContext): Locale => {
    return (
        getLocaleFromCookie(context) ??
        getLocaleFromAcceptLanguage(context) ??
        Locale.En
    )
}

