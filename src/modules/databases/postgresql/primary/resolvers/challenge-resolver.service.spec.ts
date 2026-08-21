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
                    submissions: [{
                        title: "Canonical submission title",
                        description: "Canonical submission description",
                        translations: [{
                            locale: Locale.Vi,
                            field: "title",
                            value: "Submission title",
                        },
                        {
                            locale: Locale.Vi,
                            field: "description",
                            value: "Submission description",
                        }],
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
                expect(challenge.submissions[0]).toMatchObject({
                    title: "Translated title",
                    description: "Translated description",
                })
                expect(challenge.submissions[0].translations).toBeUndefined()
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
                    submissions: undefined,
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
                expect(challenge.submissions).toBeUndefined()
                expect(translationResolver.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    fallbackLocale: Locale.Vi,
                }))
            })

        it("retains canonical submission values when translations are absent or empty",
            () => {
                const translationResolver = {
                    resolve: jest.fn().mockReturnValue(""),
                }
                const service = new ChallengeResolverService(translationResolver as never)
                const challenge = {
                    defaultLocale: Locale.En,
                    title: "Title",
                    description: "Description",
                    translations: [],
                    submissions: [{
                        title: "Repository",
                        description: null,
                        translations: [],
                    },
                    {
                        title: "Runbook",
                        description: "Explain the rollback plan",
                        translations: undefined,
                    }],
                }

                service.transform(challenge as never,
                    Locale.Vi,
                    Locale.En)

                expect(challenge.submissions).toEqual([{
                    title: "Repository",
                    description: null,
                },
                {
                    title: "Runbook",
                    description: "Explain the rollback plan",
                }])
            })
    })
