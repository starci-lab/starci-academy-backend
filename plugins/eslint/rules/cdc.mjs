const isProjectionListener = (filename) => /projection\.listener\.ts$/.test(
    String(filename || "").replace(/\\/g,
        "/"),
) && !String(filename || "").replace(/\\/g,
    "/").endsWith("/abstract-projection.listener.ts")

const memberName = (member) => member.key?.name || member.key?.value

/** Projection listeners declare only domain mapping; the base owns Kafka delivery. */
export const projectionListenerContract = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            base: "A projection CDC listener must extend AbstractProjectionListener so subscription, parsing and failure handling stay uniform.",
            member: "A projection CDC listener must declare `{{name}}`.",
            lifecycle: "The shared CDC base owns `onModuleInit`; a concrete projection listener must not replace Kafka lifecycle handling.",
        },
    },
    create(context) {
        if (!isProjectionListener(context.filename || context.getFilename())) return {}
        return {
            ClassDeclaration(node) {
                if (node.superClass?.name !== "AbstractProjectionListener") {
                    context.report({ node: node.id || node, messageId: "base" })
                }
                const names = new Set((node.body.body || []).map(memberName))
                for (const name of ["groupId", "topics", "deriveTargets", "recomputeTarget"]) {
                    if (!names.has(name)) context.report({
                        node: node.id || node,
                        messageId: "member",
                        data: { name },
                    })
                }
                const lifecycle = (node.body.body || []).find((member) => memberName(member) === "onModuleInit")
                if (lifecycle) context.report({ node: lifecycle.key, messageId: "lifecycle" })
            },
        }
    },
}

export const cdcRules = {
    "projection-listener-contract": projectionListenerContract,
}
