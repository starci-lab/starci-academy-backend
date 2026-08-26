import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

describe("UuidPartitionPersistProcessorService",
    () => {
        class ExampleEntity {
            id?: string
        }

        it("saves creates, updates, and deletes while emitting sync events",
            async () => {
                const save = jest.fn().mockResolvedValue(undefined)
                const remove = jest.fn().mockResolvedValue(undefined)
                const logSync = jest.fn()
                const processor = new UuidPartitionPersistProcessorService({
                    logSync,
                } as never,
                {
                    save,
                    delete: remove,
                } as never,
                {
                    log: jest.fn(),
                } as never)

                await processor.process({
                    entityClass: ExampleEntity,
                    partition: {
                        createEntities: [{
                            id: "create"
                        }],
                        updateEntities: [{
                            id: "update"
                        }],
                        deleteEntities: [{
                            id: "delete"
                        }],
                    },
                } as never)

                expect(save).toHaveBeenCalledTimes(2)
                expect(remove).toHaveBeenCalledWith(ExampleEntity,
                    ["delete"])
                expect(logSync).toHaveBeenCalledTimes(3)
            })

        it("continues after a failed update and filters invalid delete ids",
            async () => {
                const save = jest.fn()
                    .mockRejectedValueOnce(new Error("stale row"))
                    .mockResolvedValue(undefined)
                const remove = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const processor = new UuidPartitionPersistProcessorService({
                    logSync: jest.fn(),
                } as never,
                {
                    save,
                    delete: remove,
                } as never,
                {
                    log,
                } as never)

                await expect(processor.process({
                    entityClass: ExampleEntity,
                    partition: {
                        createEntities: [],
                        updateEntities: [{
                            id: "bad"
                        },
                        {
                            id: "good"
                        }],
                        deleteEntities: [{
                            id: "valid"
                        },
                        {
                            id: undefined
                        }],
                    },
                } as never)).resolves.toBeUndefined()
                expect(save).toHaveBeenCalledTimes(2)
                expect(remove).toHaveBeenCalledWith(ExampleEntity,
                    ["valid"])
                expect(log).toHaveBeenCalled()
            })
    })
