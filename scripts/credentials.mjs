/**
 * scripts/credentials.mjs -- the ONE table of credentials this repo knows about.
 *
 * It is a table and nothing else: no value, no default, no example. Four scripts
 * read it and they would drift the moment any of them wrote the mapping down a
 * second time:
 *
 *   secrets-gen             mints a value into .stacks/<stack>/runtime/files/<file>
 *   sync                    points the APP at the decrypted file / value
 *   compose                 hands the VALUE to the container
 *   import-terraform-keys   moves an existing third-party key into the stack tree
 *
 * The split below is the important part, and it is not cosmetic:
 *
 *   CREDENTIALS        infra passwords. Nothing outside this machine knows them,
 *                      so they are MINTED at run time and can be re-minted at
 *                      will (as long as the datastore volume is wiped with them).
 *   APP_CREDENTIALS    third-party keys. Stripe, PayPal, Brevo, GitHub, the AI
 *                      pools. They are issued by somebody else, they CANNOT be
 *                      regenerated here, and losing one costs a support ticket
 *                      at best. They are only ever moved, never created.
 *   DERIVED_CREDENTIALS a file whose contents are built out of already-minted
 *                      values, so two readers of the same credential cannot
 *                      disagree.
 *
 * WHY starci differs from miamia here: this app reads a third-party credential
 * by PATH, not by value. config.ts declares a `*_MOUNT_PATH` key per file and
 * `mount-secrets.ts` reads that path with `readFileSync`. So an APP_CREDENTIALS
 * row's `env` is the key that carries a PATH, while a CREDENTIALS row's `env` is
 * the key that carries a VALUE. sync emits them differently for that reason.
 */

/**
 * Infra credentials this repo mints for itself.
 *
 * Every row is a datastore password or a service token that exists only because
 * we chose it. There are eleven, matching the ten services in the dev compose
 * stack (kafka, cadvisor and prometheus authenticate nothing) plus the app's own
 * CSRF secret.
 *
 * Fields
 *   file        basename under .stacks/<stack>/runtime/files/ -- `.enc` is the
 *               committed twin, the plaintext never survives the script
 *   env         the env key the APP reads the value from (config.ts is the
 *               authority; keep them in step)
 *   composeVar  the variable the compose fragment interpolates, or null when no
 *               container needs the value
 *   kind        "user" | "password" | "token" -- only changes the length and the
 *               leading character, never the alphabet
 *   aliases     extra env keys that must receive the SAME value (see the redis
 *               lanes below)
 *
 * NOT in this table, deliberately:
 *   ELASTICSEARCH_USERNAME   fixed by the image; minting one would produce a
 *                            user elasticsearch has never heard of
 *   POSTGRESQL_KEYCLOAK_*    keycloak runs `start-dev` against its own embedded
 *                            database in this stack; nothing passes these to it
 *   KAFKA_*                  the broker listens PLAINTEXT with no auth
 *   S3_ACCESS_KEY_ID         DigitalOcean Spaces, third-party -- see
 *                            APP_CREDENTIALS
 */
export const CREDENTIALS = [
    {
        file: "postgres-user.txt",
        env: "POSTGRESQL_PRIMARY_USERNAME",
        composeVar: "POSTGRES_USER",
        kind: "user",
    },
    {
        file: "postgres-password.txt",
        env: "POSTGRESQL_PRIMARY_PASSWORD",
        composeVar: "POSTGRES_PASSWORD",
        kind: "password",
    },
    {
        /**
         * One redis server, four logical lanes. The password is the server's
         * `--requirepass`, so the three other lanes get the SAME value through
         * `aliases` rather than three rows -- four rows would be four chances to
         * drift out of step with one `requirepass`.
         */
        file: "redis-password.txt",
        env: "REDIS_CACHE_PASSWORD",
        composeVar: "REDIS_PASSWORD",
        kind: "password",
        aliases: [
            "REDIS_BULLMQ_PASSWORD",
            "REDIS_THROTTLER_PASSWORD",
            "REDIS_ADAPTER_PASSWORD",
        ],
    },
    {
        /**
         * Elasticsearch bootstraps the built-in `elastic` user with this on
         * FIRST start only. Once the data volume exists the value is inside it,
         * and re-minting locks the app out of its own indices -- rotate only
         * together with `docker compose down -v`.
         */
        file: "elasticsearch-password.txt",
        env: "ELASTICSEARCH_PASSWORD",
        composeVar: "ELASTIC_PASSWORD",
        kind: "password",
    },
    {
        file: "qdrant-api-key.txt",
        env: "QDRANT_API_KEY",
        composeVar: "QDRANT_API_KEY",
        kind: "token",
    },
    {
        /**
         * MinIO refuses a root user shorter than 3 characters and a root
         * password shorter than 8; the generator is well clear of both.
         */
        file: "minio-user.txt",
        env: "S3_MINIO_ACCESS_KEY_ID",
        composeVar: "MINIO_ROOT_USER",
        kind: "user",
    },
    {
        file: "minio-password.txt",
        env: "S3_MINIO_SECRET_ACCESS_KEY",
        composeVar: "MINIO_ROOT_PASSWORD",
        kind: "password",
    },
    {
        file: "nats-token.txt",
        env: "NATS_AUTH_TOKEN",
        composeVar: "NATS_AUTH_TOKEN",
        kind: "token",
    },
    {
        /**
         * Keycloak creates this admin account on first boot of an empty
         * database. `keycloak-admin.json` in DERIVED_CREDENTIALS is built from
         * this pair so the app logs in with the account that actually exists --
         * see the note there before touching either.
         */
        file: "keycloak-admin-user.txt",
        env: "KEYCLOAK_ADMIN_USERNAME",
        composeVar: "KEYCLOAK_ADMIN_USERNAME",
        kind: "user",
    },
    {
        file: "keycloak-admin-password.txt",
        env: "KEYCLOAK_ADMIN_PASSWORD",
        composeVar: "KEYCLOAK_ADMIN_PASSWORD",
        kind: "password",
    },
    {
        /**
         * No container wants this one: it is the app's own CSRF signing secret.
         * config.ts has a fallback, so a missing file weakens the guard rather
         * than stopping the boot.
         */
        file: "csrf-secret.txt",
        env: "CSRF_SECRET",
        composeVar: null,
        kind: "token",
    },
]

/**
 * The three redis lanes that share the cache lane's password.
 *
 * Kept as its own export because `sync` wants the flat list and the row above
 * wants it attached to the credential; both read the same array so they cannot
 * disagree.
 */
export const REDIS_LANE_ALIASES = [
    "REDIS_BULLMQ_PASSWORD",
    "REDIS_THROTTLER_PASSWORD",
    "REDIS_ADAPTER_PASSWORD",
]

/**
 * Credentials built out of already-minted values.
 *
 * `keycloak-admin.json` is the only one, and it exists to close a gap that is
 * otherwise invisible until an admin call 401s: the CONTAINER is created with
 * KEYCLOAK_ADMIN_USERNAME / KEYCLOAK_ADMIN_PASSWORD, while the APP logs in with
 * whatever `mount-secrets.ts:getKeycloakAdmin()` reads out of this json. Import
 * the old json verbatim and the app carries the credentials of a Keycloak
 * instance that no longer exists. Building it from the minted pair makes the two
 * agree by construction.
 *
 * `fields` maps a json key to the CREDENTIALS `file` its value comes from. The
 * shape must stay in step with `SecretKeycloakAdmin`
 * (src/modules/filesystem/types/secrets.ts).
 */
export const DERIVED_CREDENTIALS = [
    {
        file: "keycloak-admin.json",
        env: "TERRAFORM_KEYCLOAK_ADMIN_MOUNT_PATH",
        format: "json",
        fields: {
            username: "keycloak-admin-user.txt",
            password: "keycloak-admin-password.txt",
        },
    },
]

/**
 * Third-party credentials -- issued elsewhere, IRREPLACEABLE here.
 *
 * They need a table for two reasons. The file name and the env key rarely match
 * (`brevo-smtp-api-key.key` feeds TERRAFORM_BREVO_SMTP_PASSWORD_MOUNT_PATH), and
 * two of the AI pools are on disk under a name config.ts does not look for, so
 * the move has to rename them.
 *
 * Fields
 *   source  path under .mount/ the one-shot import reads, or null when the file
 *           does not exist on this machine and only the mapping is being
 *           recorded
 *   file    basename inside .stacks/<stack>/runtime/files/ -- the name config.ts
 *           expects, which is not always the name it has today
 *   env     the `*_MOUNT_PATH` key that carries the PATH to this file
 *   format  sops input/output type: "binary" for opaque keys, "json" for json
 *   note    why a row is not the obvious one-to-one
 *
 * The authority for `env` is config.ts's `mountPath.terraform` / `mountPath.aiKeys`
 * block. Keep them in step.
 */
export const APP_CREDENTIALS = [
    // ── payments ──────────────────────────────────────────────────────────
    {
        source: "terraform/payos-api-key.key",
        file: "payos-api-key.key",
        env: "TERRAFORM_PAYOS_API_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/sepay-api-key.key",
        file: "sepay-api-key.key",
        env: "TERRAFORM_SEPAY_API_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/stripe-secret-key.key",
        file: "stripe-secret-key.key",
        env: "TERRAFORM_STRIPE_SECRET_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/stripe-webhook-secret.key",
        file: "stripe-webhook-secret.key",
        env: "TERRAFORM_STRIPE_WEBHOOK_SECRET_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/paypal-client-id.key",
        file: "paypal-client-id.key",
        env: "TERRAFORM_PAYPAL_CLIENT_ID_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/paypal-client-secret.key",
        file: "paypal-client-secret.key",
        env: "TERRAFORM_PAYPAL_CLIENT_SECRET_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/paypal-webhook-id.key",
        file: "paypal-webhook-id.key",
        env: "TERRAFORM_PAYPAL_WEBHOOK_ID_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/nowpayments-api-key.key",
        file: "nowpayments-api-key.key",
        env: "TERRAFORM_NOWPAYMENTS_API_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/nowpayments-ipn-secret.key",
        file: "nowpayments-ipn-secret.key",
        env: "TERRAFORM_NOWPAYMENTS_IPN_SECRET_MOUNT_PATH",
        format: "binary",
    },

    // ── github / content ──────────────────────────────────────────────────
    {
        source: "terraform/github-access-token.key",
        file: "github-access-token.key",
        env: "TERRAFORM_GITHUB_ACCESS_TOKEN_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/github-secret-key.key",
        file: "github-secret-key.key",
        env: "TERRAFORM_GITHUB_SECRET_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        /**
         * Optional by design: `getDataGitToken()` falls back to the shared
         * github access token when this file is absent. Present here, so it
         * moves.
         */
        source: "terraform/data-git-token.key",
        file: "data-git-token.key",
        env: "TERRAFORM_DATA_GIT_TOKEN_MOUNT_PATH",
        format: "binary",
    },

    // ── platform ──────────────────────────────────────────────────────────
    {
        source: "terraform/keycloak-client-secret.key",
        file: "keycloak-client-secret.key",
        env: "TERRAFORM_KEYCLOAK_CLIENT_SECRET_MOUNT_PATH",
        format: "binary",
    },
    {
        /**
         * DigitalOcean Spaces, not the local MinIO. The MinIO pair is minted in
         * CREDENTIALS; this is the remote CDN and cannot be regenerated here.
         */
        source: "terraform/s3-secret-access-key.key",
        file: "s3-secret-access-key.key",
        env: "TERRAFORM_S3_SECRET_ACCESS_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/brevo-smtp-api-key.key",
        file: "brevo-smtp-api-key.key",
        env: "TERRAFORM_BREVO_SMTP_PASSWORD_MOUNT_PATH",
        format: "binary",
        note: "file name and env key disagree on purpose -- Brevo's API key IS the SMTP password",
    },
    {
        /**
         * AES key for at-rest field encryption. Regenerating it does not lose a
         * third-party relationship, it loses the ability to read every row that
         * was ever encrypted with it. Treat as irreplaceable.
         */
        source: "terraform/encryption-key.key",
        file: "encryption-key.key",
        env: "TERRAFORM_ENCRYPTION_KEY_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/judge0-auth-token.key",
        file: "judge0-auth-token.key",
        env: "TERRAFORM_JUDGE0_AUTH_TOKEN_MOUNT_PATH",
        format: "binary",
        note: "optional -- an absent file means Judge0 auth is off, not an error",
    },
    {
        /**
         * The one credential config.ts does NOT declare a mount path for:
         * `getAdminApiKey()` builds `.mount/terraform/admin-api-key.key` by hand
         * with no env override, so the key cannot move until that reader is
         * fixed. The env key below is the one being added for it; sync emits it
         * either way, and it is inert until the reader is changed.
         */
        source: "terraform/admin-api-key.key",
        file: "admin-api-key.key",
        env: "TERRAFORM_ADMIN_API_KEY_MOUNT_PATH",
        format: "binary",
        note: "reader is hard-coded today -- mount-secrets.ts:getAdminApiKey() must learn this key",
    },
    {
        source: "terraform/gcp-service-account.json",
        file: "gcp-service-account.json",
        env: "TERRAFORM_GCP_SERVICE_ACCOUNT_JSON_MOUNT_PATH",
        format: "json",
    },

    // ── AI key pools ──────────────────────────────────────────────────────
    // Newline-separated pools. `readAiKeysFile()` resolves a BARE filename from
    // the catalog against AI_KEYS_DIR_MOUNT_PATH, so every pool must land in the
    // same directory and under the name the catalog and config.ts use.
    {
        source: "terraform/keys/open-api-keys.key",
        file: "openai-api-keys.key",
        env: "AI_KEYS_OPENAI_MOUNT_PATH",
        format: "binary",
        note: "RENAME: on disk as open-api-keys.key; config.ts and the model catalog both say openai-api-keys.key",
    },
    {
        source: "terraform/keys/gemini-api-keys.key",
        file: "gemini-api-keys.key",
        env: "AI_KEYS_GEMINI_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/keys/openrouter-api-keys.key",
        file: "openrouter-api-keys.key",
        env: "AI_KEYS_OPENROUTER_MOUNT_PATH",
        format: "binary",
    },
    {
        source: "terraform/keys/claude-api-keys.key",
        file: "anthropic-api-keys.key",
        env: "AI_KEYS_ANTHROPIC_MOUNT_PATH",
        format: "binary",
        note: "RENAME: on disk as claude-api-keys.key; config.ts says anthropic-api-keys.key",
    },
    {
        /**
         * Nothing to import: no file exists under either name. config.ts points
         * AI_KEYS_LOCAL_MOUNT_PATH at `qwen7b.key` while the model catalog asks
         * for `qwen-local-embedding.key`, and neither is on disk -- the local
         * provider falls back to a placeholder, which is correct for a gateless
         * Ollama. Recorded so the drift is visible rather than discovered.
         */
        source: null,
        file: "qwen7b.key",
        env: "AI_KEYS_LOCAL_MOUNT_PATH",
        format: "binary",
        note: "absent on disk; catalog asks for qwen-local-embedding.key, config.ts for qwen7b.key",
    },

    // ── legacy, no reader ─────────────────────────────────────────────────
    // Singular-named siblings of the pools above. Nothing in config.ts reads
    // them, but they are real third-party keys, so they move with the rest
    // rather than being left behind in a folder that is about to be deleted.
    {
        source: "terraform/openai-api-key.key",
        file: "openai-api-key.key",
        env: null,
        format: "binary",
        note: "legacy singular file -- no reader; the live pool is openai-api-keys.key",
    },
    {
        source: "terraform/gemini-api-key.key",
        file: "gemini-api-key.key",
        env: null,
        format: "binary",
        note: "legacy singular file -- no reader; the live pool is gemini-api-keys.key",
    },
]

/**
 * The env key that carries the DIRECTORY holding the AI pools.
 *
 * It is not a credential, but sync has to emit it and it must point at the same
 * directory the pools were decrypted into, or a catalog entry naming a bare
 * filename resolves against the old .mount tree.
 */
export const AI_KEYS_DIR_ENV = "AI_KEYS_DIR_MOUNT_PATH"

/**
 * `keycloak-admin.json` is produced by secrets-gen, not imported. Listed here so
 * the import script can skip it by name instead of by a rule written twice.
 */
export const IMPORT_SKIP = new Set(["terraform/keycloak-admin.json"])
