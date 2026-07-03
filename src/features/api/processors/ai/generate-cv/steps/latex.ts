import Handlebars from "handlebars"

/**
 * Escape every LaTeX special character in a piece of USER-SUPPLIED text so the
 * generated `.tex` compiles in Overleaf / pdflatex.
 *
 * Order matters: backslash MUST be escaped first (it is the escape character
 * itself), otherwise the replacement sequences we add for the other specials
 * would be double-escaped. Applied to EVERY interpolated value (names, company
 * names, bullet text, emails, URLs shown as text, …) before it enters the
 * template — omitting it produces documents that fail to compile.
 *
 * @param text - Raw user text (undefined/null coerced to empty string).
 * @returns The LaTeX-safe string.
 */
export const escapeLatex = (text: string | null | undefined): string => {
    if (text == null) {
        return ""
    }
    return String(text)
        // backslash first — it is the escape char; map to \textbackslash{}
        .replace(/\\/g,
            "\\textbackslash{}")
        .replace(/&/g,
            "\\&")
        .replace(/%/g,
            "\\%")
        .replace(/\$/g,
            "\\$")
        .replace(/#/g,
            "\\#")
        .replace(/_/g,
            "\\_")
        .replace(/\{/g,
            "\\{")
        .replace(/\}/g,
            "\\}")
        // tilde + caret need a trailing {} so they don't act as accents
        .replace(/~/g,
            "\\textasciitilde{}")
        .replace(/\^/g,
            "\\textasciicircum{}")
}

/**
 * Handlebars helper name for LaTeX escaping. Registered globally once so the
 * template can call `{{tex value}}` on every interpolated field.
 */
const TEX_HELPER = "tex"

// Register the escape helper exactly once (idempotent across worker restarts).
if (!Handlebars.helpers[TEX_HELPER]) {
    Handlebars.registerHelper(
        TEX_HELPER,
        (value: unknown) => new Handlebars.SafeString(
            escapeLatex(value == null ? "" : String(value)),
        ),
    )
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

/** Compiled once — the Handlebars template is a pure function of its context. */
const compiledCvTemplate = Handlebars.compile(
    CV_TEMPLATE_SOURCE,
    {
        // do NOT let Handlebars HTML-escape; the `tex` helper does LaTeX escaping
        noEscape: true,
    },
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
    skillGroups: Array<{
        category: string
        items: Array<string>
    }>
    experiences: Array<{
        title: string
        org: string
        location: string
        dateRange: string
        bullets: Array<string>
    }>
    education: Array<{
        school: string
        degree: string
        dateRange: string
    }>
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
