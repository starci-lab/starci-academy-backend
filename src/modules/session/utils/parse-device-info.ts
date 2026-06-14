import {
    UAParser,
} from "ua-parser-js"
import geoip from "geoip-lite"
import type {
    Request,
} from "express"
import type {
    DeviceInfo,
} from "../types"

/**
 * Parses a raw `User-Agent` string into coarse device facts.
 *
 * @param userAgent - The `User-Agent` header value (may be undefined).
 * @returns Device class, OS, and browser names (each null when unknown).
 *
 * @example
 * parseUserAgent("Mozilla/5.0 (Windows NT 10.0...) Chrome/120 ...")
 * // => { deviceType: "desktop", os: "Windows", browser: "Chrome" }
 */
export const parseUserAgent = (userAgent: string | undefined): DeviceInfo => {
    // no header → nothing to parse; surface an all-null record
    if (!userAgent) {
        return {
            deviceType: null,
            os: null,
            browser: null,
        }
    }
    // ua-parser-js extracts browser/os/device from the user-agent grammar
    const result = new UAParser(userAgent).getResult()
    return {
        // device.type is undefined for desktops → normalise to the "desktop" class
        deviceType: result.device.type ?? "desktop",
        // os/browser names are undefined on unrecognised agents → null
        os: result.os.name ?? null,
        browser: result.browser.name ?? null,
    }
}

/**
 * Extracts the client IP from a request. Relies on Express `trust proxy` being
 * enabled so `req.ip` already reflects the left-most `X-Forwarded-For` hop set by
 * the upstream reverse proxy (Traefik); falls back to the raw socket address.
 *
 * @param req - The incoming Express request.
 * @returns The client IP (IPv4-normalised), or null when it cannot be determined.
 */
export const extractClientIp = (req: Request): string | null => {
    // req.ip is the trusted client IP once `trust proxy` is configured
    const raw = req.ip ?? req.socket?.remoteAddress ?? null
    // no address available (e.g. synthetic requests in tests)
    if (!raw) {
        return null
    }
    // strip the IPv4-mapped IPv6 prefix so "::ffff:1.2.3.4" becomes "1.2.3.4"
    return raw.replace(/^::ffff:/,
        "")
}

/**
 * Resolves a human-readable location from an IP using the offline geoip-lite
 * database (no network call, no rate limit). Loopback/private/IPv6 addresses
 * that the database cannot place return null.
 *
 * @param ipAddress - The client IP to look up (may be null).
 * @returns A "City, COUNTRY" (or "COUNTRY") string, or null when unknown.
 *
 * @example
 * resolveLocation("8.8.8.8") // => "US"
 */
export const resolveLocation = (ipAddress: string | null): string | null => {
    // nothing to look up
    if (!ipAddress) {
        return null
    }
    // offline lookup against the bundled MaxMind-lite dataset
    const geo = geoip.lookup(ipAddress)
    // address not present in the dataset (loopback/private/unallocated)
    if (!geo || !geo.country) {
        return null
    }
    // prefer "City, COUNTRY" when the city is known, otherwise just the country code
    return geo.city ? `${geo.city}, ${geo.country}` : geo.country
}
