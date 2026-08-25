import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    Test
} from "@nestjs/testing"
import type {
    GraphQLSchema
} from "graphql"

type EntityConstructor = new (...args: never[]) => object

/** Builds one code-first schema containing probe queries for every supplied entity ObjectType. */
export async function buildEntityGraphqlSchema(
    entities: ReadonlyArray<EntityConstructor>,
): Promise<GraphQLSchema> {
    class EntityProbe {
        probe(): object {
            return {
            }
        }
    }
    Resolver()(EntityProbe)
    for (const [index,
        entity] of entities.entries()) {
        const methodName = `probe${index}`
        Object.defineProperty(EntityProbe.prototype,
            methodName,
            {
                value: EntityProbe.prototype.probe,
            })
        Query(() => entity,
            {
                name: methodName
            })(
            EntityProbe.prototype,
            methodName,
            Object.getOwnPropertyDescriptor(EntityProbe.prototype,
                methodName) as PropertyDescriptor,
        )
    }
    const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
    }).compile()
    return moduleRef.get(GraphQLSchemaFactory).create([EntityProbe])
}
