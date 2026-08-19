import Handlebars from "handlebars"
import {
    isStringifiablePrimitive,
} from "@modules/lib/common/utils/stringify-primitive"
import type {
    ComposedEducation,
    ComposedExperience,
    ComposedSkillGroup,
} from "../types/execute"

/**
 * Replacement LaTeX source for every character {@link escapeLatex} treats as
 * dangerous. Keyed by the literal character so a single regex pass can look
 * each one up without re-scanning any text a replacement itself introduces.
 */
const LATEX_ESCAPE_SEQUENCES: Readonly<Record<string, string>> = {
    "\\": String.raw`\textbackslash{}`,
    "&": String.raw`\&`,
    "%": String.raw`\%`,
    "$": String.raw`\$`,
    "#": String.raw`\#`,
    "_": String.raw`\_`,
    "{": String.raw`\{`,
    "}": String.raw`\}`,
    // tilde + caret need a trailing {} so they don't act as accents
    "~": String.raw`\textasciitilde{}`,
    "^": String.raw`\textasciicircum{}`,
}

/** Matches any single character {@link LATEX_ESCAPE_SEQUENCES} has a mapping for. */
const LATEX_SPECIAL_CHARS = /[\\&%$#_{}~^]/g

/**
 * Escape every LaTeX special character in a piece of USER-SUPPLIED text so the
 * generated `.tex` compiles in Overleaf / pdflatex.
 *
 * A SINGLE regex pass over the ORIGINAL string, not a chain of `.replaceAll`
 * calls -- chaining was tried first and is a bug: `.replaceAll` re-scans the
 * WHOLE string on every call, including text a previous call just inserted.
 * Escaping backslash first (`\` -> `\textbackslash{}`) and braces later in
 * that chain meant the `{}` the backslash replacement had just added got
 * escaped AGAIN by the brace step, corrupting any input containing a literal
 * backslash into `\textbackslash\{\}` (a backslash glyph followed by two
 * literal brace characters) instead of the intended `\textbackslash{}` (a
 * backslash glyph followed by an empty group, LaTeX's idiomatic way to stop
 * the macro from swallowing the next character). A single `String#replace`
 * pass with a callback never re-scans its own output, so this cannot recur
 * for any current or future entry in {@link LATEX_ESCAPE_SEQUENCES}.
 *
 * Applied to EVERY interpolated value (names, company names, bullet text,
 * emails, URLs shown as text, ...) before it enters the template -- omitting
 * it produces documents that fail to compile.
 *
 * @param text - Raw user text (undefined/null coerced to empty string).
 * @returns The LaTeX-safe string.
 */
export const escapeLatex = (text: string | null | undefined): string => {
    if (text == null) {
        return ""
    }
    return String(text).replace(
        LATEX_SPECIAL_CHARS,
        (char) => LATEX_ESCAPE_SEQUENCES[char],
    )
}

/**
 * Handlebars helper name for LaTeX escaping. `{{tex value}}` stays available
 * for explicit/legacy use, but nothing below relies on template authors
 * remembering to type it -- see {@link TexAutoEscapeVisitor}.
 */
const TEX_HELPER = "tex"

/**
 * Isolated Handlebars environment for LaTeX rendering only.
 *
 * `Handlebars.create()` gives this environment its own `helpers` registry, so
 * registering `tex` here can never collide with Handlebars usage elsewhere in
 * this process -- `@nestjs-modules/mailer` (HTML email templates) and
 * `langchain` both resolve to the exact same installed `handlebars` package
 * (`npm ls handlebars`), and a helper named `tex` is not theirs.
 *
 * What `create()` does NOT give is an isolated default escaper: every
 * environment it produces shares the same `Utils` object, because
 * `handlebars.runtime.js` does `hb.Utils = Utils` from one module-level
 * import, and the compiled template's `container.escapeExpression` in
 * `handlebars/runtime.js` reads that same shared `Utils.escapeExpression` at
 * render time. Verified directly against the installed handlebars@4.7.9:
 * reassigning `escapeExpression` on a `create()`d environment changes the
 * DEFAULT (HTML) escaping for the plain top-level `Handlebars` import too --
 * which would silently corrupt `@nestjs-modules/mailer`'s HTML escaping.
 * That construction was tried, confirmed unsafe, and rejected. The AST
 * rewrite below ({@link TexAutoEscapeVisitor}) is the isolated alternative:
 * it runs once at compile time, touches nothing shared, and needs no global
 * mutation at all.
 */
const LatexHandlebars = Handlebars.create()

// Register the escape helper exactly once (idempotent across worker restarts).
if (!LatexHandlebars.helpers[TEX_HELPER]) {
    LatexHandlebars.registerHelper(
        TEX_HELPER,
        (value: unknown) => new LatexHandlebars.SafeString(
            escapeLatex(
                isStringifiablePrimitive(value) && value !== undefined
                    ? String(value)
                    : "",
            ),
        ),
    )
}

/**
 * Whether a mustache node is a bare field/variable reference that Handlebars
 * would otherwise interpolate with its DEFAULT escaper -- i.e. exactly the
 * shape a template author writes when they forget the `tex` helper:
 * `{{field}}`, `{{this}}`, `{{@index}}`. Excluded on purpose:
 *   - `escaped === false` (`{{{field}}}`, `{{{{field}}}}`) -- the explicit,
 *     greppable escape hatch. The visitor cannot know whether a given raw
 *     mustache is "safe" LaTeX structure or dangerous user data, so it does
 *     not guess; the triple-stache itself is the developer's signed opt-out.
 *   - `params.length > 0` or a non-empty hash -- this is already a helper
 *     call (`{{tex field}}`, or any future helper), not a bare reference, so
 *     wrapping it again would double-invoke `tex` and double-escape.
 */
const isBareFieldMustache = (
    mustache: hbs.AST.MustacheStatement,
): boolean => (
    mustache.escaped
    && mustache.path.type === "PathExpression"
    && mustache.params.length === 0
    // Handlebars' ambient type claims `hash` is always a `Hash` node, but a
    // bare mustache with no `key=value` pairs parses with `hash === undefined`
    // at runtime (verified against handlebars@4.7.9) -- guard defensively
    // rather than trust the (here, inaccurate) declared type.
    && (!mustache.hash || mustache.hash.pairs.length === 0)
)

/**
 * Rewrites a parsed Handlebars AST in place so every bare field mustache
 * (see {@link isBareFieldMustache}) becomes an explicit `{{tex field}}` call
 * BEFORE the template is compiled. This is what inverts the safety default:
 * a template author who writes plain `{{field}}` gets LaTeX-escaped output
 * automatically, with no helper to remember and nothing to forget. Reuses
 * Handlebars' own `Visitor` (`mutating: true`, typed via the sibling
 * `handlebars-visitor.d.ts` ambient augmentation) rather than a hand-rolled
 * walker, so every statement/block shape the parser can produce -- `{{#each}}`,
 * `{{#unless}}`, nested blocks, `{{this}}`, `{{@index}}` -- is traversed
 * exactly the way Handlebars' own compiler traverses it, not however this
 * file's author happened to remember to.
 */
class TexAutoEscapeVisitor extends Handlebars.Visitor {
    public constructor() {
        super()
        this.mutating = true
    }

    public override MustacheStatement(
        mustache: hbs.AST.MustacheStatement,
    ): void {
        super.MustacheStatement(mustache)

        if (!isBareFieldMustache(mustache)) {
            return
        }

        const originalPath = mustache.path
        mustache.path = {
            type: "PathExpression",
            data: false,
            depth: 0,
            parts: [TEX_HELPER],
            original: TEX_HELPER,
            loc: originalPath.loc,
        }
        mustache.params = [originalPath]
    }
}

/**
 * Compile a LaTeX Handlebars template with escaping safe by construction:
 * every bare `{{field}}` interpolation is rewritten to `{{tex field}}`
 * (LaTeX-escaped) before compilation, so there is no bare-mustache code path
 * that reaches the compiled template unescaped. The only way to emit raw,
 * unescaped text is the explicit triple-stache `{{{field}}}` -- visible in
 * review and greppable, exactly the inversion this exists for.
 *
 * This is the ONLY supported way to compile a template against
 * {@link LatexHandlebars} in this file -- `LatexHandlebars.compile(...)` is
 * intentionally not exported on its own, because calling it directly would
 * skip the AST rewrite and silently reintroduce the bare-mustache hole this
 * function closes.
 *
 * @param source - LaTeX Handlebars template source.
 * @param options - Handlebars compile options (`noEscape` is not meaningful
 * to override here -- every field either ends up as a `tex`-helper
 * `SafeString`, which bypasses escaping regardless, or is an explicit
 * triple-stache, which Handlebars never escapes).
 * @returns The compiled template delegate.
 */
export const compileLatexTemplate = <T>(
    source: string,
    options?: CompileOptions,
): HandlebarsTemplateDelegate<T> => {
    const ast = LatexHandlebars.parse(source)
    new TexAutoEscapeVisitor().accept(ast)
    return LatexHandlebars.compile<T>(ast,
        options)
}

/**
 * The CV LaTeX template, driven by Handlebars loops over skillGroups /
 * experiences / education. EVERY interpolated value goes through the `tex`
 * helper (LaTeX-escaped). Static LaTeX structure is kept verbatim; `{{{ }}}`
 * is used for the pre-escaped SafeStrings the helper returns.
 *
 * Values expected in the template context:
 *   fullName, headline, phone, email, linkedin, github, location, summary,
 *   skillGroups[{ category, items[] }], experiences[{ title, dateRange, org,
 *   location, bullets[] }], education[{ school, dateRange, degree }].
 */
const CV_TEMPLATE_SOURCE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{12pt}{6pt}
\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,parsep=0pt,topsep=2pt}
\pagenumbering{gobble}
\begin{document}
{\centering \textbf{\Large {{{tex fullName}}} } \\[2pt] {{{tex headline}}} \\[2pt] {{{tex phone}}} \textbullet\ {{{tex email}}} \textbullet\ {{{tex linkedin}}} \textbullet\ {{{tex github}}} \textbullet\ {{{tex location}}} \par}
\section*{Summary}
{{{tex summary}}}
\section*{Skills}
\begin{itemize}[leftmargin=1.2em]
{{#each skillGroups}}\item \textbf{ {{~tex category}}:} {{#each items}}{{tex this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}\end{itemize}
\section*{Experience}
{{#each experiences}}\textbf{ {{~tex title}} } \hfill {{tex dateRange}} \\
{{tex org}} --- {{tex location}}
\begin{itemize}
{{#each bullets}}\item {{tex this}}
{{/each}}\end{itemize}
{{/each}}\section*{Education}
{{#each education}}\textbf{ {{~tex school}} } \hfill {{tex dateRange}} \\
{{tex degree}}
{{/each}}\end{document}
`

/**
 * Compiled once -- the Handlebars template is a pure function of its context.
 * Goes through {@link compileLatexTemplate}, so every field in
 * {@link CV_TEMPLATE_SOURCE} is safe by construction: `{{{tex ...}}}` (used
 * throughout today) stays exactly as written, and any bare `{{field}}` a
 * future edit adds is escaped automatically -- see {@link TexAutoEscapeVisitor}.
 */
const compiledCvTemplate = compileLatexTemplate<CvLatexTemplateContext>(
    CV_TEMPLATE_SOURCE,
)

/** Context accepted by {@link renderCvLatex}. */
export interface CvLatexTemplateContext {
    fullName: string
    headline: string
    phone: string
    email: string
    linkedin: string
    github: string
    location: string
    summary: string
    skillGroups: Array<ComposedSkillGroup>
    experiences: Array<ComposedExperience>
    education: Array<ComposedEducation>
}

/**
 * Render the CV `.tex` document from the structured context. All string values
 * are LaTeX-escaped by the `tex` helper inside the template.
 *
 * @param context - The structured CV fields.
 * @returns The full `.tex` document text.
 */
export const renderCvLatex = (
    context: CvLatexTemplateContext,
): string => compiledCvTemplate(context)
