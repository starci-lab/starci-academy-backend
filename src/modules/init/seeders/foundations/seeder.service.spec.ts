import {
    FoundationSeederService,
} from "./seeder.service"

describe("FoundationSeederService",
    () => {
        it("skips all parser and insert work when disabled",
            async () => {
                const parser = {
                    parseMany: jest.fn(),
                }
                const service = new FoundationSeederService(parser as never,
            parser as never,
            {
                insert: jest.fn(),
            } as never,
            {
                insert: jest.fn(),
            } as never,
            {
                isFoundationsSeederEnabled: jest.fn().mockReturnValue(false),
            } as never)

                await service.seed()

                expect(parser.parseMany).not.toHaveBeenCalled()
            })
        it("parses categories, attaches foundations, and inserts each relation",
            async () => {
                const category = {
                    id: "category-1",
                }
                const foundation = {
                    id: "foundation-1",
                }
                const categoryParser = {
                    parseMany: jest.fn().mockResolvedValue([{
                        data: category,
                        relativePath: "basics",
                        index: 2,
                    }]),
                }
                const foundationParser = {
                    parseMany: jest.fn().mockResolvedValue([{
                        data: foundation,
                    }]),
                }
                const categoryInsert = {
                    insert: jest.fn().mockResolvedValue(undefined),
                }
                const foundationInsert = {
                    insert: jest.fn().mockResolvedValue(undefined),
                }
                const service = new FoundationSeederService(categoryParser as never,
            foundationParser as never,
            categoryInsert as never,
            foundationInsert as never,
            {
                isFoundationsSeederEnabled: jest.fn().mockReturnValue(true),
            } as never)

                await service.seed()

                expect(foundationParser.parseMany).toHaveBeenCalledWith({
                    categoryRelativePath: "basics",
                    categoryIndex: 2,
                })
                expect(categoryInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
                    foundations: [foundation],
                }))
                expect(foundationInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
                    id: "foundation-1",
                    category: {
                        id: "category-1",
                    },
                }))
            })
    })
