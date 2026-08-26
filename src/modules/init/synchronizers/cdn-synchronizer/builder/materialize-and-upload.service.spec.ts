import {
    MaterializeAndUploadService
} from "./materialize-and-upload.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"

describe("MaterializeAndUploadService",
    () => {
        const upload = {
            json: jest.fn().mockResolvedValue(undefined)
        }
        const asyncService = {
            allMustDone: jest.fn().mockResolvedValue(undefined)
        }
        const logger = {
            log: jest.fn()
        }
        const superJson = {
            stringify: jest.fn((value: unknown) => JSON.stringify(value))
        }
        const service = new MaterializeAndUploadService(upload as never,
asyncService as never,
logger as never,
superJson as never)
        beforeEach(() => jest.clearAllMocks())

        it("uploads primary and display-id keys and emits contextual progress logs",
            async () => {
                const entity = {
                    id: "id-1", displayId: "display-1", title: "Course"
                }
                await service.process([{
                    entity, locale: Locale.En
                }],
                (id, locale) => `${locale}/${id}`,
                {
                    entityKind: "course", entityId: "id-1"
                })
                expect(upload.json).toHaveBeenCalledTimes(2)
                expect(asyncService.allMustDone).toHaveBeenCalledTimes(1)
                expect(logger.log).toHaveBeenCalledTimes(2)
            })

        it("only uploads the id key when displayId is absent",
            async () => {
                await service.process([{
                    entity: {
                        id: "id-2"
                    }, locale: Locale.En
                }],
                (id) => id)
                expect(upload.json).toHaveBeenCalledTimes(1)
                expect(logger.log).not.toHaveBeenCalled()
            })
    })
