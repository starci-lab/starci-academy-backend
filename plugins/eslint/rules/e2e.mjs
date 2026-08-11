/** Forward-slash form keeps the lane check identical on Windows and Unix. */
const isE2eSpec = (filename) => /\.e2e-spec\.ts$/.test(
    String(filename || "").replace(/\\/g,
        "/"),
)

/** An e2e enters through production transport, never an internal dispatcher. */
export const e2eUsesProductionTransport = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            busImport: "`{{name}}` is an application dispatcher, not a production transport. Enter through GraphQL, HTTP, a real socket, broker or scheduler boundary.",
            direct: "Direct `.{{method}}()` starts inside the application and skips production routing, guards, validation and serialization. Use the production transport or move this test out of the E2E lane.",
        },
    },
    create(context) {
        if (!isE2eSpec(context.filename || context.getFilename())) return {}
        const buses = new Set(["CommandBus", "QueryBus", "EventBus"])
        return {
            ImportDeclaration(node) {
                if (node.source.value !== "@nestjs/cqrs") return
                for (const specifier of node.specifiers) {
                    if (specifier.type !== "ImportSpecifier") continue
                    const imported = specifier.imported.name || specifier.imported.value
                    if (!buses.has(imported)) continue
                    context.report({ node: specifier, messageId: "busImport", data: { name: imported } })
                }
            },
            CallExpression(node) {
                const callee = node.callee
                if (callee.type !== "MemberExpression" || callee.computed) return
                const method = callee.property.name
                if (method !== "execute" && method !== "process") return
                context.report({ node: callee.property, messageId: "direct", data: { method } })
            },
        }
    },
}

/** An E2E must read a persisted consequence rather than only its response envelope. */
export const e2eAssertsPersistedState = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            noState: "This E2E never reads persisted state back. Assert the row, balance, entitlement or delivered event, not only the response envelope.",
        },
    },
    create(context) {
        if (!isE2eSpec(context.filename || context.getFilename())) return {}
        let readsState = false
        const readers = /^(?:entityManager|dataSource|EntityManager|DataSource|getRepository|queryRunner)$/
        return {
            Identifier(node) {
                if (readers.test(node.name)) readsState = true
            },
            "Program:exit"(node) {
                if (!readsState) context.report({ node, messageId: "noState" })
            },
        }
    },
}

/** Model quality belongs in the harness; E2E stubs the provider boundary. */
export const noModelCallInE2e = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            provider: "`{{source}}` reaches a model provider from E2E. Stub it and assert entitlement, quota and persistence; evaluate model output in the harness.",
        },
    },
    create(context) {
        if (!isE2eSpec(context.filename || context.getFilename())) return {}
        const providers = /^(?:@anthropic-ai\/|openai$|openai\/|ollama$|@google\/generative-ai|@mistralai\/|cohere-ai)/
        const helpers = /helpers\/models(?:\.service)?$/
        return {
            ImportDeclaration(node) {
                const source = node.source.value
                if (typeof source !== "string") return
                if (!providers.test(source) && !helpers.test(source)) return
                context.report({ node, messageId: "provider", data: { source } })
            },
        }
    },
}

/** A flow polls for the required state and never waits for a guessed duration. */
export const noSleepInFlow = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            sleep: "`{{name}}` waits for a duration. Poll the required state with a deadline.",
            timer: "A Promise around `setTimeout` is a sleep. Poll the required state with a deadline.",
        },
    },
    create(context) {
        if (!isE2eSpec(context.filename || context.getFilename())) return {}
        const sleepers = new Set(["sleep", "delay", "wait", "pause", "setTimeout"])
        return {
            CallExpression(node) {
                const callee = node.callee
                if (callee.type !== "Identifier" || !sleepers.has(callee.name)) return
                for (let current = node.parent; current; current = current.parent) {
                    if (current.type === "NewExpression" && current.callee.name === "Promise") return
                }
                context.report({ node, messageId: "sleep", data: { name: callee.name } })
            },
            NewExpression(node) {
                if (node.callee.name !== "Promise") return
                const source = context.sourceCode || context.getSourceCode()
                if (/setTimeout/.test(source.getText(node))) context.report({ node, messageId: "timer" })
            },
        }
    },
}

/** A named flow step proves one deterministic outcome. */
export const noBranchInFlowStep = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            branch: "A branch inside a flow step lets different runs prove different outcomes. Force and assert one outcome.",
        },
    },
    create(context) {
        if (!isE2eSpec(context.filename || context.getFilename())) return {}
        const insideStep = (node) => {
            for (let current = node.parent; current; current = current.parent) {
                if (current.type !== "CallExpression") continue
                const callee = current.callee
                const name = callee && (callee.name || (callee.object && callee.object.name))
                if (name === "it" || name === "test") return true
            }
            return false
        }
        const report = (node) => {
            if (insideStep(node)) context.report({ node, messageId: "branch" })
        }
        return {
            IfStatement: report,
            ConditionalExpression: report,
            SwitchStatement: report,
            LogicalExpression(node) {
                if (node.parent && node.parent.type === "ExpressionStatement") report(node)
            },
        }
    },
}

/** Rules enforcing the production-boundary E2E contract. */
export const e2eRules = {
    "e2e-uses-production-transport": e2eUsesProductionTransport,
    "e2e-asserts-persisted-state": e2eAssertsPersistedState,
    "no-model-call-in-e2e": noModelCallInE2e,
    "no-sleep-in-flow": noSleepInFlow,
    "no-branch-in-flow-step": noBranchInFlowStep,
}
