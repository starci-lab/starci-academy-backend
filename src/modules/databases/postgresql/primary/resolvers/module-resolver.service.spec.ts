import {
    ModuleResolverService
} from "./module-resolver.service"
import {
    Locale
} from "../enums/locale"
describe("ModuleResolverService",
    () => {
        interface TranslationRequest {
            field: string
        }
        it("resolves module fields and delegates nested collections",
            () => {
                const translation = {
                    resolve: jest.fn(({ field }: TranslationRequest) => `${field}-text`)
                }
                const content = {
                    transform: jest.fn()
                }; const preview = {
                    transform: jest.fn()
                }
                const service = new ModuleResolverService(translation as never,
content as never,
preview as never)
                const moduleEntity = {
                    translations: [], contents: [{
                    }], previewContents: [{
                    }], defaultLocale: Locale.En
                }
                service.transform(moduleEntity as never,
                    Locale.En)
                expect(moduleEntity).toMatchObject({
                    title: "title-text", description: "description-text"
                })
                expect(content.transform).toHaveBeenCalled(); expect(preview.transform).toHaveBeenCalled()
                expect(moduleEntity.translations).toBeUndefined()
            })
    })
