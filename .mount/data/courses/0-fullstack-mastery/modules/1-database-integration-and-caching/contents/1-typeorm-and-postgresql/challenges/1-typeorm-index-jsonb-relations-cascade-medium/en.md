# title
<!-- @starci/seperator -->
Advanced TypeORM - index strategy, jsonb column, 1-1/1-n/n-n relations with cascade and auto timestamp
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Extended from the EASY version. You will add a 1-1 shared-PK relation, a 1-n review relation, a real index strategy (B-tree, composite, partial, GIN), a `jsonb` metadata column, multi-step migrations with triggers, and cascade semantics (save cascade vs onDelete cascade) so the API gets closer to production quality.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Upgrade the EASY project to an advanced TypeORM challenge that covers full relation modeling, cascade behavior, and production-style schema evolution.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Fork to `library-typeorm-advanced-features`; add `AuthorProfile` (shared PK with `Author`) and `Review` (1-n from `Book`), update `Author`/`Book` relations as required, and keep `synchronize: false`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Stabilize entity relations first, then generate migrations to avoid noisy migration diffs.
- Keep a clear separation between save-cascade and delete-cascade responsibilities.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
8
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 8):

- Criterion A (3 points): `AuthorProfile` declares a correct 1-1 shared-PK relation with `Author` (same UUID acting as both PK and FK).
- Criterion B (2 points): `Review` declares a correct 1-n relation with `Book` via `@ManyToOne` + `@OneToMany`.
- Criterion C (2 points): Clear separation between `cascade: ['insert','update']` (save cascade) and `onDelete: 'CASCADE'` (FK cascade) — each used in its correct context.
- Criterion D (1 point): `synchronize: false` repo-wide + entities autoloaded via `forFeature`.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Implement index strategy by query intent to compare B-tree, composite, partial, and GIN behavior in real endpoints.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must include required indexes: `Book.title`, `Book(authorId,publishedYear)`, unique partial `uniq_book_isbn` on `metadata->>'isbn'`, GIN `idx_book_search_vector`, `Review.rating`, and `Review(bookId,rating)`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Create partial `isbn` index in migration SQL to guarantee the `IS NOT NULL` condition.
- GIN is meaningful only when full-text queries use `search_vector @@ to_tsquery(...)`.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
9
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 9):

- Criterion A (3 points): Composite index `Book(authorId, publishedYear)` has the right column order matching the query pattern (`WHERE authorId = ? AND publishedYear BETWEEN ?`).
- Criterion B (3 points): Unique partial index `uniq_book_isbn` on `metadata->>'isbn'` with the `IS NOT NULL` condition verified by a duplicate-isbn insert returning error `23505`.
- Criterion C (2 points): GIN index `idx_book_search_vector` is used correctly (verified via `EXPLAIN ANALYZE` showing `Bitmap Index Scan on idx_book_search_vector`).
- Criterion D (1 point): `Review.rating` + `Review(bookId, rating)` indexes exist for rating-filter queries.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Practice safe multi-step migrations on a database that may already contain data.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must deliver 4 migrations: `CreateAuthorProfile`, `CreateReview`, `AddBookMetadataJsonb`, `AddBookSearchVector`; each migration has complete `up()`/`down()`, including DB trigger `books_search_trigger` and `search_vector` backfill.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Verify migration results with `\d` and `\di` after each run.
- Re-check nullable/default constraints before applying migrations to non-empty tables.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): All 4 new migrations (`CreateAuthorProfile`, `CreateReview`, `AddBookMetadataJsonb`, `AddBookSearchVector`) have symmetric `up()` and `down()`.
- Criterion B (3 points): Migration `AddBookSearchVector` creates the `books_search_trigger` updating `search_vector` from `title` + `metadata` and backfills existing data.
- Criterion C (2 points): Applying on a populated DB does NOT lose any row — verify with `SELECT COUNT(*) FROM books` before/after.
- Criterion D (2 points): `migration:revert` cleanly drops trigger, column, and tables without breaking other FKs / indexes.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Deliver advanced API behavior that proves cascade, jsonb query, and full-text search are implemented correctly.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must implement: `POST /authors/:id/profile`, `GET /authors/:id?withProfile=true`, `POST /books/:id/reviews`, `GET /books/search`, `GET /books/by-isbn/:isbn`, `GET /books/by-language/:lang`, plus delete cascade behavior exactly as specified.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Profile/review creation flows should go through `authorRepo.save(author)` or `bookRepo.save(book)` to demonstrate cascade semantics.
- Keep jsonb/full-text logic in QueryBuilder for transparent SQL verification.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
8
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 8):

- Criterion A (2 points): `POST /authors/:id/profile` and `POST /books/:id/reviews` go through the parent's `save` (cascade), NOT via direct `profileRepo.save()` / `reviewRepo.save()`.
- Criterion B (2 points): `GET /books/by-isbn/:isbn` uses `metadata->>'isbn' = :isbn` (jsonb operator) and hits the unique partial index.
- Criterion C (2 points): `GET /books/search?q=...` uses `to_tsquery` + `@@ search_vector` and `EXPLAIN ANALYZE` shows a GIN index hit.
- Criterion D (2 points): Deleting an author cascades to book/profile/review via FK `onDelete: 'CASCADE'`, verified by before/after counts.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Validate implementation using technical evidence, not just endpoint-level success.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must prove: SQL log insert into `author_profiles` via cascade, duplicate `isbn` raises `23505`, `EXPLAIN ANALYZE` hits `idx_book_search_vector`, `updated_at` changes correctly on update, author deletion completes cascades without FK errors.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Capture evidence incrementally while implementing to avoid missing proof at the end.
- For cascade delete checks, compare row counts before/after to make proof objective.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 5):

- Criterion A (2 points): SQL log of `author_profiles` cascade insert is pasted into README as evidence (not fabricated).
- Criterion B (2 points): `EXPLAIN ANALYZE` real output pasted for both `GET /books/by-isbn` (Index Scan on the partial unique index) and `GET /books/search` (Bitmap Index Scan on the GIN index).
- Criterion C (1 point): README includes a Code Execution Trace with >=3 `file:line -> method()` hops for the cascade or full-text flow.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- `synchronize: true` in any env/file -> **0 prompt migration**.
- Using `@Column({ type: 'json' })` instead of `'jsonb'` -> **0 prompt jsonb**.
- Calling `profileRepo.save()` / `reviewRepo.save()` directly in cascade-mandatory flows -> **0 prompt cascade**.
- Updating `search_vector` in application code instead of DB trigger -> **0 prompt GIN index**.
- Manual `new Date()` assignment for `createdAt` / `updatedAt` -> **0 prompt auto timestamp**.
- Fabricating `EXPLAIN ANALYZE` output or SQL logs in the README evidence -> **0 whole challenge**.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed EASY `0-library-author-book-tag-crud-easy`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Basic Postgres knowledge: jsonb operators (`->`, `->>`, `@>`), tsvector/tsquery, PL/pgSQL triggers.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Understand cascade semantics (save cascade vs onDelete cascade - they are different).
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Fork EASY, install deps, scaffold new entities
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Copy EASY to `library-typeorm-advanced-features`, keep the 3 entities + 2 migrations.
- **Step 2:** Install extra deps (if missing):
  ```bash
  npm i class-validator class-transformer
  ```
- **Step 3:** Generate module + service + controller:
  ```bash
  nest g module review
  nest g controller review
  nest g service review
  nest g module profile
  nest g service profile
  ```
- **Step 4:** Create `src/author/entities/author-profile.entity.ts` and `src/review/entities/review.entity.ts` (empty shells for now).

### 2. Minimum acceptance criteria
- New project folder `library-typeorm-advanced-features` boots with `nest start --watch`.
- `package.json` contains `class-validator` and `class-transformer`.
- New modules `ReviewModule` and `ProfileModule` exist and are imported into `AppModule`.
- Original 3 entities + 2 EASY migrations remain; `synchronize: false` unchanged.

### 3. Nice to have
- Add Swagger `@nestjs/swagger` with `/api` endpoint to verify schema after each step.
- Set `strictPropertyInitialization: false` in `tsconfig.json` if TypeScript complains about uninitialized entity fields.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
1-1 AuthorProfile with shared PK and cascade save
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Complete `src/author/entities/author-profile.entity.ts`:
  ```ts
  @Entity('author_profiles')
  export class AuthorProfile {
    @PrimaryColumn('uuid', { name: 'id' }) id: string;

    @OneToOne(() => Author, (a) => a.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    author: Author;

    @Column() avatarUrl: string;

    @Column({ type: 'jsonb', default: {} })
    social: { twitter?: string; github?: string; website?: string };

    @Column({ type: 'jsonb', default: { totalBooks: 0, totalReviews: 0, avgRating: 0 } })
    stats: { totalBooks: number; totalReviews: number; avgRating: number };

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
- **Step 2:** Add the inverse relation in `Author`:
  ```ts
  @OneToOne(() => AuthorProfile, (p) => p.author, { cascade: true, eager: false })
  profile?: AuthorProfile;
  ```
  `cascade: true` -> when `authorRepo.save(author)` contains `author.profile`, TypeORM will insert/update the profile automatically.
- **Step 3:** Generate migration `CreateAuthorProfile`:
  ```bash
  npm run migration:generate -- src/migrations/CreateAuthorProfile
  npm run migration:run
  ```
  Verify `\d author_profiles`:
  ```
  Column  |  Type  | Nullable
  id      | uuid   | NOT NULL (PK, FK to authors(id) ON DELETE CASCADE)
  ...
  ```
- **Step 4:** In `AuthorController` add `POST /authors/:id/profile`:
  ```ts
  async createProfile(@Param('id') id: string, @Body() dto: CreateProfileDto) {
    const author = await this.authorRepo.findOneBy({ id });
    if (!author) throw new NotFoundException();
    author.profile = this.profileRepo.create({ id, avatarUrl: dto.avatarUrl, social: dto.social });
    return this.authorRepo.save(author); // cascade insert profile
  }
  ```
  DO NOT call `profileRepo.save(profile)` here.
- **Step 5:** Add `GET /authors/:id?withProfile=true`:
  ```ts
  async getOne(@Param('id') id: string, @Query('withProfile') wp?: string) {
    const relations = wp === 'true' ? ['profile'] : [];
    const author = await this.authorRepo.findOne({ where: { id }, relations });
    if (!author) throw new NotFoundException();
    return author;
  }
  ```

### 2. Minimum acceptance criteria
- `\d author_profiles` shows `id uuid NOT NULL` as both PK and FK to `authors(id) ON DELETE CASCADE`.
- `POST /authors/:id/profile` with valid body -> 201, DB has 1 row in `author_profiles` whose `id` equals `author.id`.
- SQL log of that endpoint shows **INSERT INTO "author_profiles"** coming from cascade via `authorRepo.save`, NO direct call to `profileRepo.save`.
- `GET /authors/:id` (no query param) returns the author **without** `profile` field.
- `GET /authors/:id?withProfile=true` returns the author with `profile` populated.
- `DELETE /authors/:id` cascades and removes the profile (`SELECT COUNT(*) FROM author_profiles WHERE id = :id` = 0 after delete).

### 3. Nice to have
- Write `@JoinColumn({ name: 'id', referencedColumnName: 'id' })` verbosely to make the shared-PK intent obvious.
- Unit test that spies on `profileRepo.save` to prove it is NOT called inside the profile-creation endpoint.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
1-n Review with cascade insert from Book and CHECK rating 1-5
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** `src/review/entities/review.entity.ts`:
  ```ts
  @Entity('reviews')
  @Index(['rating'])
  @Index(['bookId', 'rating'])
  export class Review {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => Book, (b) => b.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'book_id' })
    book: Book;
    @Column({ name: 'book_id' }) bookId: string;

    @Column() reviewerName: string;

    @Column({ type: 'smallint' })
    rating: number;

    @Column({ type: 'text', nullable: true }) comment: string | null;

    @CreateDateColumn() createdAt: Date;
  }
  ```
- **Step 2:** Add the 1-n relation inside `Book`:
  ```ts
  @OneToMany(() => Review, (r) => r.book, { cascade: ['insert'] })
  reviews: Review[];
  ```
  `cascade: ['insert']` - only insert cascade when saving the book; no update/remove cascade.
- **Step 3:** Generate migration `CreateReview`:
  ```bash
  npm run migration:generate -- src/migrations/CreateReview
  ```
  Manually add the CHECK constraint to the migration:
  ```ts
  await queryRunner.query(`ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5);`);
  ```
  `down()` drops the constraint before dropping the table. Run `npm run migration:run`.
- **Step 4:** `POST /books/:id/reviews` (inside `ReviewController`):
  ```ts
  async create(@Param('id') bookId: string, @Body() dto: CreateReviewDto) {
    const book = await this.bookRepo.findOne({ where: { id: bookId }, relations: ['reviews'] });
    if (!book) throw new NotFoundException();
    book.reviews = [...(book.reviews ?? []), this.reviewRepo.create({ ...dto, bookId })];
    await this.bookRepo.save(book); // cascade insert review
    return book.reviews.at(-1);
  }
  ```
- **Step 5:** `CreateReviewDto` using `class-validator`:
  ```ts
  export class CreateReviewDto {
    @IsString() @IsNotEmpty() reviewerName: string;
    @IsInt() @Min(1) @Max(5) rating: number;
    @IsOptional() @IsString() comment?: string;
  }
  ```
- **Step 6:** Update `POST /books` to accept `reviews?: CreateReviewDto[]` nested - when present, cascade insert book + reviews in one shot.

### 2. Minimum acceptance criteria
- `\d reviews` shows FK `book_id -> books(id) ON DELETE CASCADE`, CHECK `rating BETWEEN 1 AND 5`, plus 2 indexes `idx_reviews_rating` and `idx_reviews_book_id_rating` (names generated by TypeORM).
- `POST /books/:id/reviews` with `rating=3` -> 201; `rating=0` or `rating=6` -> 400 (class-validator) or 500 from CHECK if validator is bypassed.
- `POST /books` with body containing `reviews: [{...}, {...}]` nested -> creates book + 2 reviews in one request; SQL log has 1 INSERT into books + 2 INSERT into reviews, with NO separate `reviewRepo.save` calls.
- `DELETE /books/:id` cascades and deletes only that book's reviews; `SELECT COUNT(*) FROM reviews WHERE book_id = :id` = 0 after delete. Reviews of other books remain.

### 3. Nice to have
- Endpoint `GET /books/:id/reviews?minRating=4&sort=recent` exercising the `@Index(['bookId','rating'])` for filter + sort.
- Recompute `author.profile.stats.avgRating` inside a transaction after each review insert by updating jsonb `stats` via `UPDATE author_profiles SET stats = stats || :patch`.
- Write at least one test case that sends a rating violation directly via service (bypassing validator) to prove the DB CHECK still blocks it.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
jsonb column Book.metadata with unique partial index on metadata->>'isbn'
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Update `Book` entity:
  ```ts
  export interface BookMetadata {
    isbn?: string;
    pages?: number;
    language?: string;
    coverUrl?: string;
  }

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata: BookMetadata;
  ```
  DO NOT use `'json'` - it must be `'jsonb'` so Postgres stores binary and can index it.
- **Step 2:** Generate migration `AddBookMetadataJsonb`:
  ```bash
  npm run migration:generate -- src/migrations/AddBookMetadataJsonb
  ```
  Open the migration and add manually (beyond the `ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb`):
  ```ts
  await queryRunner.query(
    `CREATE UNIQUE INDEX uniq_book_isbn ON books ((metadata->>'isbn')) WHERE metadata->>'isbn' IS NOT NULL;`
  );
  ```
  `down()` drops the index before dropping the column:
  ```ts
  await queryRunner.query(`DROP INDEX IF EXISTS uniq_book_isbn;`);
  await queryRunner.query(`ALTER TABLE books DROP COLUMN metadata;`);
  ```
- **Step 3:** Run migration:
  ```bash
  npm run migration:run
  ```
  Verify:
  ```bash
  \d books
  \di uniq_book_isbn
  ```
  Must display `partial, unique`.
- **Step 4:** Update `POST /books` to accept nested `metadata` in body:
  ```ts
  export class CreateBookDto {
    @IsString() title: string;
    @IsUUID() authorId: string;
    @IsArray() @IsUUID('4', { each: true }) tagIds: string[];
    @IsOptional() @IsObject() metadata?: BookMetadata;
  }
  ```
  Service stores the entire object into the `metadata` column.
- **Step 5:** `GET /books/by-isbn/:isbn`:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .where(`book.metadata->>'isbn' = :isbn`, { isbn })
    .getOne();
  ```
- **Step 6:** `GET /books/by-language/:lang` using the `@>` operator:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .where(`book.metadata @> :patch`, { patch: JSON.stringify({ language: lang }) })
    .getMany();
  ```

### 2. Minimum acceptance criteria
- `\d books` shows column `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`.
- `\di uniq_book_isbn`: `UNIQUE, partial` - verify the **partial** clause exists (`WHERE metadata->>'isbn' IS NOT NULL`), not a full unique.
- `POST /books` with `metadata: { isbn: "978-1", pages: 300, language: "en" }` -> 201.
- `POST /books` creating a second book with the same `metadata.isbn = "978-1"` -> 409 (controller catches `QueryFailedError code=23505`) or 500 if not caught. Error payload must surface `23505`.
- `POST /books` creating two books WITHOUT `isbn` (metadata missing the key or `{}`) -> both succeed (partial index ignores NULLs).
- `GET /books/by-isbn/978-1` returns the expected book; `EXPLAIN (ANALYZE) SELECT ... WHERE metadata->>'isbn' = '978-1';` shows `Index Scan using uniq_book_isbn`.
- `GET /books/by-language/en` returns books whose `metadata.language = 'en'` (uses jsonb `@>`).

### 3. Nice to have
- Add a GIN index on `metadata` for broader queries: `CREATE INDEX idx_books_metadata_gin ON books USING GIN (metadata);` - demo `metadata @> '{"pages": 300}'` hitting it.
- Create a `BookMetadataDto` with nested validation (`@IsString @Matches(/^[\d-]+$/)` for isbn).
- Write an e2e test that two concurrent inserts with null isbn both pass, proving the partial index.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
tsvector search_vector + DB-side trigger + GIN index for full-text search
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Update `Book` entity:
  ```ts
  @Column({ type: 'tsvector', nullable: true, select: false })
  searchVector: unknown; // not populated from app, DB trigger handles it
  ```
  `select: false` -> `find()` skips this column by default (tsvector blobs are large and not needed in responses).
- **Step 2:** Generate migration `AddBookSearchVector`. Fill `up()`/`down()` manually:
  ```ts
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE books ADD COLUMN search_vector tsvector;`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION books_search_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', coalesce(NEW.title, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER books_search_update BEFORE INSERT OR UPDATE OF title
      ON books FOR EACH ROW EXECUTE FUNCTION books_search_trigger();
    `);
    await queryRunner.query(`CREATE INDEX idx_book_search_vector ON books USING GIN(search_vector);`);
    // backfill tsvector for existing rows
    await queryRunner.query(`UPDATE books SET search_vector = to_tsvector('english', coalesce(title,''));`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_search_vector;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS books_search_update ON books;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS books_search_trigger();`);
    await queryRunner.query(`ALTER TABLE books DROP COLUMN IF EXISTS search_vector;`);
  }
  ```
- **Step 3:** Run migration:
  ```bash
  npm run migration:run
  ```
  Verify `\d books` has `search_vector tsvector`; `\di idx_book_search_vector` shows GIN.
- **Step 4:** `GET /books/search?q=<keyword>`:
  ```ts
  async search(@Query('q') q: string) {
    const tsq = q.split(/\s+/).filter(Boolean).join(' & ');
    return this.bookRepo.createQueryBuilder('book')
      .where(`book.search_vector @@ to_tsquery('english', :q)`, { q: tsq })
      .orderBy(`ts_rank(book.search_vector, to_tsquery('english', :q))`, 'DESC')
      .limit(20)
      .getMany();
  }
  ```
- **Step 5:** Trigger test: `POST /books` with title `"Advanced NestJS Patterns"`, then `GET /books/search?q=nestjs` should return it. Then `PATCH /books/:id` to `"Advanced Spring Patterns"`: `GET /books/search?q=nestjs` returns nothing, `GET /books/search?q=spring` returns it (proves the trigger reindexes on title change).
- **Step 6:** `EXPLAIN (ANALYZE) SELECT ... FROM books WHERE search_vector @@ to_tsquery('english','nestjs');` verify `Bitmap Index Scan on idx_book_search_vector`.

### 2. Minimum acceptance criteria
- Migration completes: `search_vector` is populated for every existing row (backfill), trigger `books_search_update` exists (`SELECT tgname FROM pg_trigger WHERE tgrelid='books'::regclass;`).
- `POST /books` with a new title -> `SELECT search_vector FROM books WHERE id=:id;` returns a non-empty tsvector.
- `GET /books/search?q=nestjs` hits `Bitmap Index Scan on idx_book_search_vector` in `EXPLAIN ANALYZE`.
- `PATCH /books/:id` changing title -> `search_vector` is auto-updated (verify by querying before/after).
- NO TypeScript code assigns `book.searchVector = ...` anywhere; grepping the repo shows only the entity declaration, no service writes.

### 3. Nice to have
- Vietnamese support: add a `CREATE TEXT SEARCH CONFIGURATION vietnamese (...)` and let the query pick a config based on `Accept-Language`.
- Return highlights using `ts_headline`.
- Benchmark search across 10k books with `autocannon`.
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Auto timestamp + @BeforeInsert / @BeforeUpdate hook and smoke test 5 scenarios
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Verify auto timestamps from EASY: `@CreateDateColumn() createdAt: Date;` and `@UpdateDateColumn() updatedAt: Date;` on `Author`, `Book` (and `Review` createdAt only, `AuthorProfile` has both). Ensure NO manual `new Date()` assigns those fields anywhere in services - grep the entire repo.
- **Step 2:** Add `@BeforeUpdate` hook on `Book` demonstrating an additional side effect (e.g. normalize `title.trim()`):
  ```ts
  @BeforeInsert() @BeforeUpdate()
  trimTitle() {
    if (this.title) this.title = this.title.trim();
  }
  ```
  (This hook only runs when using `repo.save(entity)`, NOT `repo.update(id, partial)` - document it in the README.)
- **Step 3:** Run smoke test. `docker compose up -d`, `npm run migration:run`, `nest start --watch`.
- **Step 4:** Cascade save profile:
  ```bash
  curl -X POST http://localhost:3000/authors/<authorId>/profile \
    -H "Content-Type: application/json" \
    -d '{"avatarUrl":"https://cdn/a.png","social":{"github":"orwell"}}' -i
  ```
- **Step 5:** Nested create book + reviews + metadata:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Advanced NestJS","authorId":"<a>","tagIds":["<t>"],"metadata":{"isbn":"978-1","pages":300,"language":"en"},"reviews":[{"reviewerName":"Alice","rating":5,"comment":"Great"},{"reviewerName":"Bob","rating":4}]}' -i
  ```
- **Step 6:** Duplicate isbn fail:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Duplicate","authorId":"<a>","tagIds":["<t>"],"metadata":{"isbn":"978-1"}}' -i
  ```
  Expect HTTP 409 or 500, response mentions `23505` or `uniq_book_isbn`.
- **Step 7:** Full-text search:
  ```bash
  curl "http://localhost:3000/books/search?q=nestjs" -i
  ```
- **Step 8:** Auto updatedAt:
  ```bash
  curl -X PATCH http://localhost:3000/books/<bookId> \
    -H "Content-Type: application/json" \
    -d '{"title":"Advanced NestJS v2"}' -i
  ```
  Then query the DB before/after to compare `createdAt` (unchanged) and `updatedAt` (changed), and `SELECT search_vector FROM books` to see it reindexed with the new title.
- **Step 9:** In `README.md` under **Smoke Test**, paste:
  - Responses from the 5 scenarios (cascade profile, create book nested, duplicate isbn, search, patch).
  - `\di` listing showing all 6 indexes (2 single, 2 composite, 1 unique partial, 1 GIN).
  - `\d author_profiles`, `\d reviews`, `\d books` showing columns + FKs + CHECKs.
  - `EXPLAIN ANALYZE` of `GET /books/search?q=nestjs` showing `Bitmap Index Scan on idx_book_search_vector`.

### 2. Minimum acceptance criteria
- The 5 smoke test scenarios all produce the expected results above; responses/errors pasted verbatim into README.
- Grep the entire repo: NO `new Date()` assigned to `createdAt` or `updatedAt` in any service.
- All 4 new migrations (profile, review, metadata+isbn, search_vector+trigger) run and revert cleanly; running `npm run migration:revert` 4 times restores the DB to the EASY state.
- `EXPLAIN ANALYZE` of the search endpoint is pasted into README with plan `Bitmap Index Scan on idx_book_search_vector`.
- `\di` output in README shows **at least 6 indexes** between `books` and `reviews` (title, author_id+published_year, uniq_book_isbn, idx_book_search_vector, rating, book_id+rating).

### 3. Nice to have
- Write `docs/TIMELINE.md` summarizing the migration order and what each migration adds, so newcomers can follow.
- Micro-benchmark with `autocannon` comparing search/by-isbn/by-language endpoints with vs without their indexes.
- Export a curl script (`docs/smoke-test.sh`) covering all 5 smoke test scenarios.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Correctly implement advanced TypeORM relation modeling (1-1 shared PK, 1-n, n-n) with context-appropriate cascade behavior.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Design and run safe multi-step PostgreSQL migrations with clean rollback paths.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Apply `jsonb`, partial indexing, and GIN full-text search in real API flows, validated with `EXPLAIN ANALYZE`.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Maintain reliable timestamp/update/delete behavior while avoiding common production anti-patterns.
<!-- @starci/seperator -->
## 4
### text
<!-- @starci/seperator -->
Produce technical evidence (SQL logs, index plans, smoke-test outputs) to self-evaluate implementation quality.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
TypeORM - Indices (@Index)
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/indices
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM - Entity listeners & subscribers
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/listeners-and-subscribers
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
TypeORM - One-to-one relations
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/one-to-one-relations
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
TypeORM - Cascade options
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/relations#cascades
<!-- @starci/seperator -->

## 4
### alias
<!-- @starci/seperator -->
PostgreSQL - JSONB type & operators
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/datatype-json.html
<!-- @starci/seperator -->

## 5
### alias
<!-- @starci/seperator -->
PostgreSQL - Full text search (tsvector, GIN)
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/textsearch.html
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
GitHub Repository link
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Public repo `library-typeorm-advanced-features` with entities (Author/AuthorProfile/Book/Tag/Review), 6 migrations (2 from EASY + 4 new), the `books_search_trigger`, and a README covering 6 sections: Challenge description, How to run, Architecture, Smoke Test (paste real SQL cascade log + EXPLAIN ANALYZE GIN/partial unique + before/after counts for cascade delete), Code Execution Trace >=3 hops, Design Decisions.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
