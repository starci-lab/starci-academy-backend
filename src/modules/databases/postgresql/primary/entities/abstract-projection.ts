import {
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
} from "typeorm"
import {
    AbstractEntity,
} from "./abstract"
import {
    Locale,
} from "../enums/locale"

@ObjectType({
    isAbstract: true,
})
/**
 * Shared base for every CQRS projection entity.
 *
 * A projection row is keyed by its NATURAL key (declared in the concrete entity
 * -- a single foreign key for an entity-grained projection, or two for a
 * relation-grained one) and stores the whole aggregate under one `value` jsonb
 * column (no typed-per-field columns, so adding a metric needs no migration).
 * Inherited `updatedAt` (from {@link AbstractEntity}) drives the read-time TTL
 * lazy-refresh; `defaultLocale` is the fallback locale for any display text the
 * projection may snapshot (localized via its `*_projection_translations` table).
 */
export abstract class AbstractProjectionEntity extends AbstractEntity {
    /** The aggregate payload (shape is projection-specific; read back as a typed view). */
    @Column({
        name: "value",
        type: "jsonb",
        default: () => "'{}'::jsonb",
    })
        value: Record<string, unknown>

    /** Default locale for any display text snapshotted onto this projection. */
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
        default: Locale.En,
    })
        defaultLocale: Locale
}
