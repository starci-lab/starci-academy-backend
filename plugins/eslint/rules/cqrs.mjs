const normalizePath = (filename) => String(filename || "").replace(/\\/g, "/")

const handlerFile = (filename) => /\/[a-z0-9-]+\.handler\.ts$/.test(normalizePath(filename))
const messageFile = (filename) => /\/[a-z0-9-]+\.(?:command|query)\.ts$/.test(normalizePath(filename))

const decoratorNames = (node) => (node.decorators || []).map((decorator) => {
    const expression = decorator.expression
    if (expression.type === "CallExpression" && expression.callee.type === "Identifier") {
        return expression.callee.name
    }
    return expression.type === "Identifier" ? expression.name : null
}).filter(Boolean)

const declaredMethod = (node,
    name) => (node.body.body || []).find((member) =>
    member.type === "MethodDefinition" && member.key?.name === name)

/** CQRS handlers stay inside ICQRSHandler's template method. */
export const handlerOverridesProcess = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            execute: "A CQRS handler implements `process`; overriding `execute` bypasses the shared handler template.",
            process: "A standalone CQRS handler must implement `process`.",
        },
    },
    create(context) {
        if (!handlerFile(context.filename || context.getFilename())) return {}
        return {
            ClassDeclaration(node) {
                const isHandler = decoratorNames(node).some((name) => /^(?:Command|Query|Events)Handler$/.test(name))
                if (!isHandler) return
                const execute = declaredMethod(node,
                    "execute")
                if (execute) {
                    context.report({ node: execute.key, messageId: "execute" })
                    return
                }
                if (!node.superClass && !declaredMethod(node,
                    "process")) context.report({ node: node.id || node, messageId: "process" })
            },
        }
    },
}

/** CQRS messages are inert request-context envelopes. */
export const messageCarriesParamsOnly = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            logic: "A CQRS message carries `params`; move methods and decisions into its handler.",
            shape: "A CQRS message constructor must carry exactly one `params` field.",
        },
    },
    create(context) {
        if (!messageFile(context.filename || context.getFilename())) return {}
        return {
            ClassDeclaration(node) {
                if ((node.decorators || []).length > 0) return
                const members = node.body.body || []
                for (const member of members) {
                    if (member.type === "MethodDefinition" && member.kind !== "constructor") {
                        context.report({ node: member.key, messageId: "logic" })
                    }
                }
                const constructor = members.find((member) =>
                    member.type === "MethodDefinition" && member.kind === "constructor")
                if (!constructor?.value) return
                const params = constructor.value.params || []
                const parameter = params[0]?.type === "TSParameterProperty"
                    ? params[0].parameter
                    : params[0]
                if (params.length !== 1 || parameter?.name !== "params") {
                    context.report({ node: node.id || node, messageId: "shape" })
                }
            },
        }
    },
}

export const cqrsRules = {
    "handler-overrides-process": handlerOverridesProcess,
    "message-carries-params-only": messageCarriesParamsOnly,
}
