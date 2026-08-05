import {
    MockInterviewSessionDrawService,
} from "./start-mock-interview-session-draw.service"

/**
 * Guards how a question's authored `bodies/` decide whether the candidate's selected
 * implementation tracks gate it.
 *
 * The rule: a question authored across the four tracks is served in one of the
 * candidate's picked languages and dropped when none overlap, while a question with a
 * SINGLE authored body has its language fixed by the question itself (`agnostic` prose,
 * a `hcl`/`yaml`/`dockerfile` snippet -- or `typescript` code that only makes sense in
 * TypeScript) and must stay eligible for every candidate.
 *
 * Body COUNT, not the language label, is what separates the two. Gating a single-body
 * question on the track selection silently removes it from the pool for anyone who picked
 * a different track -- which is exactly what would happen to the 165 fixed-language code
 * questions (49 of them labelled `typescript`) once their content moves under `bodies/`.
 */
describe("MockInterviewSessionDrawService — track gating by body count",
    () => {
    /** Builds a bank row with the given authored bodies. */
        const question = (
            id: string,
            bodies: Array<{ lang: string, givenCode: string }>,
        ) => ({
            id,
            kind: "review",
            tier: "middle",
            moduleId: null,
            prompt: `prompt-${id}`,
            diagram: null,
            givenCode: null,
            givenLang: null,
            langs: bodies.map((body, index) => ({
                ...body,
                sortIndex: index,
                prompt: `prompt-${id}-${body.lang}`,
                idealAnswer: null,
            })),
        })

        /** Instantiates the service with only the dependency this path actually touches. */
        const serviceWith = (rows: Array<unknown>) => {
            const entityManager = {
                find: jest.fn().mockResolvedValue(rows),
            }
            return new MockInterviewSessionDrawService(
            entityManager as never,
            undefined as never,
            undefined as never,
            undefined as never,
            undefined as never,
            )
        }

        /** Calls the private lister the draw pool is built from. */
        const listFor = async (
            rows: Array<unknown>,
            langs: Array<string>,
        ) => {
            const service = serviceWith(rows)
            return await (service as unknown as {
            listCourseInterviewQuestions: (params: {
                courseId: string
                langs: Array<string>
            }) => Promise<Array<{ id: string, givenCodes: Array<{ lang: string }> }>>
        }).listCourseInterviewQuestions({
                courseId: "course-1",
                langs,
            })
        }

        it("keeps a single agnostic body for a candidate who picked an unrelated track",
            async () => {
                const rows = [question("q-agnostic",
                    [{
                        lang: "agnostic", givenCode: "",
                    }])]

                const result = await listFor(rows,
                    ["go"])

                expect(result.map((row) => row.id)).toEqual(["q-agnostic"])
            })

        it("keeps a single typescript body for a Java-only candidate (language fixed by the question)",
            async () => {
                const rows = [question("q-fixed-ts",
                    [{
                        lang: "typescript", givenCode: "const a = 1",
                    }])]

                const result = await listFor(rows,
                    ["java"])

                expect(result.map((row) => row.id)).toEqual(["q-fixed-ts"])
            })

        it("keeps a single hcl body regardless of the picked tracks",
            async () => {
                const rows = [question("q-hcl",
                    [{
                        lang: "hcl", givenCode: "resource \"x\" {}",
                    }])]

                const result = await listFor(rows,
                    ["csharp",
                        "go"])

                expect(result.map((row) => row.id)).toEqual(["q-hcl"])
            })

        it("serves a four-track question in a language the candidate actually picked",
            async () => {
                const rows = [question("q-track",
                    [
                        {
                            lang: "typescript", givenCode: "ts",
                        },
                        {
                            lang: "java", givenCode: "java",
                        },
                        {
                            lang: "csharp", givenCode: "cs",
                        },
                        {
                            lang: "go", givenCode: "go",
                        },
                    ])]

                const result = await listFor(rows,
                    ["go"])

                expect(result).toHaveLength(1)
                expect(result[0].givenCodes[0].lang).toBe("go")
            })

        it("drops a four-track question when none of its tracks were picked",
            async () => {
                const rows = [question("q-track",
                    [
                        {
                            lang: "typescript", givenCode: "ts",
                        },
                        {
                            lang: "java", givenCode: "java",
                        },
                    ])]

                const result = await listFor(rows,
                    ["go"])

                expect(result).toEqual([])
            })
    })
