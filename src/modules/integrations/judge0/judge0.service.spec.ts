import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    Judge0RequestFailedException,
    Judge0TimedOutException,
} from "@modules/exceptions"
import {
    Judge0Service,
} from "./judge0.service"
import {
    WinstonService,
} from "@modules/winston"
import {
    Judge0StatusId,
} from "./enums"
import type {
    Judge0SubmissionInput,
} from "./types"

// the service reads its auth token lazily from the mount file via this helper;
// stub it (keeping the rest of the real barrel intact) so no real fs is touched
jest.mock("@modules/filesystem",
    () => ({
        ...jest.requireActual("@modules/filesystem"),
        getJudge0AuthToken: jest.fn(() => "test-auth-token"),
    }))

/** A minimal in-order submission used across the judging tests. */
const buildSubmission = (
    overrides: Partial<Judge0SubmissionInput> = {
    },
): Judge0SubmissionInput => ({
    sourceCode: "print(1)",
    languageId: 71,
    stdin: "",
    expectedOutput: "1",
    cpuTimeLimitSeconds: 2,
    memoryLimitKb: 128_000,
    ...overrides,
})

/** Build a fake `fetch` Response-like object the service consumes. */
const jsonResponse = (
    body: unknown,
    ok = true,
    status = 200,
): Partial<Response> => ({
    ok,
    status,
    json: jest.fn(async () => body),
    text: jest.fn(async () => JSON.stringify(body)),
})

describe("Judge0Service",
    () => {
        let module: TestingModule
        let service: Judge0Service
        let fetchMock: jest.Mock

        beforeEach(async () => {
            // tighten the timing knobs so poll loops/timeouts settle instantly
            process.env.JUDGE0_POLL_INTERVAL_MS = "1ms"
            process.env.JUDGE0_MAX_POLL_ATTEMPTS = "3"
            process.env.JUDGE0_OVERALL_TIMEOUT_MS = "5s"
            process.env.JUDGE0_REQUEST_TIMEOUT_MS = "5s"

            // replace the global fetch with a jest mock each test programs
            fetchMock = jest.fn()
            global.fetch = fetchMock as unknown as typeof fetch

            module = await Test.createTestingModule({
                providers: [
                    Judge0Service,
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<Judge0Service>(Judge0Service)
        })

        afterEach(async () => {
            // drop env overrides so suites stay isolated
            delete process.env.JUDGE0_POLL_INTERVAL_MS
            delete process.env.JUDGE0_MAX_POLL_ATTEMPTS
            delete process.env.JUDGE0_OVERALL_TIMEOUT_MS
            delete process.env.JUDGE0_REQUEST_TIMEOUT_MS
            await module.close()
        })

        describe("submitBatch",
            () => {
                it("base64-encodes text fields and attaches the auth header",
                    async () => {
                        // Judge0 hands back one token per submission
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse([
                                {
                                    token: "tok-1",
                                },
                            ]),
                        )

                        const tokens = await service.submitBatch({
                            submissions: [
                                buildSubmission(),
                            ],
                        })

                        // tokens echoed straight back in input order
                        expect(tokens).toEqual([
                            {
                                token: "tok-1",
                            },
                        ])
                        // inspect the wire body the service sent
                        const [
                            url,
                            init,
                        ] = fetchMock.mock.calls[0]
                        expect(url).toContain("/submissions/batch?base64_encoded=true")
                        expect(init.method).toBe("POST")
                        // auth token from the (mocked) mount helper rides along
                        expect(init.headers["X-Auth-Token"]).toBe("test-auth-token")
                        const sent = JSON.parse(init.body)
                        // "print(1)" base64-encoded -- proves text fields are encoded
                        expect(sent.submissions[0].source_code).toBe(
                            Buffer.from("print(1)",
                                "utf8").toString("base64"),
                        )
                        // numeric fields are passed through untouched
                        expect(sent.submissions[0].language_id).toBe(71)
                    })
            })

        describe("getBatch",
            () => {
                it("decodes base64 text fields and converts time to milliseconds",
                    async () => {
                        // a terminal Accepted submission with encoded stdout + "0.012" seconds
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse({
                                submissions: [
                                    {
                                        token: "tok-1",
                                        status: {
                                            id: Judge0StatusId.Accepted,
                                            description: "Accepted",
                                        },
                                        stdout: Buffer.from("1\n",
                                            "utf8").toString("base64"),
                                        time: "0.012",
                                        memory: 2048,
                                    },
                                ],
                            }),
                        )

                        const results = await service.getBatch([
                            "tok-1",
                        ])

                        // stdout decoded back to plain text
                        expect(results[0].stdout).toBe("1\n")
                        // 0.012s rounded to 12ms
                        expect(results[0].timeMs).toBe(12)
                        expect(results[0].memoryKb).toBe(2048)
                        expect(results[0].statusId).toBe(Judge0StatusId.Accepted)
                    })

                it("falls back to InternalError when Judge0 omits the status id",
                    async () => {
                        // a submission with no nested status object at all
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse({
                                submissions: [
                                    {
                                        token: "tok-1",
                                    },
                                ],
                            }),
                        )

                        const results = await service.getBatch([
                            "tok-1",
                        ])

                        // missing status defaults to the infra-error verdict
                        expect(results[0].statusId).toBe(Judge0StatusId.InternalError)
                        // absent text fields normalize to null
                        expect(results[0].stdout).toBeNull()
                        expect(results[0].timeMs).toBeNull()
                        expect(results[0].memoryKb).toBeNull()
                    })
            })

        describe("judgeBatch",
            () => {
                it("submits then returns once every run is terminal",
                    async () => {
                        // first call = submitBatch tokens
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse([
                                {
                                    token: "tok-1",
                                },
                            ]),
                        )
                        // first poll is still processing (non-terminal)
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse({
                                submissions: [
                                    {
                                        token: "tok-1",
                                        status: {
                                            id: Judge0StatusId.Processing,
                                        },
                                    },
                                ],
                            }),
                        )
                        // second poll flips to Accepted (terminal) -> loop returns
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse({
                                submissions: [
                                    {
                                        token: "tok-1",
                                        status: {
                                            id: Judge0StatusId.Accepted,
                                        },
                                    },
                                ],
                            }),
                        )

                        const { results } = await service.judgeBatch({
                            submissions: [
                                buildSubmission(),
                            ],
                        })

                        // the terminal Accepted result is surfaced
                        expect(results[0].statusId).toBe(Judge0StatusId.Accepted)
                        // 1 submit + 2 polls
                        expect(fetchMock).toHaveBeenCalledTimes(3)
                    })

                it("throws Judge0TimedOutException when polls never go terminal",
                    async () => {
                        // submitBatch tokens
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse([
                                {
                                    token: "tok-1",
                                },
                            ]),
                        )
                        // every subsequent poll stays Processing forever
                        fetchMock.mockResolvedValue(
                            jsonResponse({
                                submissions: [
                                    {
                                        token: "tok-1",
                                        status: {
                                            id: Judge0StatusId.Processing,
                                        },
                                    },
                                ],
                            }),
                        )

                        // poll-attempt budget (3) is exhausted before any terminal
                        await expect(
                            service.judgeBatch({
                                submissions: [
                                    buildSubmission(),
                                ],
                            }),
                        ).rejects.toBeInstanceOf(Judge0TimedOutException)
                    })

                it("rejects with a timeout when the wall-clock budget elapses first",
                    async () => {
                        // make the overall cap fire before the poll loop can settle
                        process.env.JUDGE0_OVERALL_TIMEOUT_MS = "5ms"
                        process.env.JUDGE0_POLL_INTERVAL_MS = "10s"
                        // submitBatch tokens, then a poll that would arrive too late
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse([
                                {
                                    token: "tok-1",
                                },
                            ]),
                        )

                        // the hard wall-clock cap wins the race
                        await expect(
                            service.judgeBatch({
                                submissions: [
                                    buildSubmission(),
                                ],
                            }),
                        ).rejects.toBeInstanceOf(Judge0TimedOutException)
                    })
            })

        describe("request error handling",
            () => {
                it("wraps a non-2xx response in Judge0RequestFailedException",
                    async () => {
                        // Judge0 answers 500 with a body
                        fetchMock.mockResolvedValueOnce(
                            jsonResponse("boom",
                                false,
                                500),
                        )

                        // surfaced as the typed failure (carrying the status code)
                        await expect(
                            service.getBatch([
                                "tok-1",
                            ]),
                        ).rejects.toBeInstanceOf(Judge0RequestFailedException)
                    })

                it("normalizes a transport error into Judge0RequestFailedException",
                    async () => {
                        // fetch itself throws (network/abort) -- not a Response
                        fetchMock.mockRejectedValueOnce(
                            new Error("ECONNREFUSED"),
                        )

                        // boundary normalizes the raw error into our typed exception
                        await expect(
                            service.getBatch([
                                "tok-1",
                            ]),
                        ).rejects.toBeInstanceOf(Judge0RequestFailedException)
                    })
            })
    })
