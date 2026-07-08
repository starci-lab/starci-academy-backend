import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates `interview_question_given_codes` — the per-programming-language
 * variant table for a mock-interview question's GIVEN code (technical
 * `debug`/`review`/`optimize` only), replacing the single
 * `interview_questions.given_code`/`given_lang` columns. Mirrors
 * `challenge_step_langs`' shape (one child row per language) minus the
 * per-locale translation layer (given code isn't translated, only
 * per-language).
 *
 * Backfills the ONE existing authored row (the `correlationId` NestJS
 * singleton-race debug question) — its TypeScript variant (fence-stripped;
 * the raw column had a leaked ```` ```typescript ```` wrapper) plus newly
 * authored Java/Csharp/Go variants of the SAME conceptual bug — before
 * dropping the old columns.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration
 * exists so the same change can be applied deterministically where
 * `synchronize` is off.
 */
export class CreateInterviewQuestionGivenCodes1723600000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "interview_question_given_codes" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "lang" varchar(32) NOT NULL,
                "sort_index" int NOT NULL DEFAULT 0,
                "code" text NOT NULL,
                "interview_question_id" uuid NOT NULL,
                CONSTRAINT "pk_interview_question_given_codes_id" PRIMARY KEY ("id")
            );
        `)

        await queryRunner.query(`
            ALTER TABLE "interview_question_given_codes"
            ADD CONSTRAINT "fk_interview_question_id_interview_question_given_codes"
            FOREIGN KEY ("interview_question_id") REFERENCES "interview_questions" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_interview_question_given_codes_question"
            ON "interview_question_given_codes" ("interview_question_id");
        `)

        // backfill the one existing authored question (correlationId singleton-race
        // debug question) — TypeScript (fence-stripped) + 3 newly authored variants
        // of the SAME conceptual bug, each with its own idiomatic concurrency model
        // + fix primitive
        await queryRunner.query(`
            INSERT INTO "interview_question_given_codes" ("lang", "sort_index", "code", "interview_question_id")
            SELECT 'typescript', 0, regexp_replace(
                regexp_replace(given_code, '^\`\`\`[a-zA-Z]*\\s*\\n', ''),
                '\\n\`\`\`\\s*$', ''
            ), id
            FROM "interview_questions"
            WHERE id = '1cbb517e-72c5-4123-822c-0ab179a82154' AND given_code IS NOT NULL
            ON CONFLICT DO NOTHING;
        `)

        await queryRunner.query(`
            INSERT INTO "interview_question_given_codes" ("lang", "sort_index", "code", "interview_question_id")
            VALUES
            ('java', 1, $$// RequestContextHolder.java
@Component
public class RequestContextHolder {
    private String correlationId;   // ← lưu id của request hiện tại, field SHARE giữa mọi thread

    public void set(String id) { this.correlationId = id; }
    public String get() { return this.correlationId; }
}

// CorrelationFilter.java
@Component
public class CorrelationFilter extends OncePerRequestFilter {
    private final RequestContextHolder ctx;

    public CorrelationFilter(RequestContextHolder ctx) { this.ctx = ctx; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        ctx.set(Optional.ofNullable(req.getHeader("X-Correlation-Id")).orElse(UUID.randomUUID().toString()));
        chain.doFilter(req, res);
    }
}

// OrderService.java
@Service
public class OrderService {
    private final RequestContextHolder ctx;
    private final LoggerService logger;

    public OrderService(RequestContextHolder ctx, LoggerService logger) {
        this.ctx = ctx;
        this.logger = logger;
    }

    public void placeOrder(PlaceOrderDto dto) throws InterruptedException {
        logger.info("placing order", Map.of("correlationId", ctx.get()));
        doWork();                                    // ← thread khác có thể chen ngang giữa 2 log
        logger.info("order placed", Map.of("correlationId", ctx.get()));
    }
}$$, '1cbb517e-72c5-4123-822c-0ab179a82154')
            ON CONFLICT DO NOTHING;
        `)

        await queryRunner.query(`
            INSERT INTO "interview_question_given_codes" ("lang", "sort_index", "code", "interview_question_id")
            VALUES
            ('csharp', 2, $$// RequestContextService.cs
public class RequestContextService
{
    private string _correlationId;   // ← lưu id của request hiện tại, field SHARE giữa mọi request

    public void Set(string id) => _correlationId = id;
    public string Get() => _correlationId;
}

// Startup.cs (đăng ký DI)
services.AddSingleton<RequestContextService>();   // ← singleton: 1 instance dùng chung toàn app

// CorrelationMiddleware.cs
public class CorrelationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly RequestContextService _ctx;

    public CorrelationMiddleware(RequestDelegate next, RequestContextService ctx)
    {
        _next = next;
        _ctx = ctx;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        _ctx.Set(context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString());
        await _next(context);
    }
}

// OrderService.cs
public class OrderService
{
    private readonly RequestContextService _ctx;
    private readonly ILoggerService _logger;

    public OrderService(RequestContextService ctx, ILoggerService logger)
    {
        _ctx = ctx;
        _logger = logger;
    }

    public async Task PlaceOrderAsync(PlaceOrderDto dto)
    {
        _logger.Info("placing order", new { correlationId = _ctx.Get() });
        await DoWorkAsync();                          // ← await: nhường luồng cho request khác
        _logger.Info("order placed", new { correlationId = _ctx.Get() });
    }
}$$, '1cbb517e-72c5-4123-822c-0ab179a82154')
            ON CONFLICT DO NOTHING;
        `)

        await queryRunner.query(`
            INSERT INTO "interview_question_given_codes" ("lang", "sort_index", "code", "interview_question_id")
            VALUES
            ('go', 3, $$// requestcontext.go
type RequestContext struct {
	CorrelationID string   // ← field SHARE giữa mọi goroutine xử lý request
}

var ctx = &RequestContext{}   // ← 1 instance dùng chung toàn app (giống singleton)

// middleware.go
func CorrelationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Correlation-Id")
		if id == "" {
			id = uuid.NewString()
		}
		ctx.CorrelationID = id   // ← ghi thẳng vào field share, không qua context.Context
		next.ServeHTTP(w, r)
	})
}

// order_service.go
func PlaceOrder(dto PlaceOrderDto) error {
	logger.Info("placing order", "correlationId", ctx.CorrelationID)
	if err := doWork(); err != nil {   // ← goroutine khác có thể ghi đè ctx.CorrelationID giữa lúc này
		return err
	}
	logger.Info("order placed", "correlationId", ctx.CorrelationID)
	return nil
}$$, '1cbb517e-72c5-4123-822c-0ab179a82154')
            ON CONFLICT DO NOTHING;
        `)

        await queryRunner.query(`
            ALTER TABLE "interview_questions"
            DROP COLUMN IF EXISTS "given_code",
            DROP COLUMN IF EXISTS "given_lang";
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "interview_questions"
            ADD COLUMN IF NOT EXISTS "given_code" text,
            ADD COLUMN IF NOT EXISTS "given_lang" varchar(32);
        `)
        await queryRunner.query(`
            UPDATE "interview_questions" AS q
            SET given_code = v.code, given_lang = v.lang
            FROM "interview_question_given_codes" AS v
            WHERE v.interview_question_id = q.id AND v.lang = 'typescript';
        `)
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_interview_question_given_codes_question\";",
        )
        await queryRunner.query(`
            ALTER TABLE "interview_question_given_codes"
            DROP CONSTRAINT IF EXISTS "fk_interview_question_id_interview_question_given_codes";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"interview_question_given_codes\";")
    }
}
