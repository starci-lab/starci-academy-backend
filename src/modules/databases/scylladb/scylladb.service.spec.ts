import {
    ScyllaDBService,
} from "./scylladb.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(() => ({
            databases: {
                scylladb: {
                    keyspace: "app_data"
                }
            }
        })),
    }))

describe("ScyllaDBService",
    () => {
        const client = {
            execute: jest.fn()
        }
        const service = new ScyllaDBService(client as never)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("creates a table once, upserts JSON, and reads valid payloads",
            async () => {
                client.execute.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined)
                await service.upsertLocalizedDocument("docs",
                    "1",
                    "en",
                    {
                        title: "Hello"
                    })
                expect(client.execute).toHaveBeenNthCalledWith(1,
                    expect.stringContaining("CREATE TABLE IF NOT EXISTS app_data.docs"))
                expect(client.execute).toHaveBeenNthCalledWith(2,
                    expect.stringContaining("INSERT INTO app_data.docs"),
                    ["1",
                        "en",
                        JSON.stringify({
                            title: "Hello"
                        })],
                    {
                        prepare: true
                    })

                client.execute.mockResolvedValueOnce({
                    rows: [
                        {
                            get: () => JSON.stringify({
                                id: 1
                            })
                        },
                        {
                            get: () => "not-json"
                        },
                        {
                            get: () => null
                        },
                    ]
                })
                await expect(service.findLocalizedDocuments("docs",
                    "en")).resolves.toEqual([{
                    id: 1
                }])
            })

        it("rejects unsafe identifiers before querying the database",
            async () => {
                await expect(service.findLocalizedDocuments("docs;drop",
                    "en")).rejects.toThrow("Invalid Scylla identifier")
                expect(client.execute).not.toHaveBeenCalled()
            })
    })
