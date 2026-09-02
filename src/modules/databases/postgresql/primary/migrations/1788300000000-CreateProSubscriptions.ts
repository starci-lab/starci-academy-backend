import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Creates the dedicated Pro aggregate and immutable paid-period sources. */
export class CreateProSubscriptions1788300000000 implements MigrationInterface {
    name = "CreateProSubscriptions1788300000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TYPE \"action_type\" ADD VALUE IF NOT EXISTS 'proSubscriptionPurchase'")
        await queryRunner.query("ALTER TABLE \"transactions\" ADD COLUMN IF NOT EXISTS \"offer_revision\" varchar(64)")
        await queryRunner.query("DO $$ BEGIN CREATE TYPE \"pro_subscription_status\" AS ENUM ('active', 'cancelledAtPeriodEnd', 'expired'); EXCEPTION WHEN duplicate_object THEN null; END $$")
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pro_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "status" "pro_subscription_status" NOT NULL DEFAULT 'active',
                "current_period_end" timestamptz NOT NULL,
                "renewal_intent" boolean NOT NULL DEFAULT false,
                "cancelled_at" timestamptz,
                "access_version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "pk_pro_subscriptions" PRIMARY KEY ("id"),
                CONSTRAINT "uq_pro_subscriptions_user_id" UNIQUE ("user_id"),
                CONSTRAINT "fk_user_id_pro_subscriptions_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pro_entitlement_sources" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "transaction_id" uuid NOT NULL,
                "period_start" timestamptz NOT NULL,
                "period_end" timestamptz NOT NULL,
                "offer_revision" varchar(64) NOT NULL,
                CONSTRAINT "pk_pro_entitlement_sources" PRIMARY KEY ("id"),
                CONSTRAINT "uq_pro_entitlement_sources_transaction_id" UNIQUE ("transaction_id"),
                CONSTRAINT "fk_user_id_pro_entitlement_sources_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_transaction_id_pro_entitlement_sources_transactions" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT
            )
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS \"pro_entitlement_sources\"")
        await queryRunner.query("DROP TABLE IF EXISTS \"pro_subscriptions\"")
        await queryRunner.query("ALTER TABLE \"transactions\" DROP COLUMN IF EXISTS \"offer_revision\"")
        await queryRunner.query("DROP TYPE IF EXISTS \"pro_subscription_status\"")
    }
}
