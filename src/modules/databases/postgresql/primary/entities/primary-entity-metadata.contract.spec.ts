import {
    getMetadataArgsStorage,
} from "typeorm"
import {
    PrimaryPostgreSQLModule,
} from "../primary.module"

describe("primary PostgreSQL entity metadata contracts",
    () => {
        it("resolves every relation target and inverse-side callback",
            () => {
                void PrimaryPostgreSQLModule
                const storage = getMetadataArgsStorage()
                const entityTargets = new Set(
                    storage.tables.map((table) => table.target),
                )
                const entityNames = new Set(
                    storage.tables.flatMap((table) => {
                        const targetName = typeof table.target === "function"
                            ? table.target.name
                            : table.target
                        return [
                            targetName,
                            table.name,
                        ].filter(
                            (name): name is string => typeof name === "string" && name.length > 0,
                        )
                    }),
                )

                expect(entityTargets.size).toBeGreaterThan(100)
                expect(storage.relations.length).toBeGreaterThan(100)

                const probe = new Proxy<Record<PropertyKey, unknown>>({
                },
                {
                    get: () => probe,
                })

                for (const relation of storage.relations) {
                    const relationType = relation.type as unknown
                    const target = typeof relationType === "function"
                        ? (relationType as (type?: unknown) => unknown)()
                        : relationType
                    if (typeof target === "string") {
                        expect(entityNames.has(target)).toBe(true)
                    } else {
                        expect(typeof target).toBe("function")
                        expect(entityTargets.has(target as EntityConstructor)).toBe(true)
                    }

                    const inverse = relation.inverseSideProperty
                    if (typeof inverse === "function") {
                        expect(inverse(probe)).not.toBeNull()
                        expect(inverse(probe)).not.toBeUndefined()
                    } else if (inverse !== undefined) {
                        expect(inverse.length).toBeGreaterThan(0)
                    }
                }
            })

        it("keeps index, unique, and relation properties attached to declared entities",
            () => {
                void PrimaryPostgreSQLModule
                const storage = getMetadataArgsStorage()
                const entityTargets = new Set(
                    storage.tables.map((table) => table.target),
                )
                const propertiesByTarget = new Map<unknown, Set<string>>()
                for (const column of storage.columns) {
                    const properties = propertiesByTarget.get(column.target) ?? new Set<string>()
                    properties.add(column.propertyName)
                    propertiesByTarget.set(column.target,
                        properties)
                }
                for (const relation of storage.relations) {
                    const properties = propertiesByTarget.get(relation.target) ?? new Set<string>()
                    properties.add(relation.propertyName)
                    propertiesByTarget.set(relation.target,
                        properties)
                }
                for (const target of entityTargets) {
                    const inheritedProperties = new Set<string>()
                    let currentTarget: unknown = target
                    while (typeof currentTarget === "function") {
                        for (const property of propertiesByTarget.get(currentTarget) ?? []) {
                            inheritedProperties.add(property)
                        }
                        currentTarget = Object.getPrototypeOf(currentTarget)
                    }
                    propertiesByTarget.set(target,
                        inheritedProperties)
                }

                for (const index of storage.indices) {
                    expect(entityTargets.has(index.target)).toBe(true)
                    const properties = propertiesByTarget.get(index.target) ?? new Set<string>()
                    for (const property of resolvePropertyNames(index.columns)) {
                        expect(properties.has(property)).toBe(true)
                    }
                }
                for (const unique of storage.uniques) {
                    expect(entityTargets.has(unique.target)).toBe(true)
                    const properties = propertiesByTarget.get(unique.target) ?? new Set<string>()
                    for (const property of resolvePropertyNames(unique.columns)) {
                        expect(properties.has(property)).toBe(true)
                    }
                }
            })
    })

type PropertySelector =
    | ((object?: object) => string[] | Record<string, number>)
    | string[]
    | undefined

type EntityConstructor = abstract new (...args: never[]) => object

function resolvePropertyNames(selector: PropertySelector): string[] {
    if (selector === undefined) {
        return []
    }
    if (Array.isArray(selector)) {
        return selector
    }
    const probe = new Proxy<Record<PropertyKey, unknown>>({
    },
    {
        get: () => probe,
    })
    const selected = selector(probe)
    return Array.isArray(selected) ? selected : Object.keys(selected)
}
