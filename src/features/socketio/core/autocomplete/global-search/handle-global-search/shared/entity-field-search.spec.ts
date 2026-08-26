import {
    searchEntityByFields
} from "./entity-field-search"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

describe("searchEntityByFields",
    () => {
        const utils = {
            cleanDisplayText: jest.fn((text: string) => text.replace(/<em>|<\/em>/g,
                "")), buildShortSnippet: jest.fn((text: string) => text)
        }
        it("maps highlighted title/extra fields and builds the configured query",
            async () => {
                const client = {
                    search: jest.fn().mockResolvedValue({
                        hits: {
                            hits: [{
                                _id: "hit", _source: {
                                    id: "id", displayId: "slug", title: "Title"
                                }, highlight: {
                                    title: ["<em>Title</em>"], body: ["body"]
                                }
                            }]
                        }
                    })
                }
                const elasticsearch = {
                    indicateName: jest.fn().mockReturnValue("idx"), client
                }
                await expect(searchEntityByFields(elasticsearch as never,
utils as never,
"Entity",
{
    term: "title", size: 5, locale: Locale.En
},
{
    extraFields: ["body^2"], fallbackField: "body"
})).resolves.toEqual([{
                    id: "id", displayId: "slug", title: "Title", texts: ["Title",
                        "body"]
                }])
                expect(client.search).toHaveBeenCalledWith(expect.objectContaining({
                    index: "idx", size: 5, _source: expect.arrayContaining(["body"])
                }))
            })
        it("uses description, then fallback field, when no highlights exist",
            async () => {
                const client = {
                    search: jest.fn().mockResolvedValue({
                        hits: {
                            hits: [{
                                _source: {
                                    title: "Title", description: "Description"
                                }, highlight: {
                                }
                            },
                            {
                                _source: {
                                    title: "Title", body: "Body"
                                }, highlight: {
                                }
                            }]
                        }
                    })
                }
                const result = await searchEntityByFields({
                    indicateName: jest.fn().mockReturnValue("idx"), client
                } as never,
utils as never,
"Entity",
{
    term: "x", size: 2, locale: Locale.Vi
},
{
    fallbackField: "body"
})
                expect(result[0].texts).toEqual(["Description"])
                expect(result[1].texts).toEqual(["Body"])
            })
    })
