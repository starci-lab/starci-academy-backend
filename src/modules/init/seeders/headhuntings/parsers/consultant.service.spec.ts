import {
    ConsultantParserService
} from "./consultant.service"
import {
    ConsultantPathNotFoundException
} from "@modules/platform/exceptions/errors/courses/consultant-path-not-found"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
describe("ConsultantParserService",
    () => { it("rejects an unknown consultant index",
        async () => { const service = new ConsultantParserService({
            extract: jest.fn()
        } as never,
{
} as never,
{
} as never,
{
} as never,
{
} as never,
{
} as never,
{
    log: jest.fn()
} as never); await expect(service.parse({
            paths: [], consultantIndex: 4, companyIndex: 1
        })).rejects.toThrow(ConsultantPathNotFoundException) })

    it("parses localized fields and falls back sortIndex to orderIndex",
        async () => {
            const paths = [{
                orderIndex: 4,
                relativePath: "4-alice",
                displayId: "alice",
            }]
            const load = jest.fn()
                .mockResolvedValueOnce("en")
                .mockResolvedValueOnce("vi")
            const extract = jest.fn()
                .mockReturnValueOnce({
                    fullName: "Alice localized",
                    jobTitle: null,
                    description: "Builds systems localized",
                })
                .mockReturnValueOnce({
                    fullName: "Alice",
                    jobTitle: "Engineer",
                    description: "Builds systems",
                    linkedinUrl: "https://linkedin.com/in/alice",
                })
            const scalar = {
                toRequiredString: jest.fn((value: unknown, fallback: string) =>
                    typeof value === "string" ? value : fallback),
                toNullableStringColumn: jest.fn((value: unknown) =>
                    typeof value === "string" ? value : null),
            }
            const service = new ConsultantParserService(
                {
                    extract,
                } as never,
                scalar as never,
                {
                } as never,
                {
                    load,
                } as never,
                {
                    generate: jest.fn().mockReturnValue("consultant-4"),
                } as never,
                {
                    generate: jest.fn().mockReturnValue("company-1"),
                } as never,
                {
                    log: jest.fn(),
                } as never,
            )

            const result = await service.parse({
                paths,
                consultantIndex: 4,
                companyIndex: 1,
            })

            expect(result).toEqual(expect.objectContaining({
                id: "consultant-4",
                defaultLocale: Locale.En,
                displayId: "alice",
                fullName: "Alice",
                jobTitle: "Engineer",
                sortIndex: 5,
                company: {
                    id: "company-1",
                },
            }))
            expect(result.translations).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    locale: Locale.En,
                    field: "fullName",
                    value: "Alice",
                }),
                expect.objectContaining({
                    locale: Locale.Vi,
                    field: "fullName",
                    value: "Alice localized",
                }),
            ]))
            expect(load).toHaveBeenNthCalledWith(1,
                "headhuntings",
                "4-alice/vi.md")
        })

    it("keeps valid consultants and logs malformed entries in parseMany",
        async () => {
            const service = new ConsultantParserService(
                {
                } as never,
                {
                } as never,
                {
                    paths: jest.fn().mockResolvedValue([
                        {
                            orderIndex: 1,
                            relativePath: "1-good",
                        },
                        {
                            orderIndex: 2,
                            relativePath: "2-bad",
                        },
                    ]),
                } as never,
                {
                } as never,
                {
                } as never,
                {
                } as never,
                {
                    log: jest.fn(),
                } as never,
            )
            const parse = jest.spyOn(service,
                "parse")
                .mockResolvedValueOnce({
                    id: "good"
                } as never)
                .mockRejectedValueOnce(new Error("bad consultant"))
            const result = await service.parseMany({
                companyRelativePath: "acme",
                companyIndex: 1,
            })

            expect(result).toEqual([{
                data: {
                    id: "good",
                },
                index: 1,
                relativePath: "1-good",
            }])
            expect(parse).toHaveBeenCalledTimes(2)
        })
    })
