import {
    AddIsUatToUsers1787900000000,
} from "./1787900000000-AddIsUatToUsers"

if (typeof describe === "function") {
    describe("AddIsUatToUsers1787900000000",
        () => {
            it("adds an internal UAT marker and cleanup index",
                async () => {
                    const query = jest.fn()
                    await new AddIsUatToUsers1787900000000().up({
                        query 
                    } as never)
                    const sql = query.mock.calls.flat().join("\n")
                    expect(sql).toContain("is_uat")
                    expect(sql).toContain("DEFAULT false")
                    expect(sql).toContain("idx_users_is_uat")
                    expect(sql).toContain("WHERE \"is_uat\" = true")
                })

            it("removes the index before the column",
                async () => {
                    const queries: Array<string> = []
                    const query = jest.fn(async (sql: string) => { queries.push(sql) })
                    await new AddIsUatToUsers1787900000000().down({
                        query 
                    } as never)
                    const sql = queries.join("\n")
                    expect(sql.indexOf("DROP INDEX")).toBeLessThan(sql.indexOf("DROP COLUMN"))
                })
        })
}
