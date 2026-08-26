import {
    parseEnvBoolean,
    parseEnvJson,
    parseEnvSecret,
    parseEnvString,
    parseEnvStringList,
    runInKubernetes,
} from "./parse-env"
import {
    readFileSync,
} from "node:fs"
import {
    EnvFileConflictException,
} from "@modules/platform/exceptions/errors/env/env-file-conflict"
import {
    EnvFileUnreadableException,
} from "@modules/platform/exceptions/errors/env/env-file-unreadable"

jest.mock("node:fs",
    () => ({
        readFileSync: jest.fn(),
    }))

describe("environment parsers",
    () => {
        const original = process.env

        beforeEach(() => {
            jest.mocked(readFileSync).mockReset()
            process.env = {
                ...original
            }
            delete process.env.TEST_VALUE
            delete process.env.TEST_VALUE_FILE
            delete process.env.KUBERNETES_SERVICE_HOST
            delete process.env.KUBERNETES_SERVICE_PORT
        })
        afterAll(() => {
            process.env = original
        })

        it("uses defaults and parses booleans/lists/json",
            () => {
                expect(parseEnvBoolean({
                    key: "TEST_VALUE", defaultValue: true
                })).toBe(true)
                process.env.TEST_VALUE = " FALSE "
                expect(parseEnvBoolean({
                    key: "TEST_VALUE", defaultValue: true
                })).toBe(false)
                expect(parseEnvString({
                    key: "TEST_VALUE", defaultValue: "fallback"
                })).toBe(" FALSE ")
                expect(parseEnvStringList({
                    key: "MISSING", defaultValue: "one,two"
                })).toEqual(["one",
                    "two"])
                expect(parseEnvJson<{ ok: boolean }>({
                    key: "MISSING", defaultValue: "{\"ok\":true}"
                })).toEqual({
                    ok: true
                })
            })

        it("reads and caches secret files, while detecting Kubernetes",
            () => {
                process.env.TEST_VALUE = "inline"
                expect(parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback"
                })).toBe("inline")
                process.env.KUBERNETES_SERVICE_HOST = "kube"
                process.env.KUBERNETES_SERVICE_PORT = "443"
                expect(runInKubernetes()).toBe(true)
            })

        it("reads a secret pointer once and trims its trailing newline",
            () => {
                process.env.TEST_VALUE_FILE = "secret-pointer-a"
                jest.mocked(readFileSync).mockReturnValue("from-file\n")

                expect(parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback",
                })).toBe("from-file")
                expect(parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback",
                })).toBe("from-file")
                expect(readFileSync).toHaveBeenCalledTimes(1)
            })

        it("rejects conflicting, unreadable, and empty secret pointers",
            () => {
                process.env.TEST_VALUE_FILE = "secret-pointer-conflict"
                process.env.TEST_VALUE = "inline"
                expect(() => parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback",
                })).toThrow(EnvFileConflictException)

                delete process.env.TEST_VALUE
                jest.mocked(readFileSync).mockImplementation(() => {
                    throw new Error("permission denied")
                })
                expect(() => parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback",
                })).toThrow(EnvFileUnreadableException)

                process.env.TEST_VALUE_FILE = "secret-pointer-empty"
                jest.mocked(readFileSync).mockReturnValue("\n")
                expect(() => parseEnvSecret({
                    key: "TEST_VALUE", defaultValue: "fallback",
                })).toThrow(EnvFileUnreadableException)
            })
    })
