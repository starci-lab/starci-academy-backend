import {
    readFileSync,
} from "node:fs"
import ms from "ms"
import {
    EnvFileConflictException,
} from "@modules/platform/exceptions/errors/env/env-file-conflict"
import {
    EnvFileUnreadableException,
} from "@modules/platform/exceptions/errors/env/env-file-unreadable"
import type {
    ParseEnvBooleanParams,
    ParseEnvFloatParams,
    ParseEnvJsonParams,
    ParseEnvIntParams,
    ParseEnvMsParams,
    ParseEnvSecondParams,
    ParseEnvStringParams,
    ParseEnvStringListParams,
} from "../types/parse-env"

/**
 * Parse an env var as integer (radix 10). Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns Parsed number
 */
export const parseEnvInt = ({ key, defaultValue }: ParseEnvIntParams): number => {
    return Number.parseInt(process.env[key] ?? defaultValue.toString(),
        10)
}

/**
 * Parse an env var as float. Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns Parsed number
 */
export const parseEnvFloat = ({ key, defaultValue }: ParseEnvFloatParams): number => {
    return Number.parseFloat(process.env[key] ?? defaultValue.toString())
}

/**
 * Parse an env var as boolean ("true"/"false", case-insensitive). Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns Parsed boolean
 */
export const parseEnvBoolean = ({ key, defaultValue }: ParseEnvBooleanParams): boolean => {
    const envValue = process.env[key]
    if (envValue === undefined) return defaultValue
    return envValue.trim().toLowerCase() === "true"
}

/**
 * Read an env var as string. Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns String value
 */
export const parseEnvString = (
    { 
        key, 
        defaultValue 
    }: ParseEnvStringParams
): string => {
    const raw = process.env[key]
    if (raw === undefined || raw.trim() === "") {
        return defaultValue
    }
    return raw
}

/**
 * Parse an env var as a list of strings. Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns List of strings
 */
export const parseEnvStringList = (
    { 
        key, 
        defaultValue 
    }: ParseEnvStringListParams
): Array<string> => {
    return (process.env[key] ?? defaultValue).split(",")
}

/**
 * Parse an env var as duration (ms string, e.g. "10s", "1m"). Returns milliseconds as number.
 *
 * @param params - key and defaultValue (ms string)
 * @returns Duration in milliseconds
 */
export const parseEnvMs = (
    { 
        key, 
        defaultValue 
    }: ParseEnvMsParams
): number => {
    return Number.parseInt(
        ms((process.env[key] ?? defaultValue) as ms.StringValue).toString(),
        10
    )
}

/**
 * Parse an env var as duration (ms string), then return seconds (floored).
 *
 * @param params - key and defaultValue (ms string)
 * @returns Duration in seconds
 */
export const parseEnvSecond = (
    { 
        key, 
        defaultValue 
    }: ParseEnvSecondParams
): number => {
    const msValue = ms((process.env[key] ?? defaultValue) as ms.StringValue)
    return Math.floor(Number(msValue) / 1000)
}

/**
 * Parse an env var as JSON. Uses default when unset.
 *
 * @param params - key and defaultValue
 * @returns Parsed JSON value
 */
export const parseEnvJson = <T>(
    { 
        key, 
        defaultValue 
    }: ParseEnvJsonParams
): T => {
    return JSON.parse(process.env[key] ?? defaultValue) as T
}

/**
 * Cache of already-read secret files, keyed by the resolved path.
 *
 * `envConfig()` is called per read rather than memoised, so without this a
 * secret-heavy config tree would re-open the same file on every call. Scoped to
 * {@link parseEnvSecret} alone -- the other parsers never touch the filesystem,
 * so there is nothing for them to cache.
 */
const secretFileValues = new Map<string, string>()

/**
 * Read a SECRET, honouring the `<KEY>_FILE` pointer convention. Uses default
 * when neither `<KEY>_FILE` nor `<KEY>` is set.
 *
 * DELIBERATELY A SEPARATE FUNCTION FROM THE PARSERS ABOVE, rather than one
 * `_FILE` branch shared by all of them. A shared branch makes every env key
 * file-backable with zero per-key work, which sounds like a feature and is the
 * opposite of one: nothing in the source would then state WHICH keys are
 * secrets, so a reviewer cannot tell `parseEnvInt({ key: "CORE_PORT" })` apart
 * from a credential without reading every call site. Calling this function IS
 * that statement -- a key that never should have been file-backed (`CORE_PORT`,
 * `CORS_ORIGIN_1`) simply cannot reach this code path, because nothing calls it
 * with that key.
 *
 * THIS IS WHERE A SECRET STOPS BEING AN ENVIRONMENT VARIABLE. An env var is
 * readable by anyone who can run `docker inspect` on the box, and it is
 * inherited by every child process the app spawns. A mounted file is readable
 * by this process. So every credential this app takes is supplied as
 * `<KEY>_FILE=/run/secrets/<name>` with the plain key left unset -- the same
 * convention postgres, redis and mysql have used for years, which is what makes
 * it recognisable to an operator who has never read this codebase.
 *
 * A POINTER THAT EXISTS AND CANNOT BE READ IS A HARD FAILURE, not a fall-back
 * to the default. The pointer is generated, not hand-written, so a pointer
 * present means somebody deliberately put a file behind it; an unreadable one
 * is a secret declared and never created, a mount that did not happen, or a
 * name that drifted -- each of which otherwise produces a boot that goes green
 * while the app quietly runs without a credential it was given, the symptom
 * surfacing at whichever call site first needs it.
 *
 * The optional case is unchanged and still free: leave `<KEY>_FILE` unset and
 * the default applies exactly as before.
 *
 * @param params - key and defaultValue; `<key>_FILE` is derived from key
 * @returns File contents (trailing whitespace stripped), the env var, or the default
 * @throws EnvFileConflictException when both `<key>` and `<key>_FILE` are set
 * @throws EnvFileUnreadableException when `<key>_FILE` is set but unusable or empty
 */
export const parseEnvSecret = (
    {
        key,
        defaultValue
    }: ParseEnvStringParams
): string => {
    const pointer = process.env[`${key}_FILE`]
    const inline = process.env[key]
    // no pointer: fall through to the ordinary string parser (env var or default)
    if (pointer === undefined || pointer.trim() === "") {
        return parseEnvString({
            key,
            defaultValue,
        })
    }
    const path = pointer.trim()
    // both set is refused rather than resolved -- a silent winner is a stack
    // running on a credential nobody chose
    if (inline !== undefined && inline.trim() !== "") {
        throw new EnvFileConflictException({
            key,
            path,
        })
    }
    const cached = secretFileValues.get(path)
    if (cached !== undefined) return cached
    let contents: string
    try {
        contents = readFileSync(path,
            "utf8")
    } catch (error) {
        throw new EnvFileUnreadableException({
            key,
            path,
            originalError: error as Error,
        })
    }
    // strip the trailing newline an editor or a heredoc leaves behind, which
    // would otherwise corrupt every header the value is interpolated into
    const value = contents.trimEnd()
    // an empty file is a pointer that promises a secret and delivers none
    if (value === "") {
        throw new EnvFileUnreadableException({
            key,
            path,
        })
    }
    secretFileValues.set(path,
        value)
    return value
}

/**
 * Whether the process is running inside Kubernetes (detected via KUBERNETES_SERVICE_HOST/PORT).
 *
 * @returns True if K8s env vars are set
 */
export const runInKubernetes = (): boolean => {
    return Boolean(process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT)
}