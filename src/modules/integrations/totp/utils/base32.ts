/** RFC 4648 base32 alphabet (no padding) used for TOTP secrets. */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/**
 * Encode a buffer to an unpadded RFC 4648 base32 string (TOTP secret format).
 *
 * @param buffer - Raw bytes to encode.
 * @returns The base32 representation (A–Z, 2–7), no `=` padding.
 */
export const base32Encode = (buffer: Buffer): string => {
    // accumulate bits 5 at a time across byte boundaries
    let bits = 0
    let value = 0
    let output = ""
    for (const byte of buffer) {
        // shift the new byte into the low 8 bits of the accumulator
        value = (value << 8) | byte
        bits += 8
        // drain whole 5-bit groups into base32 symbols
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
            bits -= 5
        }
    }
    // flush the trailing partial group (left-aligned) if any bits remain
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
    }
    return output
}

/**
 * Decode an RFC 4648 base32 string back to bytes. Tolerates lowercase,
 * whitespace, and `=` padding (all stripped before decoding).
 *
 * @param input - The base32 string to decode.
 * @returns The decoded bytes.
 */
export const base32Decode = (input: string): Buffer => {
    // normalize: uppercase, drop padding + whitespace the authenticator may add
    const normalized = input
        .toUpperCase()
        .replace(/=+$/g,
            "")
        .replace(/\s+/g,
            "")
    let bits = 0
    let value = 0
    const bytes = Array<number>()
    for (const char of normalized) {
        // map each symbol back to its 5-bit value; ignore unknown chars
        const index = BASE32_ALPHABET.indexOf(char)
        if (index === -1) {
            continue
        }
        value = (value << 5) | index
        bits += 5
        // emit a byte whenever 8+ bits have accumulated
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff)
            bits -= 8
        }
    }
    return Buffer.from(bytes)
}
