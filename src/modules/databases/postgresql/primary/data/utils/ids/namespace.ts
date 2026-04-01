/**
 * UUID namespace for course IDs.
 */
import {
    parse,
} from "uuid"

/**
 * Deterministic namespace (DNS UUID) for v5 IDs.
 *
 * `uuid.v5` in our uuid version expects a 16-byte namespace, not a string.
 */
export const COURSE_UUID_NAMESPACE = parse("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

