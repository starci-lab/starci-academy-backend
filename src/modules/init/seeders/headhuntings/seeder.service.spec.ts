import {
    HeadhuntingSeederService,
} from "./seeder.service"

describe("HeadhuntingSeederService",
    () => {
        it("skips parsing when the headhunting seeder is disabled",
            async () => {
                const parser = {
                    parseMany: jest.fn(),
                }
                const service = new HeadhuntingSeederService(parser as never,
            parser as never,
            {
                insert: jest.fn(),
            } as never,
            {
                insert: jest.fn(),
            } as never,
            {
                isHeadhuntingSeederEnabled: jest.fn().mockReturnValue(false),
            } as never)

                await service.seed()
                expect(parser.parseMany).not.toHaveBeenCalled()
            })
        it("inserts companies and assigns each parsed consultant to its company",
            async () => {
                const company = {
                    id: "company-1",
                }
                const consultant = {
                    id: "consultant-1",
                }
                const companyParser = {
                    parseMany: jest.fn().mockResolvedValue([{
                        data: company,
                        relativePath: "acme",
                        index: 1,
                    }]),
                }
                const consultantParser = {
                    parseMany: jest.fn().mockResolvedValue([{
                        data: consultant,
                    }]),
                }
                const companyInsert = {
                    insert: jest.fn(),
                }
                const consultantInsert = {
                    insert: jest.fn(),
                }
                const service = new HeadhuntingSeederService(companyParser as never,
            consultantParser as never,
            companyInsert as never,
            consultantInsert as never,
            {
                isHeadhuntingSeederEnabled: jest.fn().mockReturnValue(true),
            } as never)

                await service.seed()

                expect(consultantParser.parseMany).toHaveBeenCalledWith({
                    companyRelativePath: "acme",
                    companyIndex: 1,
                })
                expect(companyInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
                    consultants: [consultant],
                }))
                expect(consultantInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
                    company: {
                        id: "company-1",
                    },
                }))
            })
    })
