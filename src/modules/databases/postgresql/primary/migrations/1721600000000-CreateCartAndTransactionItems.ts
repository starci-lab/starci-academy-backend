import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the two tables backing multi-course purchasing:
 *
 * - `cart_items`: the server-side shopping cart, one row per `(user, course)`
 *   with a unique constraint so a course cannot sit in a user's cart twice, plus
 *   a per-user lookup index (every cart read filters by `user_id`). Both FKs are
 *   `ON DELETE CASCADE`.
 * - `transaction_items`: the per-course lines of a multi-course checkout order.
 *   Each references the parent `transactions` row and one `courses` row (both
 *   `ON DELETE CASCADE`) and records the per-course VND `amount`, loyalty
 *   `discount_percent`, and `pricing_phase`. Indexed by `transaction_id` for the
 *   payment-success enroll fan-out.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change applies deterministically where `synchronize` is disabled.
 */
export class CreateCartAndTransactionItems1721600000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateCartAndTransactionItems1721600000000"

    /**
     * Forward migration: create both tables, their indexes, unique constraint and FKs.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // cart_items — the persisted shopping cart (one row per user × course)
        await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "course_id" uuid NOT NULL,
                CONSTRAINT "pk_cart_items_id" PRIMARY KEY ("id")
            );
        `)

        // a course may appear at most once in a given user's cart
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "UQ_cart_items_user_course"
            UNIQUE ("user_id", "course_id");
        `)

        // per-user index — every cart read filters by user_id
        await queryRunner.query(`
            CREATE INDEX "idx_cart_items_user_id"
            ON "cart_items" ("user_id");
        `)

        // FK to users — deleting a user removes their cart
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "fk_user_id_cart_items_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // FK to courses — deleting a course removes it from every cart
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "fk_course_id_cart_items_courses"
            FOREIGN KEY ("course_id") REFERENCES "courses" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // transaction_items — the per-course lines of a multi-course order.
        // pricing_phase reuses the existing "pricing_phase" enum (already created
        // by the transactions table); reference it by type, do not recreate it.
        await queryRunner.query(`
            CREATE TABLE "transaction_items" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "transaction_id" uuid NOT NULL,
                "course_id" uuid NOT NULL,
                "amount" int NOT NULL,
                "discount_percent" int NOT NULL DEFAULT 0,
                "pricing_phase" "pricing_phase" NOT NULL,
                CONSTRAINT "pk_transaction_items_id" PRIMARY KEY ("id")
            );
        `)

        // per-order index — the enroll fan-out loads all lines for a transaction
        await queryRunner.query(`
            CREATE INDEX "idx_transaction_items_transaction_id"
            ON "transaction_items" ("transaction_id");
        `)

        // FK to transactions — deleting the order removes its lines
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            ADD CONSTRAINT "fk_transaction_id_transaction_items_transactions"
            FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // FK to courses — deleting a course removes its order lines
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            ADD CONSTRAINT "fk_course_id_transaction_items_courses"
            FOREIGN KEY ("course_id") REFERENCES "courses" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop FKs, indexes, constraints and tables in dependency order.
     * The `pricing_phase` enum is NOT dropped — it is owned by the transactions table.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // drop transaction_items FKs before the table
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            DROP CONSTRAINT IF EXISTS "fk_course_id_transaction_items_courses";
        `)
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            DROP CONSTRAINT IF EXISTS "fk_transaction_id_transaction_items_transactions";
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_transaction_items_transaction_id";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"transaction_items\";")

        // drop cart_items FKs, unique constraint and index before the table
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            DROP CONSTRAINT IF EXISTS "fk_course_id_cart_items_courses";
        `)
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            DROP CONSTRAINT IF EXISTS "fk_user_id_cart_items_users";
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_cart_items_user_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "cart_items"
            DROP CONSTRAINT IF EXISTS "UQ_cart_items_user_course";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"cart_items\";")
    }
}
