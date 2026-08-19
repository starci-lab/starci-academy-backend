import {
    Injectable,
} from "@nestjs/common"
import normalizeNewline from "normalize-newline"
import {
    MOUNT_JSONB_DELIMITER_LINE_RE,
    MOUNT_JSONB_ITEM_HEADING_RE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
    NUMERIC_SECTION_KEY_RE,
} from "./constants"
import type {
    DelimiterCut,
    HeadingSlice,
} from "./types"

/** Mutable state threaded through {@link ExtractJsonFromMdService.parseJsonbItems}. */
interface JsonbParseState {
    items: Array<Record<string, unknown>>
    current: Record<string, unknown> | null
    field: string | null
    buffer: Array<string>
    inFence: boolean
}

@Injectable()
/**
 * Mount markdown -> JSON.
 *
 * The grammar is recursive and driven entirely by ATX headings. At any level
 * the sibling headings decide the shape:
 *
 * - `# <number>` siblings -> an **array** (each item carries its `orderIndex`).
 * - `# <string>` siblings -> an **object** (heading text is the field key).
 * - a heading with no child headings -> a **string leaf** (its trimmed body).
 *
 * Two inline markers escape the heading grammar inside a leaf:
 *
 * - `@starci/seperator` ... `@starci/seperator` wraps a verbatim string leaf, so
 *   its body may itself contain `#` lines without being parsed as headings.
 * - `@starci/jsonb` ... `@starci/jsonb` wraps an inline array-of-objects stored
 *   as a single jsonb column; its scalar fields are type-coerced.
 */
export class ExtractJsonFromMdService {
    /**
     * Extracts a JSON value from a mount markdown string.
     *
     * @param markdown - The raw mount markdown (BOM + CRLF tolerant).
     * @returns The parsed object; a non-object root is wrapped as `{ data }`.
     *
     * @example
     * service.extract("# title\nHello") // => { title: "Hello" }
     */
    extract<T extends Record<string, unknown>>(markdown: string): T {
        // empty input has no sections -> empty object
        if (!markdown) {
            return {
            } as T
        }
        // strip a leading BOM and normalise CRLF so line splitting is uniform
        const normalized = normalizeNewline(
            markdown.replace(
                /^\uFEFF/,
                ""
            )
        )
        // parse starting from the top heading level (h1)
        const parsed = this.parseLevel(normalized,
            1)
        // a plain object root satisfies the contract directly
        if (this.isPlainObject(parsed)) {
            return parsed as T
        }
        const wrapped: Record<string, unknown> = {
            data: parsed,
        }
        // T is the caller-chosen markdown envelope
        return wrapped as T
    }

    /**
     * Parses the markdown owned by one heading level into an array, object, or
     * string leaf -- the recursive core of the grammar.
     *
     * @param content - The markdown slice owned by the current level.
     * @param level - The heading depth to slice on (1 = h1, 2 = h2, ...).
     * @returns Array (numeric headings), object (string headings), or the
     *          trimmed string when this level has no child headings.
     */
    private parseLevel(content: string, level: number): unknown {
        // split into the sections introduced by headings AT this level
        const sections = this.splitSections(content,
            level)
        // no headings here -> this slice is a plain string leaf
        if (sections.length === 0) {
            return content.trim()
        }
        // all-numeric heading keys (`# 0`, `# 1`, ...) describe an ordered array
        if (sections.every((section) => NUMERIC_SECTION_KEY_RE.test(section.key))) {
            return this.buildArray(sections,
                level)
        }
        // otherwise the heading keys are field names -> build an object
        return this.buildObject(sections,
            level)
    }

    /**
     * Builds an ordered array from numeric-keyed sections, injecting `orderIndex`
     * from the heading text and sorting ascending by it.
     */
    private buildArray(
        sections: Array<HeadingSlice>,
        level: number,
    ): Array<Record<string, unknown>> {
        return sections
            .map((section) => {
                // the heading text IS the explicit order of this item
                const orderIndex = Number.parseInt(section.key,
                    10)
                // recurse into the item body to obtain its actual value
                const value = this.resolveSectionValue(section.body,
                    level)
                // an object item carries orderIndex alongside its own fields
                if (this.isPlainObject(value)) {
                    return {
                        ...value, orderIndex 
                    }
                }
                // a scalar / array item is wrapped so orderIndex always has a home
                return {
                    orderIndex, value 
                }
            })
            // honour the authored order regardless of source ordering
            .sort((prev, next) => (prev.orderIndex as number) - (next.orderIndex as number))
    }

    /**
     * Builds an object from string-keyed sections (heading text -> field value).
     */
    private buildObject(
        sections: Array<HeadingSlice>,
        level: number,
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {
        }
        // each heading contributes one field whose value is its resolved body
        for (const section of sections) {
            result[section.key] = this.resolveSectionValue(section.body,
                level)
        }
        return result
    }

    /**
     * Resolves a single section body to its value: a verbatim / jsonb leaf when
     * delimiter-bounded, otherwise the recursively parsed next level.
     */
    private resolveSectionValue(body: string, level: number): unknown {
        const { content, bounded } = this.cutBoundedLeaf(body)
        // an unbounded body is just more nested markdown -> recurse one level deeper
        if (!bounded) {
            return this.parseLevel(content,
                level + 1)
        }
        // a jsonb-wrapped leaf parses into an inline array-of-objects
        const jsonb = this.tryParseJsonbLeaf(content)
        if (jsonb !== undefined) {
            return jsonb
        }
        // an empty bounded block carries no value -> undefined so the consumer's
        // `?? []` / scalar fallback applies instead of receiving the empty string
        return content === "" ? undefined : content
    }

    /**
     * Splits markdown into the sections introduced by headings at `level`,
     * skipping headings that sit inside a fenced code block or a delimiter leaf.
     *
     * @param content - The markdown slice to split.
     * @param level - The heading depth whose `#` prefix opens a section.
     * @returns One {@link HeadingSlice} per heading; text before the first
     *          heading belongs to no section and is dropped.
     */
    private splitSections(content: string, level: number): Array<HeadingSlice> {
        // the exact `#` run + space that opens a heading at this level
        const headingPrefix = `${"#".repeat(level)} `
        const sections: Array<HeadingSlice> = []
        let currentKey: string | null = null
        let bodyLines: Array<string> = []
        let inFence = false
        let inDelimiterLeaf = false
        // Whether the current section's body is a verbatim leaf -- true only when
        // its first non-blank line is a separator marker. Only such sections
        // toggle delimiter-leaf tracking; a section that instead opens with a
        // deeper heading (e.g. `# tags` -> `## 0`) carries nested-level separators
        // that must NOT leak into this level's heading-promotion decisions (else
        // an odd separator count there swallows the next sibling, e.g. `# answer`).
        // null = not yet determined for the section currently being accumulated.
        let sectionIsLeaf: boolean | null = null

        // close the section being accumulated, attaching its buffered body
        const flush = (): void => {
            if (currentKey !== null) {
                sections.push({
                    key: currentKey, body: bodyLines.join("\n")
                })
            }
            bodyLines = []
        }

        for (const line of content.split("\n")) {
            // toggle fenced-code tracking so `#`-prefixed code lines never count
            if (line.trim().startsWith("```")) {
                inFence = !inFence
            }
            // a real heading at THIS level opens a new section; numeric keys (e.g. `## 1`
            // lang buckets) always boundary even inside an unclosed delimiter leaf
            const headingBoundary = this.matchHeadingBoundary(
                line,
                headingPrefix,
                inFence,
                inDelimiterLeaf,
            )
            if (headingBoundary) {
                flush()
                currentKey = headingBoundary.sectionKey
                // a fresh section starts outside any leaf, with its leaf-ness undecided
                inDelimiterLeaf = false
                sectionIsLeaf = null
                continue
            }
            // decide once per section whether it is a verbatim leaf: true only when
            // its first non-blank line is a separator marker
            if (currentKey !== null && sectionIsLeaf === null && line.trim().length > 0) {
                sectionIsLeaf = !inFence && this.isSeparatorLine(line)
            }
            // toggle delimiter-leaf tracking only inside a verbatim-leaf section, so
            // headings inside the leaf stay body while nested deeper-level separators
            // (e.g. those under `# tags`) never flip this level's state
            if (!inFence && sectionIsLeaf === true && this.isSeparatorLine(line)) {
                inDelimiterLeaf = !inDelimiterLeaf
            }
            // every other line (incl. deeper headings + delimiter markers) is
            // body of the current section, to be resolved/recursed later
            if (currentKey !== null) {
                bodyLines.push(line)
            }
        }
        // emit the trailing section left open at end of input
        flush()
        return sections
    }

    /**
     * Decide whether `line` opens a new section at this heading level: it must be
     * an unfenced heading at the exact `headingPrefix`, and either no delimiter
     * leaf is currently open or the heading key is numeric (numeric keys, e.g.
     * `## 1` lang buckets, always boundary even inside an unclosed delimiter leaf).
     *
     * @returns The new section's key, or `null` when `line` does not open one.
     */
    private matchHeadingBoundary(
        line: string,
        headingPrefix: string,
        inFence: boolean,
        inDelimiterLeaf: boolean,
    ): { sectionKey: string } | null {
        if (inFence || !line.startsWith(headingPrefix)) {
            return null
        }
        const sectionKey = line.slice(headingPrefix.length).trim()
        const isNumericSectionBoundary = NUMERIC_SECTION_KEY_RE.test(sectionKey)
        if (!inDelimiterLeaf || isNumericSectionBoundary) {
            return {
                sectionKey,
            }
        }
        return null
    }

    /**
     * Cuts a delimiter-bounded leaf out of a section body. A body is bounded
     * only when its first non-blank line is a `@starci/seperator` marker; the
     * leaf content is everything between the opening and closing markers (or to
     * the end when the closer is absent).
     */
    private cutBoundedLeaf(body: string): DelimiterCut {
        const lines = body.split("\n")
        // a leaf block must OPEN (first non-blank line) with a separator marker
        const openIndex = lines.findIndex((line) => line.trim().length > 0)
        if (openIndex === -1 || !this.isSeparatorLine(lines[openIndex])) {
            // not bounded -> hand back the trimmed body for further recursion
            return {
                content: body.trim(), bounded: false 
            }
        }
        // collect every separator index so we can pair the opener with a closer
        const separatorIndices = this.lineIndicesMatching(lines,
            (line) =>
                this.isSeparatorLine(line),
        )
        // a trailing separator closes the block; a lone opener runs to the end
        const closeIndex = separatorIndices.length > 1
            ? separatorIndices.at(-1)
            : lines.length
        return {
            content: lines.slice(separatorIndices[0] + 1,
                closeIndex).join("\n").trim(),
            bounded: true,
        }
    }

    /**
     * Parses a `@starci/jsonb` leaf into an inline array-of-objects, or returns
     * `undefined` when `content` is not wrapped by a pair of jsonb markers.
     */
    private tryParseJsonbLeaf(
        content: string,
    ): Array<Record<string, unknown>> | undefined {
        const lines = content.split("\n")
        // locate the wrapping markers; a jsonb leaf needs both an open and close
        const markerIndices = this.lineIndicesMatching(lines,
            (line) =>
                this.isJsonbLine(line),
        )
        if (markerIndices.length < 2) {
            return undefined
        }
        // the inner heading-block lives strictly between the outer markers
        const inner = lines
            .slice(markerIndices[0] + 1,
                markerIndices.at(-1))
            .join("\n")
        return this.parseJsonbItems(inner)
    }

    /**
     * Parses a jsonb heading-block: `# <n>` opens an array item; `## <field>`
     * sets a scalar field whose value is the raw text until the next `#`/`##`
     * heading (fence-aware), type-coerced to number / boolean when it is one.
     */
    private parseJsonbItems(inner: string): Array<Record<string, unknown>> {
        const state: JsonbParseState = {
            items: [],
            current: null,
            field: null,
            buffer: [],
            inFence: false,
        }
        for (const line of inner.split("\n")) {
            this.applyJsonbLine(state,
                line)
        }
        // flush the final field + item left open at end of input
        this.flushJsonbField(state)
        if (state.current) {
            state.items.push(state.current)
        }
        return state.items
    }

    /**
     * Decides what a single jsonb heading-block line does to `state`: opens a
     * new array item (`# <n>`), opens a new scalar field (`## <field>`), toggles
     * fence-tracking so `#`/`##` code lines are never read as headings, or --
     * for anything else -- extends the active field's raw buffered value.
     */
    private applyJsonbLine(
        state: JsonbParseState,
        line: string,
    ): void {
        if (line.trim().startsWith("```")) {
            state.inFence = !state.inFence
        }
        const itemMatch = state.inFence ? null : MOUNT_JSONB_ITEM_HEADING_RE.exec(line)
        if (itemMatch) {
            this.openJsonbItem(state,
                Number.parseInt(itemMatch[1],
                    10))
            return
        }
        if (!state.inFence && line.startsWith("## ")) {
            this.openJsonbField(state,
                line.slice(3).trim())
            return
        }
        if (state.field) {
            state.buffer.push(line)
        }
    }

    /** Commits the buffered text into the active item field, type-coerced. */
    private flushJsonbField(state: JsonbParseState): void {
        if (state.current && state.field) {
            state.current[state.field] = this.coerceScalar(state.buffer.join("\n").trim())
        }
        state.buffer = []
        state.field = null
    }

    /** Closes out the field + item currently open, then opens a new array item. */
    private openJsonbItem(
        state: JsonbParseState,
        orderIndex: number,
    ): void {
        this.flushJsonbField(state)
        if (state.current) {
            state.items.push(state.current)
        }
        state.current = {
            orderIndex,
        }
    }

    /** Closes out the field currently open, then opens a new scalar field. */
    private openJsonbField(
        state: JsonbParseState,
        field: string,
    ): void {
        this.flushJsonbField(state)
        state.field = field
    }

    /**
     * Coerces a raw jsonb field value: an integer string -> number, `true` /
     * `false` -> boolean, otherwise the trimmed markdown string is kept as-is.
     */
    private coerceScalar(raw: string): string | number | boolean {
        // a pure integer literal becomes a real number
        if (/^-?\d+$/.test(raw)) {
            return Number.parseInt(raw,
                10)
        }
        // the two boolean literals become real booleans
        if (raw === "true") {
            return true
        }
        if (raw === "false") {
            return false
        }
        // everything else stays a verbatim markdown string
        return raw
    }

    /**
     * Collects the indices of the lines that satisfy `predicate`.
     */
    private lineIndicesMatching(
        lines: Array<string>,
        predicate: (line: string) => boolean,
    ): Array<number> {
        const indices: Array<number> = []
        // a single pass keeps the two delimiter scans terse and identical
        for (let index = 0; index < lines.length; index += 1) {
            if (predicate(lines[index])) {
                indices.push(index)
            }
        }
        return indices
    }

    /**
     * Checks whether a line is a `@starci/seperator` delimiter marker.
     */
    private isSeparatorLine(line: string): boolean {
        return MOUNT_SECTION_DELIMITER_LINE_RE.test(line)
    }

    /**
     * Checks whether a line is a `@starci/jsonb` wrapper marker.
     */
    private isJsonbLine(line: string): boolean {
        return MOUNT_JSONB_DELIMITER_LINE_RE.test(line)
    }

    /**
     * Narrows an unknown value to a plain (non-array, non-null) object.
     */
    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null && !Array.isArray(value)
    }
}
