import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    SubmitContactResolver,
} from "@features/api/core/graphql/mutations/contact/submit-contact/submit-contact.resolver"
import type {
    SubmitContactRequest,
} from "@features/api/core/graphql/mutations/contact/submit-contact/graphql-types"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Inbox that receives contact-form messages -- mirrors the private constant in the resolver. */
const CONTACT_INBOX = "cuongnvtse160875@gmail.com"

/**
 * e2e for the public `submitContact` mutation -- `.claude/canon/be/enforce/
 * authoring/testing.md` §2 names every write flow as required e2e coverage;
 * this flow writes NO database row (it is anonymous, mail-only), so its
 * "commit" is the outbound `EnqueueSendMailJobService.enqueue` call. Runs the
 * real `SubmitContactResolver` (category -> label mapping, HTML-escaping, the
 * anonymous/no-auth-guard wiring) end to end; only the mail queue itself is
 * stubbed -- no Postgres/Testcontainers boot is needed for this spec, since
 * `SubmitContactResolver` has no database dependency at all.
 *
 * MOCKED (genuinely external to the process, matches the pattern
 * `createE2eApp` uses for the same class):
 *  - `EnqueueSendMailJobService` -- real class enqueues onto a live BullMQ
 *    queue via `JobActionService` (itself a DB write + broker round trip);
 *    stubbed so this spec asserts the resolver's OWN logic (label mapping,
 *    escaping, envelope shape) without needing Redis/BullMQ infra.
 *
 * REAL: `SubmitContactResolver` (the mutation under test) -- anonymous, no
 * `@UseGuards`, matching its "anyone can reach out" contract.
 */
describe("Public contact-form submission (e2e)",
    () => {
        let app: INestApplication
        let resolver: SubmitContactResolver

        const enqueueSendMailJobServiceMock = {
            enqueue: jest.fn().mockResolvedValue({
                id: "job-1",
            }),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                ],
                providers: [
                    // REAL -- the mutation under test (category label mapping,
                    // HTML-escaping, mail envelope assembly)
                    SubmitContactResolver,
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            resolver = app.get(SubmitContactResolver)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        const baseRequest: SubmitContactRequest = {
            name: "Stacy Nguyen",
            email: "stacy@example.com",
            category: "course_support",
            message: "Hello, I need help with my course.",
        }

        it("enqueues ONE mail job addressed to the team inbox with the sender as reply-to",
            async () => {
                await resolver.execute(baseRequest)

                expect(enqueueSendMailJobServiceMock.enqueue).toHaveBeenCalledTimes(1)
                const call = enqueueSendMailJobServiceMock.enqueue.mock.calls[0][0]
                expect(call.to).toEqual([
                    {
                        address: CONTACT_INBOX,
                    },
                ])
                expect(call.replyTo).toEqual({
                    address: baseRequest.email,
                    name: baseRequest.name,
                })
                expect(call.subject).toContain("Course support")
                expect(call.subject).toContain(baseRequest.name)
            })

        it("maps each known category to its human label in both subject and text body",
            async () => {
                await resolver.execute({
                    ...baseRequest,
                    category: "partnership",
                })

                const call = enqueueSendMailJobServiceMock.enqueue.mock.calls[0][0]
                expect(call.subject).toContain("Partnership / hiring")
                expect(call.text).toContain("Category: Partnership / hiring")
            })

        it("an UNKNOWN category falls back to the General label rather than throwing",
            async () => {
                await resolver.execute({
                    ...baseRequest,
                    category: "not_a_real_category",
                })

                const call = enqueueSendMailJobServiceMock.enqueue.mock.calls[0][0]
                expect(call.subject).toContain("General")
                expect(call.text).toContain("Category: General")
            })

        it("escapes HTML-significant characters in the HTML body but leaves the plain-text body raw",
            async () => {
                const maliciousMessage = "<script>alert('xss')</script> & \"quoted\""

                await resolver.execute({
                    ...baseRequest,
                    message: maliciousMessage,
                })

                const call = enqueueSendMailJobServiceMock.enqueue.mock.calls[0][0]
                // html body: no raw tag survives -- the angle brackets are entity-encoded
                expect(call.html).not.toContain("<script>")
                expect(call.html).toContain("&lt;script&gt;")
                expect(call.html).toContain("&amp;")
                expect(call.html).toContain("&quot;quoted&quot;")
                // text body: verbatim, unescaped -- it's a plain-text mail part
                expect(call.text).toContain(maliciousMessage)
            })

        it("carries the message body verbatim in the text part, after the header lines",
            async () => {
                await resolver.execute(baseRequest)

                const call = enqueueSendMailJobServiceMock.enqueue.mock.calls[0][0]
                expect(call.text).toContain(`Name: ${baseRequest.name}`)
                expect(call.text).toContain(`Email: ${baseRequest.email}`)
                expect(call.text.endsWith(baseRequest.message)).toBe(true)
            })
    })
