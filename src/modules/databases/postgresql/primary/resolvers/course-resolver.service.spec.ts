import {
    CourseResolverService
} from "./course-resolver.service"
import {
    Locale
} from "../enums/locale"

describe("CourseResolverService",
    () => {
        it("translates the course and all populated nested collections in place",
            () => {
                const translate = {
                    resolve: jest.fn((params: { field: string }) => `translated-${params.field}`),
                }
                const make = {
                    transform: jest.fn()
                }
                const service = new CourseResolverService(
      translate as never,
      make as never,
      make as never,
      make as never,
      make as never,
      make as never,
      make as never,
                )
                const course = {
                    defaultLocale: Locale.En,
                    translations: {
                    },
                    prerequisites: [{
                    }],
                    valuePropositions: [{
                    }],
                    qnas: [{
                    }],
                    livestreamSessions: [{
                    }],
                    modules: [{
                        translations: {
                        }, contents: [{
                        }], previewContents: [{
                        }]
                    }],
                } as unknown as Parameters<CourseResolverService["transform"]>[0]
                expect(service.transform(course,
                    Locale.Vi)).toBe(course)
                expect(course).toMatchObject({
                    title: "translated-title",
                    description: "translated-description",
                    modules: [
                        {
                            title: "translated-title", description: "translated-description"
                        },
                    ],
                })
                expect(course.translations).toBeUndefined()
                expect(course.modules[0].translations).toBeUndefined()
                expect(make.transform).toHaveBeenCalledTimes(6)
            })
        it("leaves absent and empty relation collections safe",
            () => {
                const translate = {
                    resolve: jest.fn().mockReturnValue("value")
                }
                const service = new CourseResolverService(
      translate as never,
      {
          transform: jest.fn()
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
      {
          transform: jest.fn()
      } as never,
      {
          transform: jest.fn()
      } as never,
                )
                const course = {
                    defaultLocale: Locale.En,
                    translations: [],
                    prerequisites: [],
                    valuePropositions: undefined,
                    qnas: null,
                    modules: [],
                } as unknown as Parameters<CourseResolverService["transform"]>[0]
                expect(service.transform(course,
                    Locale.En)).toBe(course)
                expect(course.title).toBe("value")
            })

        it("keeps already translated values when no translation row exists",
            () => {
                const service = new CourseResolverService(
                    {
                        resolve: jest.fn().mockReturnValue(undefined),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                    {
                        transform: jest.fn(),
                    } as never,
                )
                const course = {
                    defaultLocale: Locale.En,
                    title: "Existing title",
                    description: "Existing description",
                    translations: [],
                    prerequisites: [],
                    valuePropositions: [],
                    qnas: [],
                    livestreamSessions: [],
                    modules: [],
                } as never

                expect(service.transform(
                    course,
                    Locale.Vi,
                )).toBe(course)
                const translatedFields = course as unknown as {
                    title?: string
                    description?: string
                }
                expect(translatedFields.title).toBeUndefined()
                expect(translatedFields.description).toBeUndefined()
            })

        it("does not invoke nested transformers for absent relations",
            () => {
                const transform = jest.fn()
                const service = new CourseResolverService(
                    {
                        resolve: jest.fn().mockReturnValue("title"),
                    } as never,
                    {
                        transform
                    } as never,
                    {
                        transform
                    } as never,
                    {
                        transform
                    } as never,
                    {
                        transform
                    } as never,
                    {
                        transform
                    } as never,
                    {
                        transform
                    } as never,
                )
                const course = {
                    defaultLocale: Locale.En,
                    translations: [],
                } as never

                expect(service.transform(course,
                    Locale.En)).toBe(course)
                expect(transform).not.toHaveBeenCalled()
            })
    })
