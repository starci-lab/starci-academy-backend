import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    createHash,
} from "crypto"
import {
    MockFileTooLargeException,
    MockInvalidUploadRequestException,
    MockResourceNotFoundException,
    MockUploadOffsetConflictException,
} from "@modules/platform/exceptions/errors/mock/file-upload"
import {
    FileStoreService,
} from "./file-store.service"

/** Per-object byte cap the service enforces (presigned PUT + tus total length). */
const MAX_OBJECT_BYTES = 10 * 1024 * 1024

/** Total byte cap across all chunks of one chunked-upload session. */
const MAX_CHUNK_SESSION_BYTES = 25 * 1024 * 1024

/** Fixed chunk size the chunked-upload client slices by. */
const CHUNK_SIZE = 256 * 1024

/** How often the background eviction loop runs. */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

/** One minute in milliseconds, for readable timer advances. */
const ONE_MINUTE_MS = 60 * 1000

describe("FileStoreService",
    () => {
        let module: TestingModule
        let service: FileStoreService

        beforeEach(async () => {
            module = await Test.createTestingModule({
                providers: [
                    FileStoreService,
                ],
            }).compile()

            service = module.get<FileStoreService>(FileStoreService)
        })

        afterEach(async () => {
            // always stop the loop so a fake-timer test cannot leak into the next one
            service.onModuleDestroy()
            jest.useRealTimers()
            await module.close()
        })

        describe("object keys",
            () => {
                it("namespaces the key, keeps a recognisable name and strips unsafe characters",
                    () => {
                        const key = service.generateObjectKey("../my report (final).PDF")

                        expect(key).toMatch(
                            /^uploads\/[0-9a-f-]{36}-\.\._my_report__final_\.PDF$/,
                        )
                    })

                it("falls back to `file` when the name sanitises away to nothing",
                    () => {
                        const key = service.generateObjectKey("")

                        expect(key).toMatch(/^uploads\/[0-9a-f-]{36}-file$/)
                    })

                it("never collides for two uploads of the same filename",
                    () => {
                        const first = service.generateObjectKey("cv.pdf")
                        const second = service.generateObjectKey("cv.pdf")

                        expect(first).not.toBe(second)
                    })
            })

        describe("presigned objects",
            () => {
                it("stores the bytes and replays them with their content type on read",
                    () => {
                        const buffer = Buffer.from("hello world")

                        service.putObject("uploads/k1",
                            buffer,
                            "text/plain",
                            "greeting.txt")

                        expect(service.getObject("uploads/k1")).toMatchObject({
                            buffer,
                            contentType: "text/plain",
                            filename: "greeting.txt",
                        })
                    })

                it("refuses an object above the 10MB cap and retains nothing",
                    () => {
                        const tooBig = Buffer.alloc(MAX_OBJECT_BYTES + 1)

                        expect(() => service.putObject("uploads/big",
                            tooBig,
                            "application/octet-stream",
                            "big.bin")).toThrow(MockFileTooLargeException)
                        // the rejected write left no entry behind
                        expect(() => service.getObject("uploads/big"))
                            .toThrow(MockResourceNotFoundException)
                    })

                it("accepts an object sitting exactly on the cap",
                    () => {
                        const exact = Buffer.alloc(MAX_OBJECT_BYTES)

                        service.putObject("uploads/exact",
                            exact,
                            "application/octet-stream",
                            "exact.bin")

                        expect(service.getObject("uploads/exact").buffer).toHaveLength(
                            MAX_OBJECT_BYTES,
                        )
                    })

                it("throws a not-found for an unknown key",
                    () => {
                        expect(() => service.getObject("uploads/missing"))
                            .toThrow(MockResourceNotFoundException)
                    })
            })

        describe("chunked uploads",
            () => {
                it("derives the chunk count by ceiling the declared size against the chunk size",
                    () => {
                        const result = service.initChunkSession("video.mp4",
                            CHUNK_SIZE + 1)

                        expect(result.chunkSize).toBe(CHUNK_SIZE)
                        // a trailing partial chunk still counts
                        expect(result.totalChunks).toBe(2)
                        expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/)
                    })

                it("always asks for at least one chunk for a tiny file",
                    () => {
                        expect(service.initChunkSession("tiny.txt",
                            1).totalChunks).toBe(1)
                    })

                it("refuses a session declaring more than the 25MB total cap",
                    () => {
                        expect(() => service.initChunkSession("huge.bin",
                            MAX_CHUNK_SESSION_BYTES + 1))
                            .toThrow(MockFileTooLargeException)
                    })

                it("refuses a non-finite declared size",
                    () => {
                        expect(() => service.initChunkSession("nan.bin",
                            Number.NaN))
                            .toThrow(MockInvalidUploadRequestException)
                    })

                it("refuses a zero or negative declared size",
                    () => {
                        expect(() => service.initChunkSession("empty.bin",
                            0))
                            .toThrow(MockInvalidUploadRequestException)
                        expect(() => service.initChunkSession("negative.bin",
                            -5))
                            .toThrow(MockInvalidUploadRequestException)
                    })

                it("reports received and missing indexes so a client can resume",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("doc.pdf",
                            CHUNK_SIZE * 3)

                        service.putChunk(sessionId,
                            0,
                            Buffer.from("a"))
                        service.putChunk(sessionId,
                            2,
                            Buffer.from("c"))

                        expect(service.getChunkStatus(sessionId)).toEqual({
                            sessionId,
                            totalChunks: 3,
                            chunkSize: CHUNK_SIZE,
                            received: [
                                0,
                                2,
                            ],
                            missing: [
                                1,
                            ],
                            finalized: false,
                        })
                    })

                it("rejects a chunk index that is fractional, negative, or past the last chunk",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("doc.pdf",
                            CHUNK_SIZE)

                        expect(() => service.putChunk(sessionId,
                            1.5,
                            Buffer.from("x")))
                            .toThrow(MockInvalidUploadRequestException)
                        expect(() => service.putChunk(sessionId,
                            -1,
                            Buffer.from("x")))
                            .toThrow(MockInvalidUploadRequestException)
                        // totalChunks is 1, so index 1 is one past the end
                        expect(() => service.putChunk(sessionId,
                            1,
                            Buffer.from("x")))
                            .toThrow(MockInvalidUploadRequestException)
                    })

                it("replaces a re-sent chunk rather than double-counting its bytes",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("doc.pdf",
                            CHUNK_SIZE)

                        service.putChunk(sessionId,
                            0,
                            Buffer.from("first"))
                        // a retried chunk overwrites the earlier bytes at the same index
                        service.putChunk(sessionId,
                            0,
                            Buffer.from("second"))

                        expect(service.finalizeChunkSession(sessionId)).toMatchObject({
                            size: "second".length,
                        })
                    })

                it("refuses a chunk that would push the session past its total byte cap",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("huge.bin",
                            MAX_CHUNK_SESSION_BYTES)

                        expect(() => service.putChunk(sessionId,
                            0,
                            Buffer.alloc(MAX_CHUNK_SESSION_BYTES + 1)))
                            .toThrow(MockFileTooLargeException)
                    })

                it("assembles chunks strictly in index order and hashes the result",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("doc.pdf",
                            CHUNK_SIZE * 3)

                        // deliberately stored out of order -- finalize must re-order
                        service.putChunk(sessionId,
                            2,
                            Buffer.from("C"))
                        service.putChunk(sessionId,
                            0,
                            Buffer.from("A"))
                        service.putChunk(sessionId,
                            1,
                            Buffer.from("B"))

                        const result = service.finalizeChunkSession(sessionId)

                        expect(result).toEqual({
                            filename: "doc.pdf",
                            size: 3,
                            sha256: createHash("sha256").update(Buffer.from("ABC")).digest("hex"),
                            path: `uploads/${sessionId}/doc.pdf`,
                        })
                        // the session now reports itself finalized
                        expect(service.getChunkStatus(sessionId).finalized).toBe(true)
                    })

                it("refuses to finalize while chunks are still missing, naming the shortfall",
                    () => {
                        const {
                            sessionId,
                        } = service.initChunkSession("doc.pdf",
                            CHUNK_SIZE * 3)

                        service.putChunk(sessionId,
                            0,
                            Buffer.from("A"))

                        expect(() => service.finalizeChunkSession(sessionId))
                            .toThrow(MockInvalidUploadRequestException)
                        // the shortfall is reported in the exception metadata, so a
                        // resuming client is told how many chunks are still outstanding
                        try {
                            service.finalizeChunkSession(sessionId)
                        } catch (error) {
                            expect((error as MockInvalidUploadRequestException).metadata)
                                .toMatchObject({
                                    reason: "Cannot finalize: 2 chunk(s) missing",
                                })
                        }
                        expect.assertions(2)
                    })

                it("throws a not-found for an unknown session id",
                    () => {
                        expect(() => service.getChunkStatus("nope"))
                            .toThrow(MockResourceNotFoundException)
                    })
            })

        describe("tus uploads",
            () => {
                it("creates a slot that starts empty and echoes the declared length and metadata",
                    () => {
                        const id = service.createTusUpload(11,
                            "filename dGVzdA==")

                        expect(id).toMatch(/^[0-9a-f-]{36}$/)
                        expect(service.getTusUpload(id)).toMatchObject({
                            length: 11,
                            metadata: "filename dGVzdA==",
                        })
                        expect(service.getTusUpload(id).buffer).toHaveLength(0)
                    })

                it("refuses a non-finite or negative declared length",
                    () => {
                        expect(() => service.createTusUpload(Number.POSITIVE_INFINITY,
                            ""))
                            .toThrow(MockInvalidUploadRequestException)
                        expect(() => service.createTusUpload(-1,
                            ""))
                            .toThrow(MockInvalidUploadRequestException)
                    })

                it("refuses a declared length above the 10MB cap",
                    () => {
                        expect(() => service.createTusUpload(MAX_OBJECT_BYTES + 1,
                            ""))
                            .toThrow(MockFileTooLargeException)
                    })

                it("appends sequential patches and advances the offset each time",
                    () => {
                        const id = service.createTusUpload(6,
                            "")

                        expect(service.appendTus(id,
                            0,
                            Buffer.from("abc"))).toBe(3)
                        expect(service.appendTus(id,
                            3,
                            Buffer.from("def"))).toBe(6)
                        expect(service.getTusUpload(id).buffer.toString()).toBe("abcdef")
                    })

                it("rejects a patch whose offset does not match the current byte count",
                    () => {
                        const id = service.createTusUpload(10,
                            "")
                        service.appendTus(id,
                            0,
                            Buffer.from("abc"))

                        expect(() => service.appendTus(id,
                            0,
                            Buffer.from("xyz")))
                            .toThrow(MockUploadOffsetConflictException)
                        // the conflicting patch changed nothing
                        expect(service.getTusUpload(id).buffer.toString()).toBe("abc")
                    })

                it("rejects a patch that would overrun the declared length",
                    () => {
                        const id = service.createTusUpload(4,
                            "")

                        expect(() => service.appendTus(id,
                            0,
                            Buffer.from("toolong")))
                            .toThrow(MockInvalidUploadRequestException)
                    })

                it("throws a not-found for an unknown upload id",
                    () => {
                        expect(() => service.getTusUpload("nope"))
                            .toThrow(MockResourceNotFoundException)
                        expect(() => service.appendTus("nope",
                            0,
                            Buffer.alloc(0)))
                            .toThrow(MockResourceNotFoundException)
                    })
            })

        describe("idle eviction",
            () => {
                it("evicts entries idle past the TTL across all three collections, keeping recent ones",
                    () => {
                        jest.useFakeTimers()
                        service.onModuleInit()

                        // ─ old generation, created at T0
                        service.putObject("uploads/old",
                            Buffer.from("old"),
                            "text/plain",
                            "old.txt")
                        const oldSession = service.initChunkSession("old.bin",
                            CHUNK_SIZE).sessionId
                        const oldTus = service.createTusUpload(4,
                            "")

                        // 25 minutes pass. Nothing is read in between -- a read would bump
                        // the idle clock and defeat what this test is checking.
                        jest.advanceTimersByTime(25 * ONE_MINUTE_MS)

                        // ─ new generation, created at T0+25m
                        service.putObject("uploads/new",
                            Buffer.from("new"),
                            "text/plain",
                            "new.txt")
                        const newSession = service.initChunkSession("new.bin",
                            CHUNK_SIZE).sessionId
                        const newTus = service.createTusUpload(4,
                            "")

                        // 10 more minutes: now the T0 generation is past the 30m TTL
                        jest.advanceTimersByTime(10 * ONE_MINUTE_MS)

                        expect(() => service.getObject("uploads/old"))
                            .toThrow(MockResourceNotFoundException)
                        expect(() => service.getChunkStatus(oldSession))
                            .toThrow(MockResourceNotFoundException)
                        expect(() => service.getTusUpload(oldTus))
                            .toThrow(MockResourceNotFoundException)

                        // the younger generation survived the same sweep
                        expect(service.getObject("uploads/new").filename).toBe("new.txt")
                        expect(service.getChunkStatus(newSession).sessionId).toBe(newSession)
                        expect(service.getTusUpload(newTus).length).toBe(4)
                    })

                it("keeps an actively-read entry alive by bumping its idle clock",
                    () => {
                        jest.useFakeTimers()
                        service.onModuleInit()

                        service.putObject("uploads/hot",
                            Buffer.from("hot"),
                            "text/plain",
                            "hot.txt")

                        // read it every 20 minutes so it never goes 30 minutes idle
                        jest.advanceTimersByTime(20 * ONE_MINUTE_MS)
                        service.getObject("uploads/hot")
                        jest.advanceTimersByTime(20 * ONE_MINUTE_MS)
                        service.getObject("uploads/hot")
                        jest.advanceTimersByTime(20 * ONE_MINUTE_MS)

                        expect(service.getObject("uploads/hot").filename).toBe("hot.txt")
                    })

                it("stops the cleanup loop on shutdown and tolerates a second shutdown",
                    () => {
                        jest.useFakeTimers()
                        service.onModuleInit()
                        service.putObject("uploads/kept",
                            Buffer.from("kept"),
                            "text/plain",
                            "kept.txt")

                        service.onModuleDestroy()
                        // no timer is left scheduled, so nothing sweeps after shutdown
                        expect(jest.getTimerCount()).toBe(0)

                        jest.advanceTimersByTime(60 * ONE_MINUTE_MS)
                        // long past the TTL, but the loop is stopped -> the entry survives
                        expect(service.getObject("uploads/kept").filename).toBe("kept.txt")

                        // a second destroy is a no-op rather than a crash
                        expect(() => service.onModuleDestroy()).not.toThrow()
                    })

                it("schedules the sweep on the configured interval once initialised",
                    () => {
                        jest.useFakeTimers()

                        expect(jest.getTimerCount()).toBe(0)
                        service.onModuleInit()
                        expect(jest.getTimerCount()).toBe(1)

                        // the loop is periodic: it is still armed after the first pass
                        jest.advanceTimersByTime(CLEANUP_INTERVAL_MS)
                        expect(jest.getTimerCount()).toBe(1)
                    })
            })
    })
