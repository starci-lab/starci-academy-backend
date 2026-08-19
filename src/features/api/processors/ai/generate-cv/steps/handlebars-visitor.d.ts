/**
 * Handlebars' own `Visitor.prototype.mutating` flag exists at runtime
 * (`handlebars/dist/cjs/handlebars/compiler/visitor.js`: "Visits a given
 * value. If mutating, will replace the value if necessary.") but is missing
 * from the package's bundled `types/index.d.ts`. `latex.ts` needs it to build
 * an AST rewrite that makes LaTeX escaping the default for every bare
 * `{{field}}` mustache -- see `TexAutoEscapeVisitor` there.
 *
 * This augments the ambient type instead of casting around the gap.
 * `Handlebars` in `types/index.d.ts` is declared as a global namespace (not
 * module-scoped: it is only wrapped into a module via the separate
 * `declare module "handlebars" { export = Handlebars }`), so re-opening it
 * here from a `.d.ts` file is a real TypeScript declaration merge, not a
 * shadow copy -- `Handlebars.Visitor` instances gain a properly typed
 * `mutating: boolean` everywhere in this program, matching what already
 * exists at runtime.
 */
declare global {
    namespace Handlebars {
        interface Visitor {
            mutating: boolean
        }
    }
}

export {}
