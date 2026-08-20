import {
    Locale,
} from "../enums/locale"
import {
    ChallengeResolverService,
} from "./challenge-resolver.service"

const lang = (
    fields: Record<string, unknown>,
) => ({
    defaultLocale: undefined,
    title: "Canonical title",
    body: "Canonical body",
    text: "Canonical text",
    translations: {
        vi: fields 
    },
    ...fields,
})

describe("ChallengeResolverService",
    () => {
        it("resolves challenge and every nested schema-v2 translation with fallback values",
            () => {
                const translationResolver = {
                    resolve: jest.fn((params: { field: string }) => {
                        if (params.field === "title") {
                            return "Translated title"
                        }
                        if (params.field === "description") {
                            return "Translated description"
                        }
                        return params.field === "body" ? "" : "Translated text"
                    }),
                }
                const service = new ChallengeResolverService(translationResolver as never)
                const challenge = {
                    defaultLocale: Locale.En,
                    title: "Original title",
                    description: "Original description",
                    translations: {
                        vi: {
                            title: "Localized title",
                        },
                    },
                    requirements: [{
                        defaultLocale: Locale.En,
                        langs: [lang({
                            title: "Requirement title" 
                        })],
                    }],
                    steps: [{
                        defaultLocale: Locale.En,
                        langs: [lang({
                            title: "Step title" 
                        })],
                    }],
                    outputs: [{
                        defaultLocale: Locale.En,
                        langs: [lang({
                            text: "Output text" 
                        })],
                    }],
                    prerequisites: [{
                        defaultLocale: Locale.En,
                        langs: [lang({
                            text: "Prerequisite text" 
                        })],
                    }],
                }

                service.transform(challenge as never,
                    Locale.Vi,
                    Locale.En)

                expect(challenge.title).toBe("Translated title")
                expect(challenge.description).toBe("Translated description")
                expect(challenge.translations).toBeUndefined()
                expect(challenge.requirements[0].langs[0]).toMatchObject({
                    title: "Translated title",
                    body: "Canonical body",
                })
                expect(challenge.steps[0].langs[0]).toMatchObject({
                    title: "Translated title",
                    body: "Canonical body",
                })
                expect(challenge.outputs[0].langs[0]).toMatchObject({
                    text: "Translated text",
                })
                expect(challenge.prerequisites[0].langs[0]).toMatchObject({
                    text: "Translated text",
                })
                expect(challenge.requirements[0].langs[0].translations).toBeUndefined()
                expect(translationResolver.resolve).toHaveBeenCalled()
            })

        it("uses the parent fallback and leaves absent nested collections untouched",
            () => {
                const translationResolver = {
                    resolve: jest.fn().mockReturnValue("localized"),
                }
                const service = new ChallengeResolverService(translationResolver as never)
                const challenge = {
                    defaultLocale: null,
                    title: "Title",
                    description: "Description",
                    translations: {
                    },
                    requirements: [],
                    steps: undefined,
                    outputs: null,
                    prerequisites: [],
                }

                service.transform(challenge as never,
                    Locale.En,
                    Locale.Vi)

                expect(challenge.title).toBe("localized")
                expect(challenge.description).toBe("localized")
                expect(challenge.requirements).toEqual([])
                expect(challenge.steps).toBeUndefined()
                expect(challenge.outputs).toBeNull()
                expect(challenge.prerequisites).toEqual([])
                expect(translationResolver.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    fallbackLocale: Locale.Vi,
                }))
            })
    })
