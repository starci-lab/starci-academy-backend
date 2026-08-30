import {
    AddPlaygroundPreviewImageToCourses1788000000000,
} from "./1788000000000-AddPlaygroundPreviewImageToCourses"

if (typeof describe === "function") {
    describe("AddPlaygroundPreviewImageToCourses1788000000000",
        () => {
            it("adds one nullable Playground preview URL to courses",
                async () => {
                    const query = jest.fn()
                    await new AddPlaygroundPreviewImageToCourses1788000000000().up({
                        query,
                    } as never)
                    const sql = query.mock.calls.flat().join("\n")
                    expect(sql).toContain("playground_preview_image_url")
                    expect(sql).toContain("varchar(2048)")
                    expect(sql).not.toContain("NOT NULL")
                })

            it("removes only the Playground preview column",
                async () => {
                    const query = jest.fn()
                    await new AddPlaygroundPreviewImageToCourses1788000000000().down({
                        query,
                    } as never)
                    const sql = query.mock.calls.flat().join("\n")
                    expect(sql).toContain("DROP COLUMN IF EXISTS")
                    expect(sql).toContain("playground_preview_image_url")
                })
        })
}
