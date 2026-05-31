import path from "path"
import fs from "fs/promises"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    ContextLoaderService,
} from "../../shared"
import {
    ContextFileNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"
import {
    MindMapParserService,
} from "./mind-map.service"

/**
 * Absolute path to the courses mount root used to back the {@link ContextLoaderService} mock.
 *
 * Resolved from this spec's own location (`<repo>/src/modules/init/seeders/courses/parsers`)
 * rather than `process.cwd()` so the path stays correct regardless of the directory Jest is
 * launched from.
 */
const COURSES_MOUNT_ROOT = path.resolve(
    __dirname,
    "../../../../../..",
    ".mount/data/courses",
)

/** Course folder that contains the real `mind-map.yaml` fixture. */
const FULLSTACK_MASTERY_RELATIVE_PATH = "0-fullstack-mastery"

/** Module folder under the course that has no `mind-map.yaml` (missing-file case). */
const MODULE_WITHOUT_MIND_MAP_RELATIVE_PATH =
    "0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle"

/** Expected root `label` decoded from the real fixture. */
const EXPECTED_ROOT_LABEL = "Fullstack Mastery"

describe("MindMapParserService",
    () => {
        let module: TestingModule
        let service: MindMapParserService

        beforeEach(async () => {
            // ContextLoader mock reads straight off the mount; ENOENT → ContextFileNotFoundException,
            // mirroring the real loader so the parser's catch-and-return-null branch is exercised
            const contextLoaderService = {
                load: jest.fn(
                    async (
                        _baseDir: string,
                        relativePath: string,
                    ): Promise<string> => {
                        try {
                            return await fs.readFile(
                                path.join(
                                    COURSES_MOUNT_ROOT,
                                    relativePath,
                                ),
                                "utf8",
                            )
                        } catch (error) {
                            throw new ContextFileNotFoundException({
                                relativePath,
                                originalError: error,
                            })
                        }
                    },
                ),
            }

            module = await Test.createTestingModule({
                providers: [
                    MindMapParserService,
                    {
                        provide: ContextLoaderService,
                        useValue: contextLoaderService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                            error: jest.fn(),
                            warn: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<MindMapParserService>(MindMapParserService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("parse",
            () => {
                it(
                    "parses a course mind-map.yaml",
                    async () => {
                        const result = await service.parse({
                            courseRelativePath: FULLSTACK_MASTERY_RELATIVE_PATH,
                        })

                        expect(result).not.toBeNull()
                        expect(result?.label).toBe(EXPECTED_ROOT_LABEL)
                        expect(typeof result?.label).toBe("string")
                        expect(Array.isArray(result?.children)).toBe(true)
                    },
                )

                it(
                    "returns null when mind-map.yaml is missing",
                    async () => {
                        const result = await service.parse({
                            courseRelativePath: MODULE_WITHOUT_MIND_MAP_RELATIVE_PATH,
                        })

                        expect(result).toBeNull()
                    },
                )
            },
        )
    },
)
