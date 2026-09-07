import {
    AddLocaleToMockInterviewSessions1788100000000,
} from "./1788100000000-AddLocaleToMockInterviewSessions"

describe("AddLocaleToMockInterviewSessions1788100000000",
    () => {
        it("adds and removes the durable grading locale",
            async () => {
                const query = jest.fn().mockResolvedValue(undefined)
                const migration = new AddLocaleToMockInterviewSessions1788100000000()

                await migration.up({
                    query
                } as never)
                await migration.down({
                    query
                } as never)

                expect(query).toHaveBeenNthCalledWith(1,
                    expect.stringContaining("ADD COLUMN IF NOT EXISTS \"locale\""))
                expect(query).toHaveBeenNthCalledWith(2,
                    expect.stringContaining("DROP COLUMN IF EXISTS \"locale\""))
            })
    })
