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

import path from "node:path"
import fs from "node:fs"

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
// Capability roots under `src/modules/`. Three of them sit behind a category folder
// (`lib` / `platform` / `integrations`), so the module name is the SECOND path segment
// (`@modules/platform/exceptions/...`). Everywhere else the module name is the first
// (`@modules/ai/...`). Used by `must-deep-module-import` and `no-self-module-alias`.
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

// ── 8. must-deep-module-import ───────────────────────────────────────────────────────────────
// naming-and-structure.md §3 (barrel retirement): every import names the FILE that declares
// the symbol. A module-root specifier (`@modules/ai`, `@modules/winston`,
// `@modules/platform/exceptions`, `@features/video-encoder`, `@tests/helpers`) is a barrel
// and is now the bug -- the inverse of the retired `no-deep-module-import` rule.
//
// Segment heuristic, same cut the old rule used, flipped:
//   @modules/<name>                         barrel (1 segment; 2 if meta-root)
//   @modules/<name>/<file...>               deep -- required
//   @features/<name> / @tests/<name>        barrel
//   @features/<name>/<file...>              deep -- required
const mustDeepModuleImport = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Import the declaring file, never a module/feature/tests barrel. [[naming-and-structure §3]]",
        },
        schema: [],
        messages: {
            barrel: "`{{specifier}}` is a barrel import -- name the declaring file instead (must-deep-module-import, naming-and-structure §3).",
        },
    },
    create(context) {
        function check(node, specifier) {
            let prefix = null
            let metaAware = false
            if (specifier.startsWith("@modules/")) {
                prefix = "@modules/"
                metaAware = true
            } else if (specifier.startsWith("@features/")) {
                prefix = "@features/"
            } else if (specifier.startsWith("@tests/")) {
                prefix = "@tests/"
            } else {
                return
            }
            const rest = specifier.slice(prefix.length)
            if (!rest) {
                context.report({
                    node,
                    messageId: "barrel",
                    data: {
                        specifier,
                    },
                })
                return
            }
            const parts = rest.split("/")
            const barrelDepth = metaAware && MODULES_META_ROOTS.has(parts[0]) ? 2 : 1
            if (parts.length <= barrelDepth) {
                context.report({
                    node,
                    messageId: "barrel",
                    data: {
                        specifier,
                    },
                })
            }
        }
        return {
            ImportDeclaration(node) { check(node.source, node.source.value) },
            ExportNamedDeclaration(node) { if (node.source) check(node.source, node.source.value) },
            ExportAllDeclaration(node) { if (node.source) check(node.source, node.source.value) },
        }
    },
}

// ── 9. no-vietnamese ─────────────────────────────────────────────────────────────────────────
// comments.md: "Comments and JSDoc are written in English." The same letter class + the same
// `vn-ok:` escape hatch as the front-end gate (.claude/scripts/gates/check-no-vietnamese.mjs),
// so one repo does not police Vietnamese two different ways. Precise Vietnamese letters only —
// never matches ñ / ç / ü / é-as-French, so a European loanword is not a false positive.
const VIETNAMESE_LETTER = /[À-ÃÈ-ÊÌÍÒ-ÕÙÚÝà-ãè-êìíò-õùúýĂăĐđĨĩŨũƠơƯưẠ-ỿ]/
/** Sanctioned: the Vietnamese language's own name, e.g. in a locale label. */
const VIETNAMESE_ENDONYM = /Tiếng Việt/
/** Sanctioned: FUNCTIONAL Vietnamese the code matches or emits, with the reason stated inline. */
const VIETNAMESE_OK_PRAGMA = /\bvn-ok:/

const noVietnamese = {
    meta: {
        type: "problem",
        docs: {
            description: "Comments, JSDoc and string literals are written in English. [[comments intro]]",
        },
        schema: [],
        messages: {
            vietnamese: "Vietnamese text — comments, JSDoc and literals are written in English (comments.md). If this Vietnamese is FUNCTIONAL (a literal the code matches on or emits at runtime), keep it and state why with a `vn-ok: <reason>` comment on the same line.",
        },
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode()

        // The bar is a stranger reading this repo: an engineer who does not speak Vietnamese
        // must be able to read every comment, JSDoc and literal in `src/` and `apps/`. So the
        // check is deliberately unconditional — no carve-out for a term glossed in quotes or
        // parentheses, because a reader who cannot read the gloss gains nothing from it.
        // `.volume/` is the product's CONTENT mount (the `vi` locale itself) and is not part
        // of the linted source tree at all.
        //
        // The one release valve is canon's own: FUNCTIONAL Vietnamese — a literal the code
        // matches on or emits at runtime, where translating it changes behaviour — stays, with
        // `vn-ok: <reason>` on the line so the reason is on the record.
        const isSanctioned = (line) => {
            const raw = sourceCode.lines[line - 1] ?? ""
            return VIETNAMESE_OK_PRAGMA.test(raw) || VIETNAMESE_ENDONYM.test(raw)
        }

        // Report once per node, at the FIRST offending line, so a long JSDoc block yields one
        // actionable location rather than one report per line.
        function check(node, text, startLine) {
            const lines = String(text).split("\n")
            for (let offset = 0; offset < lines.length; offset += 1) {
                if (!VIETNAMESE_LETTER.test(lines[offset])) continue
                const line = startLine + offset
                if (isSanctioned(line)) continue
                context.report({
                    node,
                    loc: {
                        line,
                        column: 0,
                    },
                    messageId: "vietnamese",
                })
                return
            }
        }

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    check(comment,
                        comment.value,
                        comment.loc.start.line)
                }
            },
            Literal(node) {
                if (typeof node.value === "string") {
                    check(node,
                        node.value,
                        node.loc.start.line)
                }
            },
            TemplateElement(node) {
                check(node,
                    node.value.raw ?? "",
                    node.loc.start.line)
            },
        }
    },
}

// ── 10. no-emoji ─────────────────────────────────────────────────────────────────────────────
// Emoji carry tone, not information, and render inconsistently across terminals, logs and
// diffs. Deliberately NARROW ranges: the pictographic + dingbat + misc-symbol blocks only.
// It must never fire on the typography this codebase's own JSDoc relies on — the arrow `→`
// (U+2192), the em dash `—`, the middle dot `·`, `§` — so the arrow and general-punctuation
// blocks are excluded by construction.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u

const noEmoji = {
    meta: {
        type: "problem",
        docs: {
            description: "No emoji in source — comments, JSDoc or literals.",
        },
        schema: [],
        messages: {
            emoji: "Emoji in source. Say it in words: emoji carry tone rather than information and render inconsistently in terminals, logs and diffs.",
        },
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode()

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (EMOJI.test(comment.value)) {
                        context.report({
                            node: comment,
                            messageId: "emoji",
                        })
                    }
                }
            },
            Literal(node) {
                if (typeof node.value === "string" && EMOJI.test(node.value)) {
                    context.report({
                        node,
                        messageId: "emoji",
                    })
                }
            },
            TemplateElement(node) {
                if (EMOJI.test(node.value.raw ?? "")) {
                    context.report({
                        node,
                        messageId: "emoji",
                    })
                }
            },
        }
    },
}

// ── 11. no-ai-symbol ─────────────────────────────────────────────────────────────────────────
// Typographic punctuation nobody reaches for on a keyboard — the em dash, the arrow, the
// middle dot — reads as machine-written, and it is a real portability tax besides: this repo
// has already lost measurements to shell tools mangling non-ASCII. Comments stay ASCII, and
// every banned character has an exact ASCII spelling, so the rule is auto-fixable: one
// `eslint --fix` converts the whole backlog with no judgement calls.
//
// COMMENTS ONLY. A string literal can be user-facing copy or a value the code matches on;
// rewriting one is a product decision, not a lint fix.
const AI_SYMBOLS = {
    "—": "--",
    "–": "-",
    "→": "->",
    "⇒": "=>",
    "←": "<-",
    "·": "-",
    "…": "...",
    "•": "-",
    "×": "x",
    "≥": ">=",
    "≤": "<=",
    "≠": "!=",
    "“": "\"",
    "”": "\"",
    "‘": "'",
    "’": "'",
}
const AI_SYMBOL_RE = new RegExp(`[${Object.keys(AI_SYMBOLS).join("")}]`, "g")

const noAiSymbol = {
    meta: {
        type: "problem",
        fixable: "whitespace",
        docs: {
            description: "Comments are ASCII — no em dash, arrow, middle dot or smart quote.",
        },
        schema: [],
        messages: {
            symbol: "`{{symbol}}` in a comment — write `{{ascii}}`. Comments stay ASCII: typographic punctuation reads as machine-written and breaks shell tooling.",
        },
    },
    create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode()

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    const found = comment.value.match(AI_SYMBOL_RE)
                    if (!found) continue
                    const symbol = found[0]
                    context.report({
                        node: comment,
                        messageId: "symbol",
                        data: {
                            symbol,
                            ascii: AI_SYMBOLS[symbol],
                        },
                        fix(fixer) {
                            const raw = sourceCode.getText().slice(comment.range[0],
                                comment.range[1])
                            return fixer.replaceTextRange(
                                comment.range,
                                raw.replace(AI_SYMBOL_RE, (ch) => AI_SYMBOLS[ch]),
                            )
                        },
                    })
                }
            },
        }
    },
}

// ── 12. no-self-module-alias ─────────────────────────────────────────────────────────────────
// naming-and-structure.md §3: inside a capability, imports are relative. `@modules/ai/...`
// from a file that already lives under `src/modules/ai/` is the same module talking to itself
// through the public alias -- a cycle magnet and a lie about the boundary. Same cut for
// `@features/<name>` and `@tests/<name>`. Meta-root modules accept both the long form
// (`@modules/platform/winston/...`) and the legacy short form (`@modules/winston/...`).
const noSelfModuleAlias = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Inside a capability, import relatives -- never the capability's own alias. [[naming-and-structure §3]]",
        },
        schema: [],
        messages: {
            self: "`{{specifier}}` points at this capability through its public alias -- use a relative import (no-self-module-alias, naming-and-structure §3).",
        },
    },
    create(context) {
        const filename = (context.filename || context.getFilename()).replace(/\\/g, "/")

        function selfAlias() {
            const modulesIdx = filename.lastIndexOf("/src/modules/")
            if (modulesIdx !== -1) {
                const parts = filename.slice(modulesIdx + "/src/modules/".length).split("/")
                if (MODULES_META_ROOTS.has(parts[0]) && parts.length >= 2) {
                    return {
                        prefix: "@modules/",
                        keys: [
                            `${parts[0]}/${parts[1]}`,
                            parts[1],
                        ],
                    }
                }
                if (parts[0]) {
                    return {
                        prefix: "@modules/",
                        keys: [parts[0]],
                    }
                }
            }
            const featuresIdx = filename.lastIndexOf("/src/features/")
            if (featuresIdx !== -1) {
                const name = filename.slice(featuresIdx + "/src/features/".length).split("/")[0]
                return name
                    ? {
                        prefix: "@features/",
                        keys: [name],
                    }
                    : null
            }
            const testsIdx = filename.lastIndexOf("/src/tests/")
            if (testsIdx !== -1) {
                const name = filename.slice(testsIdx + "/src/tests/".length).split("/")[0]
                return name
                    ? {
                        prefix: "@tests/",
                        keys: [name],
                    }
                    : null
            }
            return null
        }

        function check(node, specifier) {
            const self = selfAlias()
            if (!self || !specifier.startsWith(self.prefix)) return
            const rest = specifier.slice(self.prefix.length)
            if (!rest) return
            const hit = self.keys.some((key) => rest === key || rest.startsWith(`${key}/`))
            if (!hit) return
            context.report({
                node,
                messageId: "self",
                data: {
                    specifier,
                },
            })
        }

        return {
            ImportDeclaration(node) { check(node.source, node.source.value) },
            ExportNamedDeclaration(node) { if (node.source) check(node.source, node.source.value) },
            ExportAllDeclaration(node) { if (node.source) check(node.source, node.source.value) },
        }
    },
}

// ── 13. no-non-global-module-import ──────────────────────────────────────────
// naming-and-structure.md §8: a @Module under src/modules or src/features wires
// only its own providers. In-repo modules are registered globally, once, at the
// app composition root (apps/*/src/**). Cross-capability entries in `imports`
// are the bug -- Nest will resolve the foreign providers locally, so the module
// graph pretends to declare a dependency that the design says is ambient.
//
// Decision on SomeModule.register({...}) (do not silently pick one):
//   Same-capability nesting -- bare `ChildModule` or `ChildModule.register(...)`
//   / `registerAsync` / `forRoot` / `forRootAsync` / `forFeature` /
//   `forFeatureAsync` / `registerQueue` -- is ALLOWED. That is a module nesting
//   its own sub-modules (canon §3) or an aggregator registering leaves (canon
//   §5). AiPingModule.register, EventBusModule.register and
//   CdnSynchronizerModule.register are this shape: relative, same capability.
//   Cross-capability `.register()` is BANNED outright, same as a bare
//   identifier. Per-instance options of a foreign module belong at
//   `apps/*/src/**` next to `isGlobal: true`. Allowing any `.register()` would
//   let `CryptoModule.register({})` silence the rule without moving composition
//   to the app root -- the fake-fix this choice exists to prevent.
//
// Allowed without further checks:
//   - third-party specifiers (anything that is not relative / @modules /
//     @features / @tests). Starting list from this repo, not memory:
//     TypeOrmModule, CqrsModule, ConfigModule, JwtModule, ScheduleModule,
//     GraphQLModule (@nestjs/graphql), MailerModule (@nestjs-modules/mailer),
//     SentryModule (@sentry/nestjs), NestBullModule (@nestjs/bullmq),
//     ThrottlerCoreModule (@nestjs/throttler). Widen by specifier origin, not
//     by name -- the in-repo BullModule / CacheModule / HttpModule wrappers
//     share names with Nest packages and must NOT ride an allow-list.
//   - files outside src/modules/** and src/features/** (app roots live under
//     apps/*/src/**; that is where the wiring is supposed to live).
//
// Visits both `@Module({ imports })` and every static method's returned object
// literal `imports` (register / forRoot / forFeature / private helpers / ...).
// Skipping dynamic returns is how a rule reports 11 and hides the rest.
// Spreads of a local array are followed (init + `.push`). Nested `imports`
// inside a third-party `forRootAsync({ imports })` options object are NOT
// walked -- that is async-factory DI wiring, not this module's own imports.
//
// Cost (also in canon §8): removing module-to-module imports makes the
// dependency graph implicit. Today, moving or deleting a module breaks
// compilation at every importer. After this change nothing points at it, so
// the same mistake surfaces at runtime as an unresolved provider, in whichever
// app happened to load it. nest build will not catch that.

const IN_REPO_SPECIFIER = /^(?:\.\.?(?:\/|$)|@modules\/|@features\/|@tests\/)/

function capabilityKey(filePath) {
    const norm = String(filePath).replace(/\\/g, "/")
    const modulesIdx = norm.lastIndexOf("/src/modules/")
    if (modulesIdx !== -1) {
        const parts = norm.slice(modulesIdx + "/src/modules/".length).split("/")
        if (MODULES_META_ROOTS.has(parts[0]) && parts[1]) {
            return `modules:${parts[0]}/${parts[1]}`
        }
        if (parts[0]) return `modules:${parts[0]}`
        return null
    }
    const featuresIdx = norm.lastIndexOf("/src/features/")
    if (featuresIdx !== -1) {
        const name = norm.slice(featuresIdx + "/src/features/".length).split("/")[0]
        return name ? `features:${name}` : null
    }
    return null
}

function repoSrcRoot(filename) {
    const norm = String(filename).replace(/\\/g, "/")
    const idx = norm.lastIndexOf("/src/")
    if (idx === -1) return null
    return norm.slice(0, idx)
}

function existingFile(baseWithoutExt) {
    for (const ext of [".ts", ".tsx", ".js", ".mjs", ".cts", ".mts"]) {
        const candidate = baseWithoutExt + ext
        if (fs.existsSync(candidate)) return candidate.replace(/\\/g, "/")
    }
    for (const ext of [".ts", ".tsx", ".js"]) {
        const candidate = path.join(baseWithoutExt, `index${ext}`)
        if (fs.existsSync(candidate)) return candidate.replace(/\\/g, "/")
    }
    return `${baseWithoutExt}.ts`.replace(/\\/g, "/")
}

function resolveSpecifier(filename, specifier) {
    if (typeof specifier !== "string") return null
    const srcRoot = repoSrcRoot(filename)
    if (!srcRoot) return null
    if (specifier.startsWith("@modules/")) {
        return existingFile(path.join(srcRoot, "src/modules", specifier.slice("@modules/".length)))
    }
    if (specifier.startsWith("@features/")) {
        return existingFile(path.join(srcRoot, "src/features", specifier.slice("@features/".length)))
    }
    if (specifier.startsWith("@tests/")) {
        return existingFile(path.join(srcRoot, "src/tests", specifier.slice("@tests/".length)))
    }
    if (specifier.startsWith(".")) {
        const fromDir = path.dirname(filename)
        return existingFile(path.resolve(fromDir, specifier))
    }
    return null
}

function findVariable(scope, name) {
    let current = scope
    while (current) {
        const found = current.variables.find((v) => v.name === name)
        if (found) return found
        current = current.upper
    }
    return null
}

function propertyNamed(objectExpr, name) {
    if (!objectExpr || objectExpr.type !== "ObjectExpression") return null
    for (const prop of objectExpr.properties) {
        if (prop.type !== "Property" || prop.computed) continue
        const key = prop.key
        const keyName = key.type === "Identifier" ? key.name
            : key.type === "Literal" ? key.value
                : null
        if (keyName === name) return prop.value
    }
    return null
}

function unwrapForwardRef(call) {
    if (call.callee.type !== "Identifier" || call.callee.name !== "forwardRef") return null
    const fn = call.arguments[0]
    if (!fn || (fn.type !== "ArrowFunctionExpression" && fn.type !== "FunctionExpression")) return null
    const body = fn.body
    if (body.type === "Identifier") return body
    if (body.type === "BlockStatement") {
        for (const stmt of body.body) {
            if (stmt.type === "ReturnStatement" && stmt.argument && stmt.argument.type === "Identifier") {
                return stmt.argument
            }
        }
    }
    return null
}

const noNonGlobalModuleImport = {
    meta: {
        type: "problem",
        docs: {
            description:
                "A module under src/modules or src/features must not import a cross-capability in-repo module. [[naming-and-structure §8]]",
        },
        schema: [],
        messages: {
            cross: "`{{name}}` is an in-repo module from another capability (`{{from}}` -> `{{to}}`). Register it globally at the app composition root (`apps/*/src/**`) instead of importing it here (no-non-global-module-import, naming-and-structure §8).",
            crossEmpty: "`{{name}}` is an in-repo module from another capability (`{{from}}` -> `{{to}}`) and its `{{method}}()` carries no configuration, so it is a plain import wearing a call. Register it globally at the app composition root (`apps/*/src/**`) (no-non-global-module-import, naming-and-structure §8).",
            crossGlobalOnly: "`{{name}}` is an in-repo module from another capability (`{{from}}` -> `{{to}}`) and its `{{method}}()` sets only `isGlobal` -- a feature declaring app-wide visibility on the app's behalf. Move that registration to `apps/*/src/**` (no-non-global-module-import, naming-and-structure §8).",
            crossConfigAndGlobal: "`{{name}}` is configured for THIS module (`{{method}}()`) yet also marked `isGlobal: true` -- the two contradict. Keep the per-instance options and drop `isGlobal`, or move the whole registration to `apps/*/src/**` (no-non-global-module-import, naming-and-structure §8).",
        },
    },
    create(context) {
        const filename = context.filename || context.getFilename()
        const selfCapability = capabilityKey(filename)
        if (!selfCapability) return {}

        const sourceCode = context.sourceCode || context.getSourceCode()
        const importSourceByLocal = new Map()

        function recordImport(node) {
            if (!node.source || typeof node.source.value !== "string") return
            const source = node.source.value
            for (const spec of node.specifiers) {
                if (spec.type === "ImportSpecifier" || spec.type === "ImportDefaultSpecifier" || spec.type === "ImportNamespaceSpecifier") {
                    importSourceByLocal.set(spec.local.name, source)
                }
            }
        }

        function reportIfForeign(idNode, messageId = "cross", extra = {
        }) {
            if (!idNode || idNode.type !== "Identifier") return
            const source = importSourceByLocal.get(idNode.name)
            if (source === undefined) return
            if (!IN_REPO_SPECIFIER.test(source)) return
            const resolved = resolveSpecifier(filename, source)
            const otherCapability = resolved ? capabilityKey(resolved) : null
            if (!otherCapability || otherCapability === selfCapability) return
            context.report({
                node: idNode,
                messageId,
                data: {
                    name: idNode.name,
                    from: selfCapability,
                    to: otherCapability,
                    ...extra,
                },
            })
        }

        /**
         * Classify the options object a dynamic-module registration was given.
         *
         * The distinction §8 turns on is whether the call carries configuration
         * that a single global registration could not express -- `type:
         * "monolithic"` for an Apollo server, `instanceKeys: [Cache]` for an
         * ioredis connection. Those legitimately belong to ONE module and are
         * allowed to stay local. What is not allowed is a call that configures
         * nothing (a plain import wearing parentheses) or that only sets
         * `isGlobal`, which is a feature deciding app-wide visibility on the
         * app's behalf.
         *
         * Classified by CONTENT, never by key name: an allow-list of names like
         * `instanceKey` would punish a module that spells its option
         * differently, and this rule already refuses name-based reasoning for
         * third-party detection.
         */
        function classifyRegistration(call) {
            const options = call.arguments.find((arg) => arg.type === "ObjectExpression")
            if (!options) return "empty"

            const isGlobal = propertyNamed(options, "isGlobal")
            const declaresGlobal = isGlobal !== null
                && isGlobal.type === "Literal"
                && isGlobal.value === true
            const configuring = options.properties.some((prop) => {
                if (prop.type === "SpreadElement") return true
                if (prop.computed) return true
                const key = prop.key
                const name = key.type === "Identifier" ? key.name
                    : key.type === "Literal" ? key.value
                        : null
                return name !== "isGlobal"
            })

            if (!configuring) return declaresGlobal ? "globalOnly" : "empty"
            return declaresGlobal ? "configAndGlobal" : "configured"
        }

        function checkCall(call) {
            const forwarded = unwrapForwardRef(call)
            if (forwarded) {
                reportIfForeign(forwarded)
                return
            }
            if (call.callee.type === "Identifier") {
                reportIfForeign(call.callee)
                return
            }
            if (call.callee.type === "MemberExpression" && !call.callee.computed) {
                const method = call.callee.property.type === "Identifier"
                    ? call.callee.property.name
                    : "register"
                const verdict = classifyRegistration(call)
                if (verdict === "configured") return
                const messageId = verdict === "globalOnly" ? "crossGlobalOnly"
                    : verdict === "configAndGlobal" ? "crossConfigAndGlobal"
                        : "crossEmpty"
                reportIfForeign(call.callee.object,
                    messageId,
                    {
                        method,
                    })
            }
        }

        function checkElement(node, seen) {
            if (!node) return
            if (seen.has(node)) return
            seen.add(node)
            if (node.type === "SpreadElement") {
                checkElement(node.argument, seen)
                return
            }
            if (node.type === "Identifier") {
                const scope = sourceCode.getScope(node)
                const variable = findVariable(scope, node.name)
                if (!variable) {
                    reportIfForeign(node)
                    return
                }
                const isImport = variable.defs.some((d) => d.type === "ImportBinding")
                if (isImport) {
                    reportIfForeign(node)
                    return
                }
                for (const def of variable.defs) {
                    if (def.type !== "Variable" || !def.node.init) continue
                    const init = def.node.init
                    if (init.type === "ArrayExpression") {
                        for (const el of init.elements) checkElement(el, seen)
                    } else if (init.type === "CallExpression") {
                        checkCall(init)
                    } else if (init.type === "Identifier") {
                        checkElement(init, seen)
                    }
                }
                for (const ref of variable.references) {
                    const parent = ref.identifier.parent
                    if (
                        parent
                        && parent.type === "MemberExpression"
                        && parent.object === ref.identifier
                        && !parent.computed
                        && parent.property.name === "push"
                        && parent.parent
                        && parent.parent.type === "CallExpression"
                    ) {
                        for (const arg of parent.parent.arguments) checkElement(arg, seen)
                    }
                }
                return
            }
            if (node.type === "CallExpression") {
                checkCall(node)
                return
            }
            if (node.type === "ArrayExpression") {
                for (const el of node.elements) checkElement(el, seen)
            }
        }

        function checkImportsValue(value) {
            if (!value) return
            checkElement(value, new Set())
        }

        function checkObjectImports(objectExpr) {
            checkImportsValue(propertyNamed(objectExpr, "imports"))
        }

        return {
            ImportDeclaration: recordImport,
            ClassDeclaration(node) {
                const decorators = node.decorators || []
                for (const dec of decorators) {
                    const expr = dec.expression
                    if (
                        expr
                        && expr.type === "CallExpression"
                        && expr.callee.type === "Identifier"
                        && expr.callee.name === "Module"
                        && expr.arguments[0]
                        && expr.arguments[0].type === "ObjectExpression"
                    ) {
                        checkObjectImports(expr.arguments[0])
                    }
                }
            },
            ReturnStatement(node) {
                let parent = node.parent
                let inStaticMethod = false
                while (parent) {
                    if (parent.type === "MethodDefinition" && parent.static) {
                        inStaticMethod = true
                        break
                    }
                    if (parent.type === "FunctionDeclaration" || parent.type === "ClassDeclaration") break
                    parent = parent.parent
                }
                if (!inStaticMethod || !node.argument) return
                if (node.argument.type === "ObjectExpression") {
                    checkObjectImports(node.argument)
                    return
                }
                if (node.argument.type === "Identifier") {
                    const scope = sourceCode.getScope(node)
                    const variable = findVariable(scope, node.argument.name)
                    if (!variable) return
                    for (const def of variable.defs) {
                        if (def.type === "Variable" && def.node.init && def.node.init.type === "ObjectExpression") {
                            checkObjectImports(def.node.init)
                        }
                    }
                }
            },
        }
    },
}

// ── 14. exception-extends-abstract ───────────────────────────────────────────────────────────
// error-handling §1. `throw-abstract-exception` guards the THROW site, which leaves the
// declaration unguarded: a class that itself extends a Nest exception is thrown by its own name,
// so the throw looks house-shaped and the rule sees nothing wrong. One such class was live and
// thrown from four call sites while the gate stayed green. Measured 305 classes on
// `AbstractException` against that single holdout, so this lands at zero debt.
const EXCEPTION_BASE = "AbstractException"
const exceptionExtendsAbstract = {
    meta: {
        type: "problem",
        docs: { description: "An `*Exception` class extends `AbstractException`. [[error-handling §1]]" },
        schema: [],
        messages: {
            base: "`{{name}}` extends `{{parent}}`. Every exception extends `AbstractException` -- a Nest base slips past `throw-abstract-exception`, because the throw site then reads as a house exception (error-handling §1).",
        },
    },
    create(context) {
        const filename = context.filename || context.getFilename()
        // the base itself is the one class allowed to extend something else
        if (/exceptions[\\/]errors[\\/]abstract\.ts$/.test(filename)) return {}
        return {
            ClassDeclaration(node) {
                if (!node.id || !/Exception$/.test(node.id.name)) return
                const parent = node.superClass
                if (!parent || parent.type !== "Identifier") return
                if (parent.name === EXCEPTION_BASE) return
                context.report({
                    node: parent,
                    messageId: "base",
                    data: { name: node.id.name, parent: parent.name },
                })
            },
        }
    },
}

// ── 15. exception-in-errors-folder ───────────────────────────────────────────────────────────
// error-handling §1. One folder holds them all, so a reader looking for "what can this app throw"
// has one place to look and a reviewer can see a new failure mode arrive. Measured: 305 of 306.
const exceptionInErrorsFolder = {
    meta: {
        type: "problem",
        docs: { description: "An `*Exception` class is declared under `platform/exceptions/errors`. [[error-handling §1]]" },
        schema: [],
        messages: {
            place: "`{{name}}` is declared outside `src/modules/platform/exceptions/errors/`. Every exception lives there, so the set of failures this app can produce is readable in one place (error-handling §1).",
        },
    },
    create(context) {
        const filename = (context.filename || context.getFilename()).split("\\").join("/")
        if (filename.includes("/platform/exceptions/errors/")) return {}
        return {
            ClassDeclaration(node) {
                if (!node.id || !/Exception$/.test(node.id.name)) return
                if (!node.superClass) return
                context.report({ node: node.id, messageId: "place", data: { name: node.id.name } })
            },
        }
    },
}

/** Constructor parameters, with any TS parameter property unwrapped. */
function constructorParams(node) {
    if (node.kind !== "constructor" || !node.value || !node.value.params) return []
    return node.value.params.map(unwrapParam)
}

/** The type name a parameter is annotated with, or null. */
function paramTypeName(param) {
    const ann = param.typeAnnotation && param.typeAnnotation.typeAnnotation
    if (!ann || ann.type !== "TSTypeReference" || ann.typeName.type !== "Identifier") return null
    return ann.typeName.name
}

/** Decorator names on a parameter (or on the parameter property that wraps it). */
function paramDecorators(original) {
    const carriers = [original]
    if (original.type === "TSParameterProperty") carriers.push(original.parameter)
    const names = []
    for (const carrier of carriers) {
        for (const dec of carrier.decorators || []) {
            const expr = dec.expression
            if (expr.type === "CallExpression" && expr.callee.type === "Identifier") names.push(expr.callee.name)
            else if (expr.type === "Identifier") names.push(expr.name)
        }
    }
    return names
}

// ── 16. must-inject-entity-manager ───────────────────────────────────────────────────────────
// data-access. The connection a manager belongs to is not visible from the type -- this app has
// more than one datasource, and `EntityManager` alone says nothing about which. The house
// decorators name it. Measured 296 of 296 already conform.
const mustInjectEntityManager = {
    meta: {
        type: "problem",
        docs: { description: "An injected `EntityManager` names its datasource through an `@Inject*EntityManager()` decorator. [[data-access]]" },
        schema: [],
        messages: {
            undecorated: "`EntityManager` is injected without an `@Inject*EntityManager()` decorator. The type alone does not say WHICH datasource this is, and this app has more than one.",
        },
    },
    create(context) {
        return {
            MethodDefinition(node) {
                if (node.kind !== "constructor" || !node.value || !node.value.params) return
                for (const original of node.value.params) {
                    const param = unwrapParam(original)
                    if (paramTypeName(param) !== "EntityManager") continue
                    const decorators = paramDecorators(original)
                    if (decorators.some((d) => /^Inject\w*EntityManager$/.test(d))) continue
                    context.report({ node: param, messageId: "undecorated" })
                }
            },
        }
    },
}

// ── 17. no-injected-repository ───────────────────────────────────────────────────────────────
// data-access: one persistence handle, and it must be passable. A repository binds a service to
// one entity and cannot carry a transaction across two, so a use case that grows a second write
// has to be rewritten rather than extended. Measured: 1341 `EntityManager` sites against zero
// injected repositories -- the practice was already total, it had simply never been written down.
const noInjectedRepository = {
    meta: {
        type: "problem",
        docs: { description: "Persistence goes through `EntityManager`, never an injected repository. [[data-access]]" },
        schema: [],
        messages: {
            repo: "Inject `EntityManager` instead of a repository. A repository is bound to one entity and cannot carry a transaction across two, so the unit of work stops being passable (data-access).",
        },
    },
    create(context) {
        return {
            MethodDefinition(node) {
                if (node.kind !== "constructor" || !node.value || !node.value.params) return
                for (const original of node.value.params) {
                    const param = unwrapParam(original)
                    const decorators = paramDecorators(original)
                    const ann = param.typeAnnotation && param.typeAnnotation.typeAnnotation
                    const isRepositoryType = ann
                        && ann.type === "TSTypeReference"
                        && ann.typeName.type === "Identifier"
                        && /^(Repository|TreeRepository|MongoRepository)$/.test(ann.typeName.name)
                    if (decorators.includes("InjectRepository") || isRepositoryType) {
                        context.report({ node: param, messageId: "repo" })
                    }
                }
            },
        }
    },
}

// ── 18. must-use-cache-service ───────────────────────────────────────────────────────────────
// caching. `CacheService` is the seam that decides memory vs redis and owns the key discipline;
// reaching for a raw cache manager bypasses both. Measured: every raw-token site is inside the
// cache module's own implementation, where it belongs, so this lands at zero debt.
const CACHE_TOKENS = /^(REDIS_CACHE_MANAGER|MEMORY_CACHE_MANAGER|CACHE_MANAGER)$/
const mustUseCacheService = {
    meta: {
        type: "problem",
        docs: { description: "Caching goes through `CacheService`; raw cache-manager tokens stay inside the cache module. [[caching]]" },
        schema: [],
        messages: {
            raw: "`{{token}}` is a cache-manager token. Inject `CacheService` instead -- it owns the memory/redis choice and the key discipline, and both are lost when a caller reaches past it (caching).",
        },
    },
    create(context) {
        const filename = (context.filename || context.getFilename()).split("\\").join("/")
        // the wrapper's own implementation is where these tokens are supposed to appear
        if (filename.includes("/modules/integrations/cache/")) return {}
        return {
            Identifier(node) {
                if (!CACHE_TOKENS.test(node.name)) return
                // only flag a real reference, not a property key of the same spelling
                if (node.parent && node.parent.type === "Property" && node.parent.key === node && !node.parent.computed) return
                context.report({ node, messageId: "raw", data: { token: node.name } })
            },
        }
    },
}

// ── 19. no-const-enum ────────────────────────────────────────────────────────────────────────
// type-safety. A `const enum` is inlined at compile time and has no runtime object, so it cannot
// be iterated, reverse-mapped, or read across the `isolatedModules` boundary this repo compiles
// under. Measured 129 of 129 already plain.
const noConstEnum = {
    meta: {
        type: "problem",
        docs: { description: "Enums are declared plain, never `const enum`. [[type-safety]]" },
        schema: [],
        messages: {
            constEnum: "`const enum {{name}}` has no runtime object -- it cannot be iterated or reverse-mapped, and `isolatedModules` cannot inline it across files. Declare a plain `enum`.",
        },
    },
    create(context) {
        return {
            TSEnumDeclaration(node) {
                if (!node.const) return
                context.report({ node, messageId: "constEnum", data: { name: node.id.name } })
            },
        }
    },
}

// ── 20. require-entity-table-name ────────────────────────────────────────────────────────────
// data-access: the schema is never inferred. An `@Entity()` with no argument derives the table
// name from the class name, so renaming the class silently renames the table -- and with
// `synchronize` on, that is a dropped table rather than a compile error. Measured 181 of 181.
const requireEntityTableName = {
    meta: {
        type: "problem",
        docs: { description: "`@Entity()` names its table explicitly. [[data-access]]" },
        schema: [],
        messages: {
            inferred: "`@Entity()` here lets TypeORM infer the table name from the class name, so renaming the class renames the table -- which `synchronize` performs as a drop. Name the table.",
        },
    },
    create(context) {
        return {
            Decorator(node) {
                const expr = node.expression
                if (expr.type !== "CallExpression") return
                if (expr.callee.type !== "Identifier" || expr.callee.name !== "Entity") return
                const named = expr.arguments.some((arg) =>
                    (arg.type === "Literal" && typeof arg.value === "string")
                    || arg.type === "TemplateLiteral")
                if (named) return
                context.report({ node, messageId: "inferred" })
            },
        }
    },
}

// ── 21. no-default-export ────────────────────────────────────────────────────────────────────
// naming-and-structure. A default export has no name at the import site, so the same symbol
// arrives spelled three different ways and no grep finds all of them. Measured 4 of 4243, and all
// four are Jest lifecycle entry points, which Jest loads BY PATH and requires to be default --
// hence the carve-out below rather than an exception in the code.
const JEST_LIFECYCLE = /[\\/](e2e|harness)-(setup|teardown)\.ts$/
const noDefaultExport = {
    meta: {
        type: "problem",
        docs: { description: "Modules export named symbols, never a default. [[naming-and-structure]]" },
        schema: [],
        messages: {
            def: "`export default` gives the symbol no name at the import site, so the same thing arrives spelled differently in every file and no grep finds them all. Export it by name.",
        },
    },
    create(context) {
        const filename = context.filename || context.getFilename()
        // Jest loads globalSetup/globalTeardown by path and calls the default export
        if (JEST_LIFECYCLE.test(filename)) return {}
        return {
            ExportDefaultDeclaration(node) {
                context.report({ node, messageId: "def" })
            },
        }
    },
}

export default {
    meta: { name: "eslint-plugin-starci-be", version: "0.1.0" },
    rules: {
        "exception-extends-abstract": exceptionExtendsAbstract,
        "exception-in-errors-folder": exceptionInErrorsFolder,
        "must-inject-entity-manager": mustInjectEntityManager,
        "no-injected-repository": noInjectedRepository,
        "must-use-cache-service": mustUseCacheService,
        "no-const-enum": noConstEnum,
        "require-entity-table-name": requireEntityTableName,
        "no-default-export": noDefaultExport,
        "no-ai-symbol": noAiSymbol,
        "no-vietnamese": noVietnamese,
        "no-emoji": noEmoji,
        "require-exception-object-arg": requireExceptionObjectArg,
        "no-inline-param-type": noInlineParamType,
        "no-nest-logger": noNestLogger,
        "no-interpolated-log-message": noInterpolatedLogMessage,
        "throw-abstract-exception": throwAbstractException,
        "require-export-jsdoc": requireExportJsdoc,
        "require-enum-member-jsdoc": requireEnumMemberJsdoc,
        "must-deep-module-import": mustDeepModuleImport,
        "no-self-module-alias": noSelfModuleAlias,
        "no-non-global-module-import": noNonGlobalModuleImport,
    },
}
