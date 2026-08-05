import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from "fs/promises"
import {
    tmpdir,
} from "os"
import path from "path"

/** Params for {@link compileCvPdf}. */
export interface CompileCvPdfParams {
    /** Raw LaTeX (`.tex`) source to compile. */
    latex: string
    /** Job id -- used only to namespace the temp working directory. */
    jobId: string
}

/** Wall-clock budget for a single compile attempt. */
const COMPILE_TIMEOUT_MS = 60_000

/**
 * Compiles a `.tex` source into a PDF via `tectonic` -- a self-contained,
 * single-binary LaTeX engine (no full TeXLive install needed; packages fetch
 * on demand from its bundle). Writes the source to a scratch temp dir, shells
 * out to the CLI, reads the produced PDF back, then always cleans up the temp
 * dir.
 *
 * Best-effort by design: any failure (binary missing -- e.g. local dev without
 * `tectonic` installed, a compile error in the AI-generated `.tex`, timeout) is
 * caught here and surfaced as a `null` return, never thrown. The caller (the
 * render step) degrades to offering the raw `.tex` download -- the same
 * "graceful degrade" contract the FE preview already has.
 *
 * @returns the compiled PDF bytes, or `null` on any failure.
 */
export const compileCvPdf = async (
    {
        latex,
        jobId,
    }: CompileCvPdfParams,
): Promise<Buffer | null> => {
    const tempDir = await mkdtemp(
        path.join(tmpdir(),
            `cv-pdf-${jobId}-`),
    )
    const texPath = path.join(tempDir,
        "cv.tex")
    const pdfPath = path.join(tempDir,
        "cv.pdf")

    try {
        await writeFile(texPath,
            latex,
            "utf8")
        // dynamic import -- `execa` is ESM-only; a static import at the top of
        // this file would make Jest eagerly `require()` it into every consumer's
        // module graph (even specs that never call `compileCvPdf`), which
        // crashes under ts-jest's CJS transform. Deferring to call-time avoids
        // that entirely.
        const { execa } = await import("execa")
        // exit-code-only failure semantics -- tectonic writes normal progress
        // chatter to stderr even on success, so a generic "any stderr = failure"
        // wrapper would false-negative here.
        await execa(
            "tectonic",
            [
                texPath,
                "--outdir",
                tempDir,
                "--chatter",
                "minimal",
            ],
            {
                timeout: COMPILE_TIMEOUT_MS,
            },
        )
        return await readFile(pdfPath)
    } catch {
        return null
    } finally {
        await rm(
            tempDir,
            {
                recursive: true,
                force: true,
            },
        )
    }
}
