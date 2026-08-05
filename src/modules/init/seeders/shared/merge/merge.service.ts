import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import type {
    ArrayTrailEntry,
    LocaleJson,
    MergeJsonParams,
    MergeJsonResult,
    MergeJsonTranslationRow,
} from "./types"

@Injectable()
/**
 * Builds one canonical mount JSON tree (English/default locale) and attaches
 * `translations` on the root and on every array item located by
 * `translateFields` -- matching how course parsers align `orderIndex` rows.
 *
 * Supports nested arrays via dot-path (e.g. `"requirements.data.title"`):
 * each array level on the path is aligned across locales by `orderIndex`, so
 * `requirements[].data[].title` from English and Vietnamese end up on the
 * same `data` item even though both `requirements` and `data` are arrays.
 */
export class MergeJsonService {
    /**
     * @param params - Locale extracts + dot-paths to translatable scalar leaves.
     * @returns Canonical tree from English with `translations` on root and array items.
     */
    merge<T extends Record<string, unknown>>(
        params: MergeJsonParams<T>,
    ): MergeJsonResult<T> {
        const {
            jsons,
            translateFields,
        } = params
        // empty locale list is a programmer error -- fail loud
        if (jsons.length === 0) {
            throw new MissingRequiredParameterException({
                parameter: "jsons",
            })
        }
        // English drives the canonical scalar tree; other locales contribute translation rows
        const canonical = this.resolveCanonicalJson(jsons)
        // walk the canonical tree once, attaching per-item translations for every array path
        const merged = this.mergeTree(
            canonical.json,
            jsons,
            translateFields,
            "",
            [],
        ) as MergeJsonResult<T>
        // root-level translation rows: only fields whose path never crosses an array
        const rootFields = translateFields.filter(
            (fieldPath) => !this.pathTraversesArray(canonical.json,
                fieldPath),
        )
        merged.translations = this.buildRootTranslations(jsons,
            rootFields)
        return merged
    }

    /**
     * Walks the canonical tree, attaching per-item `translations` on arrays whose
     * paths appear in `translateFields` (including nested arrays).
     *
     * `arrayTrail` carries the `orderIndex` of every array ancestor we descended
     * into; child invocations need it to look up the matching entry in non-English
     * locales when the leaf path crosses two or more arrays.
     */
    private mergeTree<T extends Record<string, unknown>>(
        node: unknown,
        jsons: Array<LocaleJson<T>>,
        translateFields: Array<string>,
        pathPrefix: string,
        arrayTrail: Array<ArrayTrailEntry>,
    ): unknown {
        if (Array.isArray(node)) {
            return node.map((entry) => {
                // shallow clone so we never mutate the caller's tree
                const record = structuredClone(entry) as Record<string, unknown>
                // entry's orderIndex aligns this row across locales (and pushes onto the trail)
                const orderIndex = record.orderIndex
                // leaf-translatable fields stored directly on each item at this array path
                const itemLeafFields = this.immediateItemLeafFields(
                    translateFields,
                    pathPrefix,
                )
                if (itemLeafFields.length > 0) {
                    record.translations = this.buildArrayItemTranslations(
                        jsons,
                        pathPrefix,
                        arrayTrail,
                        orderIndex,
                        itemLeafFields,
                    )
                }
                // descend into nested arrays under this item -- extend trail with THIS array entry
                const childTrail: Array<ArrayTrailEntry> = [
                    ...arrayTrail,
                    {
                        key: pathPrefix,
                        orderIndex,
                    },
                ]
                for (const nestedKey of this.nestedArrayKeysUnderPrefix(
                    translateFields,
                    pathPrefix,
                )) {
                    if (Array.isArray(record[nestedKey])) {
                        const nestedPath = pathPrefix
                            ? `${pathPrefix}.${nestedKey}`
                            : nestedKey
                        record[nestedKey] = this.mergeTree(
                            record[nestedKey],
                            jsons,
                            translateFields,
                            nestedPath,
                            childTrail,
                        )
                    }
                }
                return record
            })
        }
        if (this.isPlainObject(node)) {
            // object levels (root or nested) -- recurse into translateField-referenced arrays
            const record = structuredClone(node) as Record<string, unknown>
            for (const arrayKey of this.arrayKeysUnderPrefix(
                translateFields,
                pathPrefix,
                record,
            )) {
                if (Array.isArray(record[arrayKey])) {
                    const arrayPath = pathPrefix
                        ? `${pathPrefix}.${arrayKey}`
                        : arrayKey
                    record[arrayKey] = this.mergeTree(
                        record[arrayKey],
                        jsons,
                        translateFields,
                        arrayPath,
                        // object level does not add to the trail (trail tracks ARRAY ancestors only)
                        arrayTrail,
                    )
                }
            }
            return record
        }
        // scalar leaf -- nothing to merge at this level
        return node
    }

    /** Dot-path leaf fields stored directly on each array item (e.g. `"text"`). */
    private immediateItemLeafFields(
        translateFields: Array<string>,
        arrayPath: string,
    ): Array<string> {
        const prefix = arrayPath.length > 0 ? `${arrayPath}.` : ""
        return translateFields
            .filter((fieldPath) => {
                // root-only fields (no prefix) belong to root translations, not item translations
                if (arrayPath.length === 0) {
                    return false
                }
                if (!fieldPath.startsWith(prefix)) {
                    return false
                }
                const rest = fieldPath.slice(prefix.length)
                // immediate leaf = no further dot, so the field lives on the item itself
                return rest.length > 0 && !rest.includes(".")
            })
            .map((fieldPath) => fieldPath.slice(prefix.length))
    }

    /** First path segment under each array item that leads to a nested array. */
    private nestedArrayKeysUnderPrefix(
        translateFields: Array<string>,
        arrayPath: string,
    ): Array<string> {
        const prefix = arrayPath.length > 0 ? `${arrayPath}.` : ""
        const keys = new Set<string>()
        for (const fieldPath of translateFields) {
            if (!fieldPath.startsWith(prefix)) {
                continue
            }
            const rest = fieldPath.slice(prefix.length)
            // a leaf field at this exact array level has no dot in rest -- skip
            if (!rest.includes(".")) {
                continue
            }
            // the first segment of rest is the key to descend into (an array key)
            keys.add(rest.split(".")[0])
        }
        return Array.from(keys)
    }

    /** Top-level (or nested object) array keys referenced by `translateFields`. */
    private arrayKeysUnderPrefix(
        translateFields: Array<string>,
        pathPrefix: string,
        node: Record<string, unknown>,
    ): Array<string> {
        const prefix = pathPrefix.length > 0 ? `${pathPrefix}.` : ""
        const keys = new Set<string>()
        for (const fieldPath of translateFields) {
            if (!fieldPath.startsWith(prefix)) {
                continue
            }
            const rest = fieldPath.slice(prefix.length)
            if (rest.length === 0) {
                continue
            }
            keys.add(rest.split(".")[0])
        }
        // only descend into keys whose runtime value is actually an array
        return Array.from(keys).filter((key) => Array.isArray(node[key]))
    }

    /** True when any segment before the leaf crosses an array in the canonical tree. */
    private pathTraversesArray(root: unknown, fieldPath: string): boolean {
        const segments = this.splitFieldPath(fieldPath)
        let current: unknown = root
        // walk every segment up to (but not including) the leaf
        for (let index = 0; index < segments.length - 1; index += 1) {
            if (!this.isPlainObject(current)) {
                return false
            }
            current = current[segments[index]]
            if (Array.isArray(current)) {
                return true
            }
        }
        return false
    }

    /** Root / non-array translation rows (full dot-path as `field`). */
    private buildRootTranslations<T extends Record<string, unknown>>(
        jsons: Array<LocaleJson<T>>,
        rootFields: Array<string>,
    ): Array<MergeJsonTranslationRow> {
        const rows: Array<MergeJsonTranslationRow> = []
        for (const {
            json,
            locale,
        } of jsons) {
            for (const fieldPath of rootFields) {
                const value = this.getValueAtPath(json,
                    fieldPath)
                // skip when a locale omits this field -- entity table can stay sparse
                if (value === undefined) {
                    continue
                }
                rows.push({
                    locale,
                    field: fieldPath,
                    value: this.coerceTranslationValue(value),
                })
            }
        }
        return rows
    }

    /**
     * Per-item translation rows for one item at `arrayPath`, looking up the same
     * item in every locale by walking `arrayPath` and aligning ancestors via
     * `arrayTrail` + the current `itemOrderIndex`.
     */
    private buildArrayItemTranslations<T extends Record<string, unknown>>(
        jsons: Array<LocaleJson<T>>,
        arrayPath: string,
        arrayTrail: Array<ArrayTrailEntry>,
        itemOrderIndex: unknown,
        leafFields: Array<string>,
    ): Array<MergeJsonTranslationRow> {
        const rows: Array<MergeJsonTranslationRow> = []
        const segments = this.splitFieldPath(arrayPath)
        for (const {
            json,
            locale,
        } of jsons) {
            // walk arrayPath across this locale's tree; bridge arrays via the trail
            const leafArray = this.resolveLeafArray(json,
                segments,
                arrayTrail)
            if (!Array.isArray(leafArray)) {
                continue
            }
            // match the same item across locales by its authored orderIndex
            const item = leafArray.find(
                (entry) => this.isPlainObject(entry)
                    && entry.orderIndex === itemOrderIndex,
            )
            if (!this.isPlainObject(item)) {
                continue
            }
            for (const leafField of leafFields) {
                const value = item[leafField]
                if (value === undefined) {
                    continue
                }
                rows.push({
                    locale,
                    field: leafField,
                    value: this.coerceTranslationValue(value),
                })
            }
        }
        return rows
    }

    /**
     * Walks `segments` on `root` to reach the array at the leaf path; when an
     * intermediate segment yields an array (a parent bucket), pick the entry
     * whose `orderIndex` matches the corresponding trail hop. The last segment
     * is the leaf array itself and is returned as-is.
     *
     * @returns The matching leaf array, or `undefined` when any hop fails to align.
     */
    private resolveLeafArray(
        root: unknown,
        segments: Array<string>,
        arrayTrail: Array<ArrayTrailEntry>,
    ): unknown {
        let current: unknown = root
        let trailIndex = 0
        for (let index = 0; index < segments.length; index += 1) {
            // object hop must start from a plain object; arrays at this point belong to a parent
            if (!this.isPlainObject(current)) {
                return undefined
            }
            const next = (current as Record<string, unknown>)[segments[index]]
            const isLast = index === segments.length - 1
            if (Array.isArray(next)) {
                if (isLast) {
                    // last segment IS the leaf array -- caller picks the item by orderIndex
                    return next
                }
                // intermediate array -> consume one trail hop to descend into the same bucket
                const trailEntry = arrayTrail[trailIndex]
                trailIndex += 1
                if (!trailEntry) {
                    return undefined
                }
                const parent = next.find(
                    (entry) => this.isPlainObject(entry)
                        && entry.orderIndex === trailEntry.orderIndex,
                )
                if (!this.isPlainObject(parent)) {
                    return undefined
                }
                current = parent
                continue
            }
            // plain object segment -> just descend
            current = next
        }
        return current
    }

    /** Prefers English; falls back to the first locale extract. */
    private resolveCanonicalJson<T extends Record<string, unknown>>(
        jsons: Array<LocaleJson<T>>,
    ): LocaleJson<T> {
        return jsons.find((entry) => entry.locale === Locale.En) ?? jsons[0]
    }

    /** Stringifies non-string translatable leaves for translation rows. */
    private coerceTranslationValue(value: unknown): string {
        if (typeof value === "string") {
            return value
        }
        if (value === null || value === undefined) {
            return ""
        }
        return String(value)
    }

    /** Returns true when `value` is a plain object (not array / null). */
    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object"
            && value !== null
            && !Array.isArray(value)
    }

    /** Splits a dot-path into segment keys (`"a.b.c"` -> `["a","b","c"]`). */
    private splitFieldPath(fieldPath: string): Array<string> {
        return fieldPath
            .split(".")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0)
    }

    /** Reads a nested value from a JSON tree using a dot-path (objects only). */
    private getValueAtPath(root: unknown, fieldPath: string): unknown {
        const segments = this.splitFieldPath(fieldPath)
        let current: unknown = root
        for (const segment of segments) {
            if (!this.isPlainObject(current)) {
                return undefined
            }
            current = current[segment]
        }
        return current
    }
}
