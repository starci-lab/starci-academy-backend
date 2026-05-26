# title
<!-- @starci/seperator -->
Loan feature with transaction, optimistic lock, index strategy, and before/after EXPLAIN ANALYZE
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Extended from the MEDIUM version. A high-contention borrow/return book flow: you implement `transaction`, optimistic lock via `@VersionColumn`, a composite + partial index strategy, and verify performance using `EXPLAIN ANALYZE` on a 50k+ row dataset.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Extend the medium project into `library-loan-optimistic-lock` with complete loan-domain entities and schema updates.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must add `User`, `Loan`, and `Book.stock/version` using dedicated migrations; `Loan -> User` uses `onDelete: 'CASCADE'`, `Loan -> Book` uses `onDelete: 'RESTRICT'`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Keep migrations small and purpose-specific for safer rollback.
- Stable seed data makes concurrency validation reproducible.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): Entities `User`, `Loan` declared correctly with `@VersionColumn` on `Book` to support optimistic lock.
- Criterion B (3 points): `Loan -> User` `onDelete: 'CASCADE'` and `Loan -> Book` `onDelete: 'RESTRICT'` match the business rules (deleting a user removes loans; a book with active loans cannot be deleted).
- Criterion C (2 points): Migrations split clearly into `AddBookStockVersion`, `CreateUserLoan`, `AddLoansIndex` — one intent per migration.
- Criterion D (2 points): Seed script is idempotent + reproducible for the concurrency test (same seed -> same benchmark result).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Guarantee borrow/return correctness under concurrent writes.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`POST /loans/borrow` and `POST /loans/:id/return` must run inside `DataSource.transaction(...)`, handling `BOOK_NOT_FOUND`, `OUT_OF_STOCK`, `CONCURRENT_CONFLICT`, and `ALREADY_RETURNED` correctly.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Isolate optimistic-lock retry logic into a reusable helper.
- Use SQL logs to confirm version-constrained updates.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): `POST /loans/borrow` runs inside `DataSource.transaction(...)`, decrements stock + inserts loan + checks version inside the same transaction; conflict -> `OptimisticLockVersionMismatchError`.
- Criterion B (4 points): Error mapping is correct — `BOOK_NOT_FOUND` 404, `OUT_OF_STOCK` 409, `CONCURRENT_CONFLICT` 409 after retries are exhausted.
- Criterion C (3 points): `POST /loans/:id/return` is idempotent — calling twice on the same loan -> second call returns `ALREADY_RETURNED` (HTTP 409), no double-restored stock.
- Criterion D (3 points): Retry helper for optimistic lock (>=3 attempts) is reused by both borrow and return, with jitter/backoff between retries.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Fix N+1 and keep query cost predictable for user-loan listing.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /users/:id/loans?status=BORROWED` must use QueryBuilder joins (`loan -> book -> author`) and avoid 1+N query patterns.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Compare before/after query count to prove the fix.
- Add e2e guardrails to prevent N+1 regressions.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (4 points): `GET /users/:id/loans?status=BORROWED` uses QueryBuilder with `leftJoinAndSelect('loan.book', 'book').leftJoinAndSelect('book.author', 'author')` — single query.
- Criterion B (3 points): Before the fix shows >=`1 + N` queries (SQL log), after the fix shows exactly 1 query — paste real log into README.
- Criterion C (3 points): E2e test asserts the query count (e.g. `expect(querySpy).toHaveBeenCalledTimes(1)`) to prevent regressions.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Measure real index impact using EXPLAIN ANALYZE on large data, not assumptions.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must provide `seed-big` with >= 50k loans, migration `AddLoansIndex` (composite + partial), and README before/after EXPLAIN output proving >= 5x execution-time improvement.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Run `VACUUM ANALYZE loans` before re-measuring.
- Keep identical query shape for fair before/after comparison.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (4 points): `scripts/seed-big.ts` generates >=50k loan rows with realistic user/book/status distribution (not skewed entirely into a single user).
- Criterion B (5 points): Migration `AddLoansIndex` adds composite `(userId, status)` + partial index `WHERE status = 'BORROWED'` matching the query pattern.
- Criterion C (4 points): README pastes `EXPLAIN ANALYZE` Before/After of the same query against the same dataset — Execution Time After is >=5x faster than Before, plan shows Index Scan replacing Seq Scan.
- Criterion D (2 points): `VACUUM ANALYZE loans` is run between Before and After to fairly compare statistics.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Validate concurrency behavior with repeatable benchmark evidence.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`bench:concurrency` must produce `ok=5, conflict=5, finalStock=0` for 5 consecutive runs (with stock reset), and README must include raw text evidence for smoke test, N+1 fix, concurrency, and EXPLAIN.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Reset stock deterministically before every run.
- Capture raw terminal output immediately per run.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (4 points): `bench:concurrency` runs 10 concurrent borrows against a book with stock=5 -> 5 consecutive runs all return `ok=5, conflict=5, finalStock=0` (deterministic, not flaky).
- Criterion B (3 points): README pastes raw output text for all 4 evidence blocks: smoke test, N+1 fix Before/After log, concurrent benchmark, `EXPLAIN ANALYZE`.
- Criterion C (3 points): Code Execution Trace >=3 hops for the `POST /loans/borrow` flow showing transaction boundary + version check + retry.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Using `findOne/save` outside a transaction for stock-mutating flows -> **0 prompt transaction**.
- Removing `@VersionColumn` or bypassing optimistic lock -> **0 prompt optimistic lock**.
- Running EXPLAIN on a dataset < 50k rows or without the big-seed script -> **0 prompt index**.
- Leaving N+1 behavior in the list-loans endpoint -> **0 prompt N+1**.
- Fabricating benchmark or `EXPLAIN ANALYZE` output in README evidence -> **0 whole challenge**.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed MEDIUM `1-typeorm-index-jsonb-relations-cascade-medium`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Understand `ACID`, `READ COMMITTED` (Postgres default), row race conditions.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Can read `EXPLAIN ANALYZE` (Seq Scan vs Index Scan, Execution Time, Buffers).
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Basic optimistic vs pessimistic lock.
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Add User entity, Book.stock, Book.version, Loan entity + 4 migrations
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the `User` entity:
  ```ts
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ unique: true }) email: string;
    @Column() name: string;
    @CreateDateColumn() createdAt: Date;
  }
  ```
- **Step 2:** Extend `Book`:
  ```ts
  @Column({ type: 'int', default: 0 }) stock: number;
  @VersionColumn() version: number;
  ```
- **Step 3:** Create the enum + `Loan` entity:
  ```ts
  export enum LoanStatus { BORROWED = 'BORROWED', RETURNED = 'RETURNED' }

  @Entity('loans')
  export class Loan {
    @PrimaryGeneratedColumn('uuid') id: string;
    @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;
    @Column({ name: 'user_id' }) userId: string;
    @ManyToOne(() => Book, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'book_id' }) book: Book;
    @Column({ name: 'book_id' }) bookId: string;
    @CreateDateColumn({ name: 'borrowed_at' }) borrowedAt: Date;
    @Column({ name: 'returned_at', type: 'timestamp', nullable: true }) returnedAt: Date | null;
    @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.BORROWED }) status: LoanStatus;
  }
  ```
- **Step 4:** Generate 4 separate migrations (DO NOT merge them):
  ```bash
  npm run migration:generate -- src/migrations/CreateUsers
  npm run migration:generate -- src/migrations/AddBookStock
  npm run migration:generate -- src/migrations/AddBookVersion
  npm run migration:generate -- src/migrations/CreateLoans
  npm run migration:run
  ```
  In `CreateLoans`, manually add 2 indexes:
  ```ts
  await queryRunner.query(`CREATE INDEX idx_loans_book_id ON loans(book_id)`);
  await queryRunner.query(`CREATE INDEX idx_loans_borrowed_at ON loans USING BRIN(borrowed_at)`);
  ```
  (Do NOT add the composite index here - defer it to the `AddLoansIndex` migration in Step 4 to make the EXPLAIN ANALYZE comparison clean.)

### 2. Minimum acceptance criteria
- `\dt` lists the new `users` and `loans` tables.
- `\d books` shows `stock int NOT NULL DEFAULT 0` and `version int NOT NULL DEFAULT 1`.
- `\d loans` shows FK `user_id -> users(id)`, `book_id -> books(id)` plus the two indexes `idx_loans_book_id` and `idx_loans_borrowed_at` (BRIN).
- `\d loans` shows `status` as an enum type `loan_status_enum` (or `text` with CHECK) - not a free-form varchar.
- The 4 new migration files live in `src/migrations/` with ascending timestamps.

### 3. Nice to have
- Add a DB-level `stock >= 0` CHECK as defense-in-depth.
- Seed 3 users + 10 books with random stocks via `npm run db:seed`.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Implement POST /loans/borrow with transaction + optimistic lock + retry handler
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create `LoanService.borrow(userId, bookId)` via `DataSource.transaction`:
  ```ts
  await this.dataSource.transaction(async (em) => {
    const book = await em.findOneBy(Book, { id: bookId });
    if (!book) throw new NotFoundException({ code: 'BOOK_NOT_FOUND' });
    if (book.stock <= 0) throw new ConflictException({ code: 'OUT_OF_STOCK' });
    book.stock -= 1;
    await em.save(book);
    const loan = em.create(Loan, { userId, bookId, status: LoanStatus.BORROWED });
    await em.save(loan);
    return loan;
  });
  ```
  Inject `@InjectDataSource('primary') private readonly dataSource: DataSource;`.
- **Step 2:** Write helper `retryOnOptimisticLock<T>(fn, attempts = 3, baseMs = 100)`:
  ```ts
  export async function retryOnOptimisticLock<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try { return await fn(); }
      catch (err) {
        const isVersion = err instanceof OptimisticLockVersionMismatchError
          || err?.message?.includes('optimistic lock');
        if (!isVersion || i === attempts - 1) throw err;
        await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
      }
    }
    throw new Error('unreachable');
  }
  ```
- **Step 3:** Wrap the transaction with the helper:
  ```ts
  async borrow(dto: BorrowDto) {
    return retryOnOptimisticLock(() => this.dataSource.transaction(async (em) => {...}));
  }
  ```
  After 3 attempts still raising `OptimisticLockVersionMismatchError` -> convert to `ConflictException({ code: 'CONCURRENT_CONFLICT' })` via outer `try/catch`.
- **Step 4:** `LoanController`:
  - `POST /loans/borrow` body `{userId, bookId}` -> 201 returning `loan`.
  - Swagger / OpenAPI optional.
- **Step 5:** Enable SQL logging in `development` to confirm TypeORM appends `WHERE version = $X` in the UPDATE for the book. Grep the SQL log during borrow, paste the raw line `UPDATE "books" SET ... "version" = "version" + 1 WHERE "id" = $N AND "version" = $M`.

### 2. Minimum acceptance criteria
- `POST /loans/borrow` on a book with `stock = 3` -> 201, DB `stock = 2`, one new loan row with `status='BORROWED'`, `book.version` incremented.
- `POST /loans/borrow` on `stock = 0` -> 409 with `"code":"OUT_OF_STOCK"`.
- `POST /loans/borrow` with an unknown `bookId` -> 404 with `"code":"BOOK_NOT_FOUND"`.
- The SQL log during borrow contains `UPDATE "books" ... WHERE "id" = $N AND "version" = $M` (proving real optimistic locking, not a stub).
- Repo-wide: every `stock -= 1` operation lives inside `dataSource.transaction(...)`; there is no stray `bookRepo.save(book)` that decrements stock outside a transaction.

### 3. Nice to have
- Emit a `loan.borrowed` event via `@nestjs/event-emitter` for downstream features (notifications).
- Prometheus counters `loans_borrowed_total`, `loans_conflicts_total`.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Return endpoint + concurrent test script for 10 users against stock=5
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** `LoanService.return(loanId)`:
  ```ts
  return this.dataSource.transaction(async (em) => {
    const loan = await em.findOne(Loan, { where: { id: loanId }, relations: ['book'] });
    if (!loan) throw new NotFoundException({ code: 'LOAN_NOT_FOUND' });
    if (loan.status === LoanStatus.RETURNED) throw new ConflictException({ code: 'ALREADY_RETURNED' });
    loan.status = LoanStatus.RETURNED;
    loan.returnedAt = new Date();
    loan.book.stock += 1;
    await em.save(loan.book);
    await em.save(loan);
    return loan;
  });
  ```
  Also wrap with `retryOnOptimisticLock`.
- **Step 2:** Controller `POST /loans/:id/return` -> 200 returning the updated `loan`.
- **Step 3:** Write `scripts/benchmark-concurrency.ts`:
  ```ts
  import axios from 'axios';
  // seed: one book with stock=5, 10 users
  const bookId = process.env.BOOK_ID!;
  const userIds = JSON.parse(process.env.USER_IDS!); // array of 10 uuids
  const results = await Promise.allSettled(
    userIds.map((userId) => axios.post('http://localhost:3000/loans/borrow', { userId, bookId }))
  );
  const ok = results.filter(r => r.status === 'fulfilled').length;
  const conflict = results.filter(r => r.status === 'rejected' && r.reason.response?.status === 409).length;
  const finalStock = (await axios.get(`http://localhost:3000/books/${bookId}`)).data.stock;
  console.log({ ok, conflict, finalStock });
  ```
  The script must assert `ok + conflict === 10` and `finalStock === 0`.
- **Step 4:** Add the script `"bench:concurrency": "ts-node scripts/benchmark-concurrency.ts"`. Run:
  ```bash
  npm run bench:concurrency
  ```

### 2. Minimum acceptance criteria
- Run the script 5 consecutive times (resetting `stock=5` between runs): **each run** prints `{ ok: 5, conflict: 5, finalStock: 0 }` (never `ok: 4` or `ok: 6`).
- No situation produces 2 loans reducing stock past `0` (grep DB: `SELECT MIN(stock) FROM books;` is never < 0).
- `POST /loans/:id/return` increases stock by exactly +1 once; a second call -> 409 `ALREADY_RETURNED` with no further stock change.
- Among the 10 concurrent requests, the SQL log shows at least a few `OptimisticLockVersionMismatchError` retries (with `100ms/200ms/400ms` delays) - proving the retry handler runs, not passing on first try every time.

### 3. Nice to have
- Use `Promise.all` with 50 users against stock=10 -> consistent `{ ok: 10, conflict: 40 }`.
- Integrate `autocannon` to benchmark `/loans/borrow` throughput with a high stock so you can see p99.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Fix N+1 on GET /users/:id/loans and verify via query count
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Temporarily write a naive **wrong** version in the branch `bad-n-plus-1`:
  ```ts
  const loans = await this.loanRepo.find({ where: { userId } });
  for (const l of loans) {
    l.book = await this.bookRepo.findOneBy({ id: l.bookId });
    l.book.author = await this.authorRepo.findOneBy({ id: l.book.authorId });
  }
  ```
  Hit `GET /users/:id/loans` on 20 loans -> inspect SQL log: expect **41 queries** (1 loans + 20 books + 20 authors).
- **Step 2:** Merge into `main` with the correct fix using `QueryBuilder`:
  ```ts
  return this.dataSource.getRepository(Loan)
    .createQueryBuilder('loan')
    .leftJoinAndSelect('loan.book', 'book')
    .leftJoinAndSelect('book.author', 'author')
    .where('loan.userId = :userId', { userId })
    .andWhere(status ? 'loan.status = :status' : '1=1', { status })
    .orderBy('loan.borrowedAt', 'DESC')
    .getMany();
  ```
- **Step 3:** Verify the SQL log: `GET /users/:id/loans` produces **exactly one SELECT** with `LEFT JOIN books` and `LEFT JOIN authors`.
- **Step 4:** Write an e2e test (`supertest` + a spy on `WinstonQueryLogger.logQuery`) that asserts query count <= 2 (allowing 1 warmup + 1 real).
- **Step 5:** Under **N+1 Fix** in the README, paste:
  - Raw SQL log output running the wrong version (query count visible).
  - Raw SQL log output running the correct version (1 query).
  - A short code diff.

### 2. Minimum acceptance criteria
- `GET /users/:id/loans` with 20 loans produces a **single** SELECT with `LEFT JOIN` (verified by TypeORM log; grep `SELECT "loan"` matches once).
- The e2e test `loans.e2e-spec.ts` asserts `queryCount <= 2` for that endpoint.
- The response contains both `loan.book.title` and `loan.book.author.name` (two-level nesting), no `undefined`.
- The README **N+1 Fix** section contains before/after raw SQL logs.

### 3. Nice to have
- Use the `dataloader` pattern for use cases where you don't want a huge JOIN (batch-loading authors).
- Benchmark: hit the endpoint 100 times via `autocannon` and compare latency before/after in the README.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Seed 50k loans + EXPLAIN ANALYZE before/after the composite + partial indexes
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write `scripts/seed-big.ts` inserting **>= 50k loans**, 100 users, 500 books (random `user_id`, `book_id`, `status` 70% BORROWED / 30% RETURNED). Use `queryRunner.manager.createQueryBuilder().insert()` batching 1000 rows at a time; keep `synchronize:false`.
  ```bash
  npm run db:seed:big
  ```
- **Step 2:** Before adding the composite index, run `EXPLAIN ANALYZE`:
  ```bash
  docker exec -it <pg> psql -U library -d library -c \
    "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM loans WHERE user_id = '<user>' AND status = 'BORROWED';"
  ```
  Paste the output into the README under **EXPLAIN ANALYZE - Before**. Expect `Seq Scan on loans` or a slow `Bitmap Index Scan` with `Execution Time` > 30ms.
- **Step 3:** Create a new migration `AddLoansIndex`:
  ```ts
  await queryRunner.query(`CREATE INDEX idx_loans_user_id_status ON loans(user_id, status);`);
  await queryRunner.query(`CREATE INDEX idx_loans_borrowed_partial ON loans(user_id, borrowed_at) WHERE status='BORROWED';`);
  ```
  `down()` drops both indexes.
  ```bash
  npm run migration:run
  ```
- **Step 4:** Run `VACUUM ANALYZE loans;` to refresh planner statistics:
  ```bash
  docker exec -it <pg> psql -U library -d library -c "VACUUM ANALYZE loans;"
  ```
- **Step 5:** Re-run the `EXPLAIN ANALYZE` from Step 2. Paste the output under **EXPLAIN ANALYZE - After**. Expect `Index Scan using idx_loans_user_id_status` with `Execution Time` down >= 5x.
- **Step 6:** Add the comparison table to the README:
  ```
  | Query            | Plan       | Execution Time | Shared Buffers |
  | Before index     | Seq Scan   | 45.2 ms        | 1234           |
  | After composite  | Index Scan | 0.8 ms         | 12             |
  ```

### 2. Minimum acceptance criteria
- `scripts/seed-big.ts` inserts **>= 50k loans** (verify via `SELECT COUNT(*) FROM loans;` >= 50000).
- Both EXPLAIN ANALYZE outputs (Before + After) are pasted **verbatim** (including `cost=...`, `Execution Time: ...ms`) in the README.
- Plan Before shows `Seq Scan on loans` or doesn't use the new index; Plan After shows `Index Scan using idx_loans_user_id_status` (or the partial `idx_loans_borrowed_partial`).
- `Execution Time` After / Before <= 0.2 (>= 5x speedup). Otherwise, document the reason in the README with a `BUFFERS` analysis - in which case this prompt fails.
- `AddLoansIndex` migration has an `up()` creating 2 indexes and a `down()` dropping both. `npm run migration:revert` removes both.

### 3. Nice to have
- Add `idx_loans_book_id_borrowed_at` to serve the "who borrowed book X" query.
- Inspect `pg_stat_user_indexes` after smoke tests to confirm `idx_scan` > 0.
- Further optimize with a **covering index** `CREATE INDEX ... INCLUDE (returned_at)` for index-only scans; remeasure Execution Time.
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Smoke-test 3 scenarios via curl and paste into the README
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Run `docker compose up -d`, `npm run migration:run`, `npm run db:seed`, `nest start --watch`.
- **Step 2:** Test the happy borrow:
  ```bash
  curl -X POST http://localhost:3000/loans/borrow \
    -H "Content-Type: application/json" \
    -d '{"userId":"<userId>","bookId":"<bookId-stock-3>"}' -i
  ```
- **Step 3:** Test out-of-stock:
  ```bash
  curl -X POST http://localhost:3000/loans/borrow \
    -H "Content-Type: application/json" \
    -d '{"userId":"<userId>","bookId":"<bookId-stock-0>"}' -i
  ```
  Expect 409 with body containing `"code":"OUT_OF_STOCK"`.
- **Step 4:** Test the N+1 fix:
  ```bash
  curl "http://localhost:3000/users/<userId>/loans?status=BORROWED" -i
  ```
  Paste the raw SQL log showing **exactly one SELECT**.
- **Step 5:** Run the concurrent script:
  ```bash
  npm run bench:concurrency
  ```
  Confirm output `{ ok: 5, conflict: 5, finalStock: 0 }`. Run 5 consecutive times (resetting `stock=5` between runs via seed).
- **Step 6:** In the README **Smoke Test** section, paste:
  - The happy-borrow response (the `Book` in it has `version: 2`).
  - The out-of-stock 409 response.
  - Raw SQL log for `GET /users/:id/loans?status=BORROWED` (one query).
  - Terminal output across 5 concurrent runs (5x `{ok:5, conflict:5, finalStock:0}`).
  - The EXPLAIN ANALYZE Before/After block (already pasted in Step 4 Step 4).

### 2. Minimum acceptance criteria
- The happy-borrow response shows the `Book` object with a `version` greater than before the borrow.
- The out-of-stock 409 JSON contains `"code":"OUT_OF_STOCK"`.
- The SQL log for `GET /users/:id/loans?status=BORROWED` contains **exactly one** SELECT line.
- The concurrent script reports `ok=5, conflict=5, finalStock=0` on all 5 runs.
- The README contains all 5 evidence pieces in raw text (happy response, out-of-stock response, 1-query log, 5x concurrent output, EXPLAIN ANALYZE Before/After block).
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Implement a concurrency-safe borrow/return flow using transactions plus optimistic locking.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Build and run repeatable concurrent benchmarks that prove no double-spend behavior.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Eliminate N+1 queries with proper QueryBuilder joins and verify with runtime evidence.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Quantify index impact through before/after EXPLAIN ANALYZE on large seeded datasets.
<!-- @starci/seperator -->
## 4
### text
<!-- @starci/seperator -->
Present complete technical evidence using raw output text that reviewers can replay.

### 3. Nice to have
- Benchmark with `autocannon -c 50 -d 30 http://localhost:3000/users/<id>/loans?status=BORROWED`, paste p99.
- Add a scenario for return + an immediate borrow of the same book by a different user to exercise the return-re-opens-stock flow.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
TypeORM - Transactions
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/transactions
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM - Concurrency / Optimistic lock (@VersionColumn)
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/entities#version
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
PostgreSQL - EXPLAIN
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/using-explain.html
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
PostgreSQL - Partial indexes
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/indexes-partial.html
<!-- @starci/seperator -->

## 4
### alias
<!-- @starci/seperator -->
NestJS - Database transactions
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://docs.nestjs.com/techniques/database#transactions
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
GitHub Repository Link
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Public repo `library-loan-optimistic-lock` containing entities (User/Loan + Book.stock/version), migrations `AddBookStockVersion` + `CreateUserLoan` + `AddLoansIndex`, `scripts/seed-big.ts` (>=50k loans), `bench:concurrency` script, and a README with 6 sections including a Smoke Test that pastes raw evidence: borrow/return happy path + error mapping, N+1 fix Before/After SQL log, 5 consecutive deterministic concurrency runs (`ok=5, conflict=5, finalStock=0`), and Before/After `EXPLAIN ANALYZE` showing >=5x Execution Time speedup.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
hard
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
