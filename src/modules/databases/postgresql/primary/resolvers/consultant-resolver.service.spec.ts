import {
    Locale,
} from "../enums/locale"
import {
    ConsultantResolverService,
} from "./consultant-resolver.service"

interface TranslationResolveRequest {
    field: string
}

describe("ConsultantResolverService",
    () => {
        it("resolves consultant fields and nested company using the requested locale",
            () => {
                const resolve = jest.fn(({ field }: TranslationResolveRequest) => `${field}-resolved`)
                const companyTransform = jest.fn()
                const consultant = {
                    defaultLocale: undefined,
                    translations: [{
                        field: "fullName",
                        value: "Name",
                    }],
                    company: {
                        id: "company-1",
                    },
                }
                const service = new ConsultantResolverService(
                    {
                        resolve
                    } as never,
                    {
                        transform: companyTransform
                    } as never,
                )

                service.transform(consultant as never,
                    Locale.Vi,
                    Locale.En)

                expect(resolve).toHaveBeenCalledTimes(3)
                expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
                    field: "fullName",
                    locale: Locale.Vi,
                    fallbackLocale: Locale.En,
                }))
                expect(consultant).toEqual(expect.objectContaining({
                    fullName: "fullName-resolved",
                    jobTitle: "jobTitle-resolved",
                    description: "description-resolved",
                }))
                expect(companyTransform).toHaveBeenCalledWith(consultant.company,
                    Locale.Vi)
                expect(consultant).not.toHaveProperty("translations")
            })

        it("falls back to English when neither consultant nor company locale is set",
            () => {
                const resolve = jest.fn().mockReturnValue("")
                const service = new ConsultantResolverService(
                    {
                        resolve
                    } as never,
                    {
                        transform: jest.fn()
                    } as never,
                )
                const consultant = {
                    defaultLocale: null,
                    translations: [],
                }

                service.transform(consultant as never,
                    Locale.En)

                expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
                    fallbackLocale: Locale.En,
                }))
            })
    })
