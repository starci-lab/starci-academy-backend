import {
    compileLatexTemplate,
    escapeLatex,
    renderCvLatex,
} from "./latex"

/** Every character `escapeLatex` treats specially, concatenated in one string. */
const EVERY_LATEX_METACHARACTER = String.raw`\ { } $ & # ^ _ ~ %`

describe("escapeLatex",
    () => {
        it("escapes every LaTeX metacharacter",
            () => {
                expect(escapeLatex(EVERY_LATEX_METACHARACTER)).toBe(
                    String.raw`\textbackslash{} \{ \} \$ \& \# \textasciicircum{} \_ \textasciitilde{} \%`,
                )
            })

        it("escapes the backslash first so the injected escape sequences are not themselves re-escaped",
            () => {
                // if backslash were escaped last, the "\" this adds for "&" would
                // itself get turned into "\textbackslash{}"
                expect(escapeLatex("&")).toBe(String.raw`\&`)
            })

        it("coerces null/undefined to an empty string",
            () => {
                expect(escapeLatex(null)).toBe("")
                expect(escapeLatex(undefined)).toBe("")
            })
    })

describe("compileLatexTemplate -- safe-by-construction escaping",
    () => {
        it("HARDENING: a field containing every LaTeX metacharacter renders escaped through a plain {{field}}",
            () => {
                const template = compileLatexTemplate<{ field: string }>("{{field}}")

                expect(template({
                    field: EVERY_LATEX_METACHARACTER,
                })).toBe(escapeLatex(EVERY_LATEX_METACHARACTER))
            })

        it("HARDENING: a template author who writes {{field}} (no helper) still gets escaped output",
            () => {
                const dangerous = String.raw`\end{document}\input{/etc/passwd}`
                const template = compileLatexTemplate<{ field: string }>(
                    "before {{field}} after",
                )

                expect(template({
                    field: dangerous,
                })).toBe(`before ${escapeLatex(dangerous)} after`)
                // proves the danger was real: the raw payload must not survive verbatim
                expect(template({
                    field: dangerous,
                })).not.toContain(dangerous)
            })

        it("HARDENING: the existing tex helper does not double-escape when kept for explicit use",
            () => {
                const template = compileLatexTemplate<{ field: string }>("{{tex field}}")

                const onceEscaped = template({
                    field: EVERY_LATEX_METACHARACTER,
                })
                expect(onceEscaped).toBe(escapeLatex(EVERY_LATEX_METACHARACTER))
                // a double-escape would turn the "\" that escapeLatex just produced
                // into "\textbackslash{}" again -- assert that did not happen
                expect(onceEscaped).not.toContain(String.raw`\textbackslash{}textbackslash{}`)
            })

        it("leaves the explicit triple-stache escape hatch {{{field}}} raw and unescaped",
            () => {
                const template = compileLatexTemplate<{ field: string }>("{{{field}}}")

                expect(template({
                    field: EVERY_LATEX_METACHARACTER,
                })).toBe(EVERY_LATEX_METACHARACTER)
            })

        it("auto-escapes a bare field nested inside an {{#each}} block ({{this}})",
            () => {
                const template = compileLatexTemplate<{ items: Array<string> }>(
                    "{{#each items}}[{{this}}]{{/each}}",
                )

                expect(template({
                    items: [
                        "a&b",
                        "c_d",
                    ],
                })).toBe(`[${escapeLatex("a&b")}][${escapeLatex("c_d")}]`)
            })
    })

describe("renderCvLatex",
    () => {
        const baseContext = {
            fullName: "Jane O'Brien & Co",
            headline: "Backend Engineer #1 (C++/C#)",
            phone: "+1 555-0100",
            email: "jane@example.com",
            linkedin: "linkedin.com/in/jane",
            github: "github.com/jane",
            location: "Remote ~ USA",
            summary: String.raw`Built systems with \ and $100 budgets, 50% under_score, {braces}`,
            skillGroups: [{
                category: "Backend & Infra",
                items: [
                    "Node.js",
                    "C++",
                ],
            }],
            experiences: [{
                title: "Sr. Eng ^2",
                dateRange: "2020-2023",
                org: "ACME & Co",
                location: "NY",
                bullets: [
                    "Did X_Y {great} things",
                    "Saved $5%",
                ],
            }],
            education: [{
                school: "MIT ~ CS",
                dateRange: "2016-2020",
                degree: "B.S. C.S.",
            }],
        }

        it("produces a compilable .tex document with every dangerous character escaped",
            () => {
                const latex = renderCvLatex(baseContext)

                expect(latex).toContain(String.raw`\documentclass[11pt,a4paper]{article}`)
                expect(latex).toContain(String.raw`\end{document}`)
                // the ampersand in the name must be escaped, not raw (raw "&" in LaTeX
                // body text is a syntax error outside of tabular/align environments)
                expect(latex).toContain(String.raw`Jane O'Brien \& Co`)
                expect(latex).not.toContain("Jane O'Brien & Co")
                // the caret in the experience title must be escaped, not left to act
                // as a LaTeX math/accent character
                expect(latex).toContain(String.raw`Sr. Eng \textasciicircum{}2`)
            })

        it("never emits a raw, unescaped LaTeX metacharacter for any interpolated field",
            () => {
                const latex = renderCvLatex({
                    ...baseContext,
                    summary: EVERY_LATEX_METACHARACTER,
                })
                const summaryLine = latex
                    .split("\n")
                    .find((line) => line.includes("textbackslash"))

                expect(summaryLine).toBe(escapeLatex(EVERY_LATEX_METACHARACTER))
            })
    })
