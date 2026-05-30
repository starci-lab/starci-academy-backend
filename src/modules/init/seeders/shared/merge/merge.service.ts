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
    LocaleJson,
    MergeJsonParams,
    MergeJsonResult,
    MergeJsonTranslationRow,
} from "./types"

/**
 * Builds one canonical mount JSON tree (English/default locale) and attaches
 * `translations` on the root and on every array item located by
 * `translateFields` — matching how course parsers align `orderIndex` rows.
 */
@Injectable()
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
        if (jsons.length === 0) {
            throw new MissingRequiredParameterException({
                parameter: "jsons",
            })
        }
        const canonical = this.resolveCanonicalJson(jsons)
        const merged = this.mergeTree(
            canonical.json,
            jsons,
            translateFields,
            "",
        ) as MergeJsonResult<T>
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
     */
    private mergeTree<T extends Record<string, unknown>>(
        node: unknown,
        jsons: Array<LocaleJson<T>>,
        translateFields: Array<string>,
        pathPrefix: string,
    ): unknown {
        if (Array.isArray(node)) {
            return node.map((entry) => {
                const record = structuredClone(entry) as Record<string, unknown>
                const orderIndex = record.orderIndex
                const itemLeafFields = this.immediateItemLeafFields(
                    translateFields,
                    pathPrefix,
                )
                if (itemLeafFields.length > 0) {
                    record.translations = this.buildArrayItemTranslations(
                        jsons,
                        pathPrefix,
                        orderIndex,
                        itemLeafFields,
                    )
                }
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
                        )
                    }
                }
                return record
            })
        }
        if (this.isPlainObject(node)) {
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
                    )
                }
            }
            return record
        }
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
                if (arrayPath.length === 0) {
                    return false
                }
                if (!fieldPath.startsWith(prefix)) {
                    return false
                }
                const rest = fieldPath.slice(prefix.length)
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
            if (!rest.includes(".")) {
                continue
            }
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
        return Array.from(keys).filter((key) => Array.isArray(node[key]))
    }

    /** True when any segment before the leaf crosses an array in the canonical tree. */
    private pathTraversesArray(root: unknown, fieldPath: string): boolean {
        const segments = this.splitFieldPath(fieldPath)
        let current: unknown = root
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

    /** Per-item translation rows aligned by `orderIndex` inside one array path. */
    private buildArrayItemTranslations<T extends Record<string, unknown>>(
        jsons: Array<LocaleJson<T>>,
        arrayPath: string,
        orderIndex: unknown,
        leafFields: Array<string>,
    ): Array<MergeJsonTranslationRow> {
        const rows: Array<MergeJsonTranslationRow> = []
        for (const {
            json,
            locale,
        } of jsons) {
            const arrayValue = this.getValueAtPath(json,
                arrayPath)
            if (!Array.isArray(arrayValue)) {
                continue
            }
            const item = arrayValue.find(
                (entry) => this.isPlainObject(entry)
                    && entry.orderIndex === orderIndex,
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

    /** Splits a dot-path into segment keys (`"a.b.c"` → `["a","b","c"]`). */
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
