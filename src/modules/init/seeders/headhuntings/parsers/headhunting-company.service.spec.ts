import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    HeadhuntingCompanyPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-path-not-found"
import {
    HeadhuntingCompanyParserService,
} from "./headhunting-company.service"

describe("HeadhuntingCompanyParserService",
    () => {
        const paths = [{
            orderIndex: 2,
            displayId: "company",
            relativePath: "2-company",
        }]

        const createSetup = () => {
            const load = jest.fn().mockResolvedValue("markdown")
            const extract = jest.fn().mockReturnValue({
                title: "Company",
                description: "A company",
                websiteUrl: "https://company.test",
            })
            const toRequiredString = jest.fn(
                (value: unknown, fallback: string) => typeof value === "string" ? value : fallback,
            )
            const toNullableStringColumn = jest.fn(
                (value: unknown) => typeof value === "string" ? value : null,
            )
            const generate = jest.fn().mockReturnValue("company-2")
            const winston = {
                log: jest.fn(),
            }
            const service = new HeadhuntingCompanyParserService(
                {
                    extract,
                } as never,
                {
                    toRequiredString,
                    toNullableStringColumn,
                } as never,
                {
                    paths: jest.fn().mockResolvedValue(paths),
                } as never,
                {
                    load,
                } as never,
                {
                    generate,
                } as never,
                winston as never,
            )
            return {
                service,
                load,
                extract,
                generate,
                winston,
            }
        }

        it("rejects an unknown company index",
            async () => {
                const setup = createSetup()

                await expect(setup.service.parse(9,
                    paths))
                    .rejects.toBeInstanceOf(HeadhuntingCompanyPathNotFoundException)
                expect(setup.load).not.toHaveBeenCalled()
            })

        it("maps localized company fields and deterministic identifiers",
            async () => {
                const setup = createSetup()

                const result = await setup.service.parse(2,
                    paths)

                expect(setup.load).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(setup.extract).toHaveBeenCalledTimes(Object.values(Locale).length)
                expect(setup.generate).toHaveBeenCalledWith({
                    companyIndex: 2,
                })
                expect(result).toEqual(expect.objectContaining({
                    id: "company-2",
                    displayId: "company",
                    title: "Company",
                    description: "A company",
                    orderIndex: 2,
                    translations: expect.arrayContaining([
                        expect.objectContaining({
                            companyId: "company-2",
                            field: "title",
                        }),
                        expect.objectContaining({
                            companyId: "company-2",
                            field: "description",
                        }),
                    ]),
                }))
            })

        it("skips and logs a company whose markdown cannot be loaded",
            async () => {
                const setup = createSetup()
                const pathsService = {
                    paths: jest.fn().mockResolvedValue(paths),
                }
                const load = {
                    load: jest.fn().mockRejectedValue(new Error("missing mount file")),
                }
                const service = new HeadhuntingCompanyParserService(
                    {
                        extract: jest.fn(),
                    } as never,
                    {
                        toRequiredString: jest.fn(),
                        toNullableStringColumn: jest.fn(),
                    } as never,
                    pathsService as never,
                    load as never,
                    {
                        generate: jest.fn(),
                    } as never,
                    setup.winston as never,
                )

                await expect(service.parseMany()).resolves.toEqual([])
                expect(setup.winston.log).toHaveBeenCalledTimes(1)
            })
    })
