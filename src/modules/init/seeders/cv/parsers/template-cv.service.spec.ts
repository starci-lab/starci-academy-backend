import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    TemplateCvParserService,
} from "./template-cv.service"

describe("TemplateCvParserService",
    () => {
        it("returns null when the requested template path does not exist",
            async () => {
                const service = new TemplateCvParserService({
                    paths: jest.fn()
                } as never,
            {
                load: jest.fn()
            } as never,
            {
                generate: jest.fn()
            } as never,
            {
                log: jest.fn()
            } as never)
                await expect(service.parse({
                    paths: [], templateIndex: 0
                })).resolves.toBeNull()
            })

        it("parses English content and optional Vietnamese fields",
            async () => {
                const load = jest.fn()
                    .mockResolvedValueOnce(["# title",
                        "Engineer",
                        "# description",
                        "Build things",
                        "# body",
                        "Resume"].join(String.fromCharCode(10)))
                    .mockResolvedValueOnce(["# title",
                        "Localized title",
                        "# body",
                        "Localized body"].join(String.fromCharCode(10)))
                const generate = jest.fn().mockReturnValue("template-id")
                const service = new TemplateCvParserService(
            {
                paths: jest.fn()
            } as never,
            {
                load
            } as never,
            {
                generate
            } as never,
            {
                log: jest.fn()
            } as never,
                )
                const result = await service.parse({
                    paths: [{
                        relativePath: "1-engineer"
                    }] as never,
                    templateIndex: 0,
                })
                expect(generate).toHaveBeenCalledWith({
                    key: "1-engineer"
                })
                expect(load).toHaveBeenNthCalledWith(1,
                    "cv",
                    "1-engineer/en.md")
                expect(load).toHaveBeenNthCalledWith(2,
                    "cv",
                    "1-engineer/vi.md")
                expect(result).toMatchObject({
                    id: "template-id",
                    key: "1-engineer",
                    defaultLocale: Locale.En,
                    orderIndex: 0,
                })
                expect(result?.translations).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        locale: Locale.Vi, field: "title", value: "Localized title"
                    }),
                    expect.objectContaining({
                        locale: Locale.Vi, field: "body", value: "Localized body"
                    }),
                ]))
            })

        it("returns null for missing English content and tolerates missing Vietnamese content",
            async () => {
                const load = jest.fn().mockResolvedValueOnce(null)
                const service = new TemplateCvParserService(
            {
                paths: jest.fn()
            } as never,
            {
                load
            } as never,
            {
                generate: jest.fn().mockReturnValue("id")
            } as never,
            {
                log: jest.fn()
            } as never,
                )
                await expect(service.parse({
                    paths: [{
                        relativePath: "missing"
                    }] as never,
                    templateIndex: 0,
                })).resolves.toBeNull()

                load.mockReset()
                load.mockResolvedValueOnce(["# title",
                    "Only English"].join(String.fromCharCode(10)))
                    .mockRejectedValueOnce(new Error("no vi"))
                const result = await service.parse({
                    paths: [{
                        relativePath: "english-only"
                    }] as never,
                    templateIndex: 0,
                })
                expect(result?.translations).toEqual([])
            })

        it("keeps successful parseMany results and logs malformed entries",
            async () => {
                const paths = jest.fn().mockResolvedValue([
                    {
                        relativePath: "valid", orderIndex: 2
                    },
                    {
                        relativePath: "broken", orderIndex: 3
                    },
                ])
                const log = jest.fn()
                const parse = jest.spyOn(TemplateCvParserService.prototype,
                    "parse")
                    .mockResolvedValueOnce({
                        id: "valid"
                    } as never)
                    .mockRejectedValueOnce(new Error("bad markdown"))
                const service = new TemplateCvParserService(
            {
                paths
            } as never,
            {
                load: jest.fn()
            } as never,
            {
                generate: jest.fn()
            } as never,
            {
                log
            } as never,
                )
                await expect(service.parseMany()).resolves.toEqual([{
                    data: {
                        id: "valid"
                    },
                    index: 2,
                    relativePath: "cv/valid",
                }])
                expect(log).toHaveBeenCalled()
                parse.mockRestore()
            })
    })
