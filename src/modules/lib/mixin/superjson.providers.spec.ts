import BN from "bn.js"
import Decimal from "decimal.js"
import {
    createSuperJsonServiceProvider
} from "./superjson.providers"

describe("createSuperJsonServiceProvider",
    () => {
        const isRestoredNumericTypes = (value: unknown): value is { bn: BN; decimal: Decimal } => {
            return typeof value === "object"
                && value !== null
                && "bn" in value
                && "decimal" in value
                && value.bn instanceof BN
                && value.decimal instanceof Decimal
        }

        it("serializes registered numeric custom types and restores them",
            async () => {
                const provider = createSuperJsonServiceProvider()
                if (!("useFactory" in provider) || typeof provider.useFactory !== "function") {
                    throw new Error("SuperJSON provider must expose a factory")
                }
                const service = await provider.useFactory()
                const result = service.deserialize(service.serialize({
                    bn: new BN("42"), decimal: new Decimal("1.25")
                }))
                if (!isRestoredNumericTypes(result)) {
                    throw new Error("SuperJSON did not restore numeric custom types")
                }
                expect(result.bn.toString()).toBe("42"); expect(result.decimal.toString()).toBe("1.25")
            })
    })
