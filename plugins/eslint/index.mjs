/**
 * eslint-plugin-starci-be — machine rules for the backend authoring canon
 * (`.claude/canon/be/enforce/authoring/*.md`).
 *
 * Mirrors `starci-academy` (frontend)'s `plugins/eslint/index.mjs`: each rule here "kills" one
 * pattern the authoring canon states in prose, so it is caught at lint-time / pre-commit instead
 * of being re-discovered by review every time. "Canon states it once, lint holds it forever."
 *
 * Every rule is a heuristic over the AST, not a type-checker — some are necessarily approximate
 * (see the comment above each rule for what it does and does not catch).
 */

const EXCEPTION_NAME = /Exception$/
const NEST_BUILTIN_EXCEPTIONS = new Set([
    "BadRequestException",
    "NotFoundException",
    "UnauthorizedException",
    "ForbiddenException",
    "InternalServerErrorException",
    "HttpException",
    "ConflictException",
])
const WINSTON_LOG_METHODS = new Set(["log", "error", "warn", "info", "debug"])
// `@modules/*` resolves against FOUR tsconfig roots (see tsconfig.json `paths`): the plain
// capability root plus three "meta" category roots — `modules/lib/*`, `modules/platform/*`,
// `modules/integrations/*`. A specifier under one of those three legitimately carries one extra
// path segment (category + module name) and is still a single-level module entry, not a deep
// import — `@modules/platform/exceptions` IS the exceptions module's own barrel, not a reach into
// its internals. Anything else with more than one segment after `@modules/` is a deep import.
const MODULES_META_ROOTS = new Set(["lib", "platform", "integrations"])

/** Object node is a destructured parameter pattern (also unwraps a TS parameter property). */
function unwrapParam(param) {
    return param.type === "TSParameterProperty" ? param.parameter : param
}

/** True when a node has a JSDoc block comment (`/** ... *​/`) immediately before it. */
function hasJsdocBefore(sourceCode, node) {
    return sourceCode
        .getCommentsBefore(node)
        .some((c) => c.type === "Block" && c.value.startsWith("*"))
}

// ── 1. require-exception-object-arg ──────────────────────────────────────────────────────────
// error-handling.md §1: the constructor takes ONE destructured metadata object, never positional
// arguments — real source (`errors/users/user.ts`) shows every concrete `XException` constructor
// as `constructor({ ...fields }: XExceptionMetadata)`, so even a no-field throw is `new XException({})`.
const requireExceptionObjectArg = {
    meta: {
        type: "problem",
        docs: {
            description:
                "`throw new XException(...)` must pass exactly ONE object-literal argument. [[error-handling §1]]",
        },
        schema: [],
        messages: {
            zero: "`throw new {{name}}()` — pass the metadata object, even if empty: `new {{name}}({})` (error-handling §1).",
            notObject: "`throw new {{name}}(...)` — first argument must be an object literal, not a positional value (error-handling §1).",
            extra: "`throw new {{name}}(...)` — the constructor takes exactly ONE metadata object, not multiple arguments (error-handling §1).",
        },
    },
    create(context) {
        return {
            ThrowStatement(node) {
                const arg = node.argument
                if (!arg || arg.type !== "NewExpression") return
                if (arg.callee.type !== "Identifier") return
                const name = arg.callee.name
                if (name === "AbstractException" || !EXCEPTION_NAME.test(name)) return

                if (arg.arguments.length === 0) {
                    context.report({ node: arg, messageId: "zero", data: { name } })
                    return
                }
                if (arg.arguments.length > 1) {
                    context.report({ node: arg, messageId: "extra", data: { name } })
                }
                if (arg.arguments[0].type !== "ObjectExpression") {
                    context.report({ node: arg.arguments[0], messageId: "notObject", data: { name } })
                }
            },
        }
    },
}

// ── 2. no-inline-param-type ──────────────────────────────────────────────────────────────────
// type-safety.md §4: a destructured object param's type is a NAMED type living in the module's
// `types/`, never an inline `TSTypeLiteral`. Allows `TSTypeReference` (a named type/interface).
const noInlineParamType = {
    meta: {
        type: "problem",
        docs: {
            description:
                "A destructured param's type must be a named type from `types/`, not an inline object literal. [[type-safety §4]]",
        },
        schema: [],
        messages: {
            inline: "Inline object type on a destructured param — move it to a named interface in the module's `types/` (type-safety §4).",
        },
    },
    create(context) {
        function checkParams(params) {
            for (const raw of params) {
                const param = unwrapParam(raw)
                if (param.type !== "ObjectPattern" || !param.typeAnnotation) continue
                const ann = param.typeAnnotation.typeAnnotation
                if (ann && ann.type === "TSTypeLiteral") {
                    context.report({ node: param.typeAnnotation, messageId: "inline" })
                }
            }
        }
        return {
            FunctionDeclaration(node) { checkParams(node.params) },
            FunctionExpression(node) { checkParams(node.params) },
            ArrowFunctionExpression(node) { checkParams(node.params) },
        }
    },
}

// ── 3. no-nest-logger ────────────────────────────────────────────────────────────────────────
// observability.md: logs are structured events through `WinstonService`; Nest's own `Logger`
// bypasses the correlation id / transport config it wires up. Reports both the import specifier
// and any `new Logger(...)` construction (in case it was imported under an alias).
const noNestLogger = {
    meta: {
        type: "problem",
        docs: { description: "Ban Nest's built-in `Logger` — only `WinstonService` logs. [[observability]]" },
        schema: [],
        messages: {
            import: "Do not import `Logger` from `@nestjs/common` — inject `WinstonService` instead (observability).",
            construct: "`new Logger(...)` — use the injected `WinstonService`, not Nest's built-in logger (observability).",
        },
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value !== "@nestjs/common") return
                for (const spec of node.specifiers) {
                    if (spec.type === "ImportSpecifier" && spec.imported.name === "Logger") {
                        context.report({ node: spec, messageId: "import" })
                    }
                }
            },
            NewExpression(node) {
                if (node.callee.type === "Identifier" && node.callee.name === "Logger") {
                    context.report({ node, messageId: "construct" })
                }
            },
        }
    },
}

// ── 4. no-interpolated-log-message ───────────────────────────────────────────────────────────
// observability.md's worked example explicitly lists `logger.info(\`handling ${x}\`)` as the
// wrong shape: the first argument of a WinstonService log call is an enum member (a `WinstonLog`
// name), never a template literal, string concatenation, or bare string.
function isWinstonServiceReceiver(node) {
    if (node.type === "Identifier") return node.name === "winstonService"
    if (node.type === "MemberExpression" && !node.computed) return node.property.name === "winstonService"
    return false
}
const noInterpolatedLogMessage = {
    meta: {
        type: "problem",
        docs: {
            description:
                "A WinstonService log call's first argument must be an enum member, not an interpolated/concatenated string. [[observability]]",
        },
        schema: [],
        messages: {
            interpolated: "First argument to `winstonService.{{method}}(...)` must be a `WinstonLog` enum member — not a template literal or string concatenation (observability).",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee
                if (callee.type !== "MemberExpression" || callee.computed) return
                const method = callee.property.name
                if (!WINSTON_LOG_METHODS.has(method)) return
                if (!isWinstonServiceReceiver(callee.object)) return

                const first = node.arguments[0]
                if (!first) return
                const isTemplate = first.type === "TemplateLiteral"
                const isConcat = first.type === "BinaryExpression" && first.operator === "+"
                const isBareString = first.type === "Literal" && typeof first.value === "string"
                if (isTemplate || isConcat || isBareString) {
                    context.report({ node: first, messageId: "interpolated", data: { method } })
                }
            },
        }
    },
}

// ── 5. throw-abstract-exception ──────────────────────────────────────────────────────────────
// error-handling.md §1: a bare `Error` carries no code and cannot be grouped/matched/retried on
// purpose; a Nest built-in exception carries an HTTP status and nothing else. Only `AbstractException`
// subclasses are allowed. Heuristic: flags `throw new Error(...)` and a hardcoded list of Nest
// exception class names — it cannot verify a thrown class actually extends `AbstractException`.
const throwAbstractException = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Ban `throw new Error(...)` and Nest built-in exceptions — throw an `AbstractException` subclass. [[error-handling §1]]",
        },
        schema: [],
        messages: {
            error: "`throw new Error(...)` — no stable code to group/match/retry on; throw an `AbstractException` subclass instead (error-handling §1).",
            nestBuiltin: "`throw new {{name}}(...)` — Nest built-in exceptions carry only an HTTP status; throw an `AbstractException` subclass instead (error-handling §1).",
        },
    },
    create(context) {
        return {
            ThrowStatement(node) {
                const arg = node.argument
                if (!arg || arg.type !== "NewExpression" || arg.callee.type !== "Identifier") return
                const name = arg.callee.name
                if (name === "Error") {
                    context.report({ node: arg, messageId: "error" })
                } else if (NEST_BUILTIN_EXCEPTIONS.has(name)) {
                    context.report({ node: arg, messageId: "nestBuiltin", data: { name } })
                }
            },
        }
    },
}

// ── 6. require-export-jsdoc ──────────────────────────────────────────────────────────────────
// comments.md §3: every exported class/interface/enum/type, and every exported module-level
// function or const-arrow, opens with a JSDoc block `/** ... */`.
const requireExportJsdoc = {
    meta: {
        type: "suggestion",
        docs: { description: "Exported class/interface/enum/type/function/const-arrow opens with JSDoc. [[comments §3]]" },
        schema: [],
        messages: { jsdoc: "Add a JSDoc `/** ... */` above exported `{{name}}` (comments §3)." },
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode()

        function nameOf(d) {
            if (d.id) return d.id.name
            if (d.declarations && d.declarations[0] && d.declarations[0].id) return d.declarations[0].id.name
            return "?"
        }

        function check(node) {
            const d = node.declaration
            if (!d) return // re-export `export { X }` — nothing to attach a JSDoc to here
            if (d.type === "VariableDeclaration") {
                // Only a const bound to a function/arrow counts as "function/const-arrow" — a
                // plain data constant (`export const LIMIT = 20`) is not in scope for this rule.
                const decl = d.declarations[0]
                const init = decl && decl.init
                const isFn = init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
                if (!isFn) return
            } else if (!["TSInterfaceDeclaration", "FunctionDeclaration", "TSTypeAliasDeclaration", "ClassDeclaration", "TSEnumDeclaration"].includes(d.type)) {
                return
            }
            if (hasJsdocBefore(sourceCode, node)) return
            context.report({ node: d.id || d, messageId: "jsdoc", data: { name: nameOf(d) } })
        }

        return { ExportNamedDeclaration: check, ExportDefaultDeclaration: check }
    },
}

// ── 7. require-enum-member-jsdoc ─────────────────────────────────────────────────────────────
// type-safety.md §3: every member of an exported enum carries a one-line JSDoc stating its
// CONSEQUENCE — not a name restatement, but the rule can only mechanically check presence.
const requireEnumMemberJsdoc = {
    meta: {
        type: "suggestion",
        docs: { description: "Every member of an exported enum carries its own JSDoc. [[type-safety §3]]" },
        schema: [],
        messages: { jsdoc: "Add a JSDoc `/** ... */` above enum member `{{name}}` stating its consequence (type-safety §3)." },
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode()
        return {
            TSEnumDeclaration(node) {
                const exported = node.parent && node.parent.type === "ExportNamedDeclaration"
                if (!exported) return
                for (const member of node.members) {
                    if (hasJsdocBefore(sourceCode, member)) continue
                    const name = member.id && (member.id.name || member.id.value)
                    context.report({ node: member, messageId: "jsdoc", data: { name: name || "?" } })
                }
            },
        }
    },
}

// ── 8. no-deep-module-import ─────────────────────────────────────────────────────────────────
// naming-and-structure.md §3: one public entry per module — importing past a module's barrel
// into its internals is a bug. Scoped to `@modules/*` only: `@features/*` is the COMPOSITION
// root (§2), whose own manifest (`app.module.ts`, per-app bootstrap) is REQUIRED to reach every
// leaf operation folder directly (§5, "one operation, one folder") — the same segment-count
// heuristic against `@features/*` would flag hundreds of correct composition-root imports as
// violations. See the plugin's rollout comment in `eslint.config.mjs` for that deviation.
const noDeepModuleImport = {
    meta: {
        type: "problem",
        docs: { description: "Import a capability at its `@modules/<name>` entry only, never deeper. [[naming-and-structure §3]]" },
        schema: [],
        messages: {
            deep: "`{{specifier}}` reaches past the module's public entry — import from `@modules/{{entry}}` instead (naming-and-structure §3).",
        },
    },
    create(context) {
        function check(node, specifier) {
            if (!specifier.startsWith("@modules/")) return
            const rest = specifier.slice("@modules/".length)
            const parts = rest.split("/")
            const maxAllowed = MODULES_META_ROOTS.has(parts[0]) ? 2 : 1
            if (parts.length > maxAllowed) {
                const entry = parts.slice(0, maxAllowed).join("/")
                context.report({ node, messageId: "deep", data: { specifier, entry } })
            }
        }
        return {
            ImportDeclaration(node) { check(node.source, node.source.value) },
            ExportNamedDeclaration(node) { if (node.source) check(node.source, node.source.value) },
            ExportAllDeclaration(node) { if (node.source) check(node.source, node.source.value) },
        }
    },
}

export default {
    meta: { name: "eslint-plugin-starci-be", version: "0.1.0" },
    rules: {
        "require-exception-object-arg": requireExceptionObjectArg,
        "no-inline-param-type": noInlineParamType,
        "no-nest-logger": noNestLogger,
        "no-interpolated-log-message": noInterpolatedLogMessage,
        "throw-abstract-exception": throwAbstractException,
        "require-export-jsdoc": requireExportJsdoc,
        "require-enum-member-jsdoc": requireEnumMemberJsdoc,
        "no-deep-module-import": noDeepModuleImport,
    },
}
