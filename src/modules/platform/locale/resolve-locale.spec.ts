import {
    resolveLocale, getLocaleFromCookie, getLocaleFromAcceptLanguage 
} from "./resolve-locale"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"

jest.mock("@nestjs/graphql",
    () => ({
        registerEnumType: jest.fn(),
        GqlExecutionContext: {
            create: (context: unknown) => ({
                getContext: () => context 
            }) 
        } 
    }))

const context = (req: Record<string, unknown>) => ({
    req 
} as never)
describe("resolveLocale",
    () => {
        it("prefers valid header/cookie and parses raw cookie",
            () => {
                expect(getLocaleFromCookie(context({
                    headers: {
                        "x-locale": "vi" 
                    }, cookies: {
                        LOCALE: "en" 
                    } 
                }))).toBe(Locale.Vi)
                expect(getLocaleFromCookie(context({
                    headers: {
                        cookie: "foo=x; locale=vi" 
                    } 
                }))).toBe(Locale.Vi)
            })
        it("uses accept-language then English fallback",
            () => {
                expect(getLocaleFromAcceptLanguage(context({
                    headers: {
                        "accept-language": "fr,vi;q=.8" 
                    } 
                }))).toBe(Locale.Vi)
                expect(resolveLocale(context({
                    headers: {
                    } 
                }))).toBe(Locale.En)
            })
    })
