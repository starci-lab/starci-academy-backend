import {
    mkdtemp,
    mkdir,
    writeFile,
    rm,
} from "fs/promises"
import {
    tmpdir,
} from "os"
import {
    join,
} from "path"
import {
    diffSnapshots,
} from "../utils/diff-snapshots"

/**
 * Filesystem-diff coverage for {@link diffSnapshots} — the content-hash compare
 * that replaces the GitHub compare API. Each test materializes two real snapshot
 * directories in a temp area, runs the diff, then asserts the changed-path set.
 */
describe("diffSnapshots",
    () => {
        let workdir: string
        let oldRoot: string
        let newRoot: string

        beforeEach(async () => {
            workdir = await mkdtemp(join(tmpdir(),
                "diff-snap-"))
            oldRoot = join(workdir,
                "old")
            newRoot = join(workdir,
                "new")
            await mkdir(oldRoot,
                {
                    recursive: true,
                })
            await mkdir(newRoot,
                {
                    recursive: true,
                })
        })

        afterEach(async () => {
            await rm(workdir,
                {
                    recursive: true, force: true,
                })
        })

        /** Write a file (creating parent dirs) under a snapshot root. */
        const put = async (
            root: string,
            relative: string,
            content: string,
        ): Promise<void> => {
            const full = join(root,
                relative)
            await mkdir(join(full,
                ".."),
            {
                recursive: true,
            })
            await writeFile(full,
                content,
                "utf8")
        }

        it("reports an added file (present in new only)",
            async () => {
                await put(newRoot,
                    "courses/0-fs/modules/4-x/en.md",
                    "hello")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed).toEqual([
                    "courses/0-fs/modules/4-x/en.md",
                ])
            })

        it("reports a removed file (present in old only)",
            async () => {
                await put(oldRoot,
                    "courses/0-fs/milestones/2-y/vi.md",
                    "bye")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed).toEqual([
                    "courses/0-fs/milestones/2-y/vi.md",
                ])
            })

        it("reports a modified file (same path, different content)",
            async () => {
                await put(oldRoot,
                    "courses/0-fs/modules/4-x/en.md",
                    "v1")
                await put(newRoot,
                    "courses/0-fs/modules/4-x/en.md",
                    "v2")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed).toEqual([
                    "courses/0-fs/modules/4-x/en.md",
                ])
            })

        it("ignores an unchanged file (identical bytes in both)",
            async () => {
                await put(oldRoot,
                    "courses/0-fs/modules/4-x/en.md",
                    "same")
                await put(newRoot,
                    "courses/0-fs/modules/4-x/en.md",
                    "same")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed).toEqual([])
            })

        it("returns slash-joined paths relative to the snapshot root (no root prefix)",
            async () => {
                // a deeply nested change must come back as a clean repo-relative path
                await put(newRoot,
                    "courses/0-fs/modules/4-x/contents/2-z/challenges/1-c-easy/vi.md",
                    "x")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed).toEqual([
                    "courses/0-fs/modules/4-x/contents/2-z/challenges/1-c-easy/vi.md",
                ])
            })

        it("treats a missing baseline as all-added (first snapshot)",
            async () => {
                await rm(oldRoot,
                    {
                        recursive: true, force: true,
                    })
                await put(newRoot,
                    "courses/0-fs/en.md",
                    "a")
                await put(newRoot,
                    "foundations/x.yaml",
                    "b")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed.sort()).toEqual([
                    "courses/0-fs/en.md",
                    "foundations/x.yaml",
                ])
            })

        it("collects a mixed add + remove + modify in one pass",
            async () => {
                await put(oldRoot,
                    "keep.md",
                    "same")
                await put(newRoot,
                    "keep.md",
                    "same")
                await put(oldRoot,
                    "gone.md",
                    "old")
                await put(newRoot,
                    "added.md",
                    "new")
                await put(oldRoot,
                    "edit.md",
                    "before")
                await put(newRoot,
                    "edit.md",
                    "after")

                const changed = await diffSnapshots(oldRoot,
                    newRoot)

                expect(changed.sort()).toEqual([
                    "added.md",
                    "edit.md",
                    "gone.md",
                ])
            })
    })
