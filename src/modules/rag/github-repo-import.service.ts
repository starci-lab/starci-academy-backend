import {
    Injectable,
} from "@nestjs/common"
import type {
    Document,
} from "@langchain/core/documents"
import {
    RagPlaygroundImportException,
} from "@modules/exceptions"

/** Only `https://github.com/<owner>/<repo>` URLs are accepted — never fetch an arbitrary host (SSRF guard). */
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/

/** GitHub requires a User-Agent on every REST API request. */
const USER_AGENT = "StarCi-RAG-Playground"

/** Max files pulled from one repo (bounds indexing time + Qdrant load). */
const MAX_FILES = 25

/** Max bytes of any single file considered (skips generated/vendored giants). */
const MAX_FILE_BYTES = 20_000

/** Max total bytes across all imported files (bounds the whole import). */
const MAX_TOTAL_BYTES = 200_000

/** How many raw-file fetches run concurrently. */
const FETCH_CONCURRENCY = 6

/** File extensions worth indexing (source + docs; binaries/lockfiles excluded). */
const ALLOWED_EXTENSIONS = new Set([
    "ts",
    "tsx",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "py",
    "go",
    "rs",
    "java",
    "kt",
    "cs",
    "rb",
    "php",
    "c",
    "cpp",
    "h",
    "hpp",
    "md",
    "mdx",
    "json",
    "yaml",
    "yml",
    "sql",
    "graphql",
    "proto",
])

/** Path segments that mark a file as generated/vendored/irrelevant — always skipped. */
const EXCLUDED_PATH_SEGMENTS = [
    "node_modules/",
    "dist/",
    "build/",
    ".git/",
    "vendor/",
    "coverage/",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
]

/** One entry of a GitHub tree API response. */
interface GithubTreeEntry {
    path: string
    type: string
    size?: number
}

/**
 * Imports a PUBLIC GitHub repository into LangChain {@link Document}s for the
 * RAG Playground — fetched entirely through the GitHub REST API (never a raw
 * `git clone`, so there is no local temp-dir / disk-usage / binary-execution
 * surface). Only `github.com/<owner>/<repo>` URLs are accepted; every fetch
 * target is built from the validated `owner`/`repo`, never from user input
 * directly, closing the SSRF door.
 */
@Injectable()
export class GithubRepoImportService {
    /**
     * Fetch + filter a public repo's importable source files.
     *
     * @param githubUrl - A `https://github.com/<owner>/<repo>` URL.
     * @returns One {@link Document} per imported file (`metadata.filePath` set).
     * @throws RagPlaygroundImportException on an invalid URL, a private/missing
     *   repo, or a repo with no importable files after the extension/size filters.
     */
    async importRepo(
        githubUrl: string,
    ): Promise<Array<Document>> {
        const match = GITHUB_URL_PATTERN.exec(githubUrl.trim())
        if (!match) {
            throw new RagPlaygroundImportException({
                reason: "Chỉ hỗ trợ link GitHub công khai dạng https://github.com/owner/repo",
            })
        }
        const [, owner,
            repo] = match

        const repoInfo = await this.fetchJson<{ default_branch: string; private: boolean; size: number }>(
            `https://api.github.com/repos/${owner}/${repo}`,
        )
        if (!repoInfo || repoInfo.private) {
            throw new RagPlaygroundImportException({
                reason: "Không tìm thấy repo công khai này (có thể là repo riêng tư hoặc không tồn tại)",
            })
        }

        const tree = await this.fetchJson<{ tree: Array<GithubTreeEntry> }>(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`,
        )
        const candidates = (tree?.tree ?? []).filter((entry) => this.isImportable(entry))

        // smaller files first — packs more distinct files within the byte budget
        candidates.sort((left, right) => (left.size ?? 0) - (right.size ?? 0))

        const selected: Array<GithubTreeEntry> = []
        let totalBytes = 0
        for (const entry of candidates) {
            if (selected.length >= MAX_FILES || totalBytes >= MAX_TOTAL_BYTES) {
                break
            }
            selected.push(entry)
            totalBytes += entry.size ?? 0
        }

        if (selected.length === 0) {
            throw new RagPlaygroundImportException({
                reason: "Không tìm thấy file phù hợp để index trong repo này (đã lọc file nhị phân/vendor/quá lớn)",
            })
        }

        const documents = await this.fetchFilesInBatches({
            owner,
            repo,
            ref: repoInfo.default_branch,
            paths: selected.map((entry) => entry.path),
        })
        if (documents.length === 0) {
            throw new RagPlaygroundImportException({
                reason: "Không tải được nội dung file nào từ repo này",
            })
        }
        return documents
    }

    /**
     * A tree entry is importable when it's a file, small enough, has an
     * allowed extension, and isn't under an excluded (generated/vendored) path.
     *
     * @param entry - One GitHub tree API entry.
     * @returns Whether the entry should be fetched.
     */
    private isImportable(
        entry: GithubTreeEntry,
    ): boolean {
        if (entry.type !== "blob") {
            return false
        }
        if ((entry.size ?? 0) > MAX_FILE_BYTES) {
            return false
        }
        if (EXCLUDED_PATH_SEGMENTS.some((segment) => entry.path.includes(segment))) {
            return false
        }
        const extension = entry.path.split(".").pop()?.toLowerCase()
        return Boolean(extension && ALLOWED_EXTENSIONS.has(extension))
    }

    /**
     * Fetch the selected files' raw content in bounded-concurrency batches.
     *
     * @param params - Repo coordinates + the file paths to fetch.
     * @returns One Document per file that fetched successfully (failures are skipped, not thrown).
     */
    private async fetchFilesInBatches(
        {
            owner,
            repo,
            ref,
            paths,
        }: {
            owner: string
            repo: string
            ref: string
            paths: Array<string>
        },
    ): Promise<Array<Document>> {
        const documents: Array<Document> = []
        for (let index = 0; index < paths.length; index += FETCH_CONCURRENCY) {
            const batch = paths.slice(index,
                index + FETCH_CONCURRENCY)
            const results = await Promise.all(
                batch.map((path) => this.fetchRawFile({
                    owner,
                    repo,
                    ref,
                    path,
                })),
            )
            for (const document of results) {
                if (document) {
                    documents.push(document)
                }
            }
        }
        return documents
    }

    /**
     * Fetch one file's raw content, or null on any failure (best-effort — a
     * single broken file must never sink the whole import).
     */
    private async fetchRawFile(
        {
            owner,
            repo,
            ref,
            path,
        }: {
            owner: string
            repo: string
            ref: string
            path: string
        },
    ): Promise<Document | null> {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`,
                {
                    headers: {
                        "User-Agent": USER_AGENT,
                    },
                },
            )
            if (!response.ok) {
                return null
            }
            const content = await response.text()
            return {
                pageContent: content,
                metadata: {
                    filePath: path,
                },
            } as Document
        } catch {
            return null
        }
    }

    /**
     * GET one GitHub REST API endpoint as JSON, or null on any non-2xx / network failure.
     */
    private async fetchJson<T>(
        url: string,
    ): Promise<T | null> {
        try {
            const response = await fetch(
                url,
                {
                    headers: {
                        "User-Agent": USER_AGENT,
                        "Accept": "application/vnd.github+json",
                    },
                },
            )
            if (!response.ok) {
                return null
            }
            return await response.json() as T
        } catch {
            return null
        }
    }
}
