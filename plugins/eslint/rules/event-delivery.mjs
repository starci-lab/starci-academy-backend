const normalizePath = (filename) => String(filename || "").replace(/\\/g,
    "/")

/** The central NATS bridge must prevent self-echo and duplicate local delivery. */
export const natsBridgeDeliveryContract = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            origin: "The NATS bridge must drop envelopes whose producer id matches this instance before local emit.",
            digest: "The NATS bridge must claim the envelope digest before local emit so redelivery stays idempotent.",
        },
    },
    create(context) {
        if (!normalizePath(context.filename || context.getFilename()).endsWith(
            "/event/nats/nats-bridge.service.ts")) return {}
        return {
            "Program:exit"(node) {
                const source = context.sourceCode || context.getSourceCode()
                const text = source.getText()
                const originIndex = text.search(/parsed\.id\s*===\s*this\.instanceService\.getId\(\)/)
                const digestIndex = text.indexOf("parsed.digest")
                const emitIndex = text.indexOf("this.eventEmitter.emit")
                if (originIndex < 0 || emitIndex < 0 || originIndex > emitIndex) {
                    context.report({ node, messageId: "origin" })
                }
                if (digestIndex < 0 || emitIndex < 0 || digestIndex > emitIndex) {
                    context.report({ node, messageId: "digest" })
                }
            },
        }
    },
}

export const eventDeliveryRules = {
    "nats-bridge-delivery-contract": natsBridgeDeliveryContract,
}
