import {
    Injectable,
} from "@nestjs/common"
import crypto from "crypto"

export type Sha256DigestEncoding = "hex" | "base64"

/**
 * SHA-256 over an ordered list of UTF-8 strings.
 *
 * Parts are separated by a NUL byte in the preimage so
 * `["a","bc"]` and `["ab","c"]` do not collide (unlike naive concatenation).
 */
@Injectable()
export class Sha256Service {
    /**
     * @param parts - Segments in order; each element is hashed as UTF-8.
     * @returns The SHA-256 hash of the parts.
     */
    hash(
        ...parts: Array<string>
    ): string {
        const hash = crypto.createHash("sha256")
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                hash.update(
                    "\0",
                    "utf8",
                )
            }
            hash.update(
                parts[i] ?? "",
                "utf8",
            )
        }
        return hash.digest("hex")
    }
}
