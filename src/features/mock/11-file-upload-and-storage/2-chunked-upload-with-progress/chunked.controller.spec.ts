import {
    ChunkedController
} from "./chunked.controller"

describe("ChunkedController",
    () => {
        it("delegates init, status, and finalize operations",
            () => {
                const store = {
                    initChunkSession: jest.fn().mockReturnValue({
                        id: "u1", chunkSize: 1
                    }),
                    getChunkStatus: jest.fn().mockReturnValue({
                        received: [0], missing: [1]
                    }),
                    finalizeChunkSession: jest.fn().mockReturnValue({
                        key: "done"
                    }),
                }
                const controller = new ChunkedController(store as never)

                expect(controller.init({
                    filename: "video.mp4", size: 2
                })).toEqual({
                    id: "u1", chunkSize: 1
                })
                expect(controller.status("u1")).toEqual({
                    received: [0], missing: [1]
                })
                expect(controller.finalize("u1")).toEqual({
                    key: "done"
                })
                expect(store.initChunkSession).toHaveBeenCalledWith("video.mp4",
                    2)
                expect(store.getChunkStatus).toHaveBeenCalledWith("u1")
                expect(store.finalizeChunkSession).toHaveBeenCalledWith("u1")
            })

        it("reads and stores a raw chunk at the requested index",
            async () => {
                const putChunk = jest.fn()
                const controller = new ChunkedController({
                    putChunk
                } as never)
                const request = {
                    on: (event: string, listener: (value?: Buffer) => void) => {
                        if (event === "data") listener(Buffer.from("part"))
                        if (event === "end") listener()
                        return request
                    },
                }
                await controller.patchChunk("u1",
                    3,
request as never)

                expect(putChunk).toHaveBeenCalledWith("u1",
                    3,
                    Buffer.from("part"))
            })
    })
