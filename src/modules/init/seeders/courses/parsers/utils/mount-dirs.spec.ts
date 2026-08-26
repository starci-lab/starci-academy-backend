import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
    listIndexedMountChildIndices,
    parseIndexedMountDirName,
} from "./mount-dirs"

describe("mount directory helpers",
    () => {
        it("parses slugged, numeric-only, and invalid names",
            () => {
                expect(parseIndexedMountDirName("12-backend")).toEqual({
                    orderIndex: 12, displaySlug: "backend"
                })
                expect(parseIndexedMountDirName("3")).toEqual({
                    orderIndex: 3, displaySlug: "3"
                })
                expect(parseIndexedMountDirName("not-indexed")).toBeNull()
            })

        it("lists distinct sorted directory indices and ignores files",
            () => {
                const root = fs.mkdtempSync(path.join(os.tmpdir(),
                    "mount-dirs-"))
                fs.mkdirSync(path.join(root,
                    "10-later"))
                fs.mkdirSync(path.join(root,
                    "2-first"))
                fs.mkdirSync(path.join(root,
                    "2-duplicate"))
                fs.mkdirSync(path.join(root,
                    "not-indexed"))
                fs.writeFileSync(path.join(root,
                    "3-file"),
                "file")
                expect(listIndexedMountChildIndices(root)).toEqual([2,
                    10])
                expect(listIndexedMountChildIndices(path.join(root,
                    "missing"))).toEqual([])
                fs.rmSync(root,
                    {
                        recursive: true, force: true
                    })
            })
    })
