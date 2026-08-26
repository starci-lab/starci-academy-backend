import {
    ContentResolverService
} from "./content-resolver.service"
import {
    Locale
} from "../enums/locale"

describe("ContentResolverService",
    () => {
        interface TranslationRequest {
            field: string
        }
        it("resolves fields, removes translations, and transforms nested resources",
            () => {
                const translationResolver = {
                    resolve: jest.fn(({ field }: TranslationRequest) => `${field}-value`)
                }
                const challengeResolver = {
                    transform: jest.fn()
                }
                const codeExplainingResolver = {
                    transform: jest.fn()
                }
                const codeImplementationResolver = {
                    transform: jest.fn()
                }
                const service = new ContentResolverService(translationResolver as never,
challengeResolver as never,
codeExplainingResolver as never,
codeImplementationResolver as never)
                const content: {
                    title?: string
                    description?: string
                    body?: string
                    translations?: unknown[]
                    challenges: object[]
                    codeExplainings: object[]
                    codeImplementations: object[]
                    defaultLocale: Locale
                } = {
                    translations: [], challenges: [{
                    }], codeExplainings: [{
                    }], codeImplementations: [{
                    }], defaultLocale: Locale.En
                }
                service.transform(content as never,
                    Locale.En,
                    Locale.En)
                expect(content.title).toBe("title-value")
                expect(content.description).toBe("description-value")
                expect(content.body).toBe("body-value")
                expect(content.translations).toBeUndefined()
                expect(challengeResolver.transform).toHaveBeenCalled()
                expect(codeExplainingResolver.transform).toHaveBeenCalled()
                expect(codeImplementationResolver.transform).toHaveBeenCalled()
            })

        it("uses the caller fallback locale and tolerates absent nested collections",
            () => {
                const resolve = jest.fn().mockReturnValue("resolved")
                const service = new ContentResolverService(
                    {
                        resolve
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                )
                const content = {
                    defaultLocale: undefined,
                    translations: undefined,
                    challenges: undefined,
                    codeExplainings: undefined,
                    codeImplementations: undefined,
                }

                expect(() => service.transform(content as never,
                    Locale.Vi,
                    Locale.En)).not.toThrow()
                expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
                    locale: Locale.Vi,
                    fallbackLocale: Locale.En,
                }))
                expect(content).not.toHaveProperty("translations")
            })
    })
