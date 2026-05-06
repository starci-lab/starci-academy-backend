# title
Advanced TypeORM - index strategy, jsonb column, 1-1/1-n/n-n relations with cascade and auto timestamp

# description
This is an advanced hands-on TypeORM challenge built from the EASY version. You will extend the project with richer relations, practical indexes, jsonb usage, step-by-step migrations, and correct cascade behavior to make the API closer to production quality.

# requirements
## 0
### purpose
Upgrade the EASY project to an advanced TypeORM challenge that covers full relation modeling, cascade behavior, and production-style schema evolution.
### technicalConstraints
Fork to `library-typeorm-advanced-features`; add `AuthorProfile` (shared PK with `Author`) and `Review` (1-n from `Book`), update `Author`/`Book` relations as required, and keep `synchronize: false`.
### proTipsHints
- Stabilize entity relations first, then generate migrations to avoid noisy migration diffs.
- Keep a clear separation between save-cascade and delete-cascade responsibilities.

## 1
### purpose
Implement index strategy by query intent to compare B-tree, composite, partial, and GIN behavior in real endpoints.
### technicalConstraints
Must include required indexes: `Book.title`, `Book(authorId,publishedYear)`, unique partial `uniq_book_isbn` on `metadata->>'isbn'`, GIN `idx_book_search_vector`, `Review.rating`, and `Review(bookId,rating)`.
### proTipsHints
- Create partial `isbn` index in migration SQL to guarantee the `IS NOT NULL` condition.
- GIN is meaningful only when full-text queries use `search_vector @@ to_tsquery(...)`.

## 2
### purpose
Practice safe multi-step migrations on a database that may already contain data.
### technicalConstraints
Must deliver 4 migrations: `CreateAuthorProfile`, `CreateReview`, `AddBookMetadataJsonb`, `AddBookSearchVector`; each migration has complete `up()`/`down()`, including DB trigger `books_search_trigger` and `search_vector` backfill.
### proTipsHints
- Verify migration results with `\d` and `\di` after each run.
- Re-check nullable/default constraints before applying migrations to non-empty tables.

## 3
### purpose
Deliver advanced API behavior that proves cascade, jsonb query, and full-text search are implemented correctly.
### technicalConstraints
Must implement: `POST /authors/:id/profile`, `GET /authors/:id?withProfile=true`, `POST /books/:id/reviews`, `GET /books/search`, `GET /books/by-isbn/:isbn`, `GET /books/by-language/:lang`, plus delete cascade behavior exactly as specified.
### proTipsHints
- Profile/review creation flows should go through `authorRepo.save(author)` or `bookRepo.save(book)` to demonstrate cascade semantics.
- Keep jsonb/full-text logic in QueryBuilder for transparent SQL verification.

## 4
### purpose
Validate implementation using technical evidence, not just endpoint-level success.
### technicalConstraints
Must prove: SQL log insert into `author_profiles` via cascade, duplicate `isbn` raises `23505`, `EXPLAIN ANALYZE` hits `idx_book_search_vector`, `updated_at` changes correctly on update, author deletion completes cascades without FK errors.
### proTipsHints
- Capture evidence incrementally while implementing to avoid missing proof at the end.
- For cascade delete checks, compare row counts before/after to make proof objective.

### forbidden
- `synchronize: true` in any env/file -> **0 prompt migration**.
- Using `@Column({ type: 'json' })` instead of `'jsonb'` -> **0 prompt jsonb**.
- Calling `profileRepo.save()` / `reviewRepo.save()` directly in cascade-mandatory flows -> **0 prompt cascade**.
- Updating `search_vector` in application code instead of DB trigger -> **0 prompt GIN index**.
- Manual `new Date()` assignment for `createdAt` / `updatedAt` -> **0 prompt auto timestamp**.

# prerequisites
## 0
### text
Finished EASY `0-library-author-book-tag-crud-easy`.
## 1
### text
Basic Postgres knowledge: jsonb operators (`->`, `->>`, `@>`), tsvector/tsquery, PL/pgSQL triggers.
## 2
### text
Understand cascade semantics (save cascade vs onDelete cascade - they are different).

# steps

## 0
### title
Fork EASY, install deps, scaffold new entities
### body
**Steps**
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

**Minimum acceptance criteria**
- New project folder `library-typeorm-advanced-features` boots with `nest start --watch`.
- `package.json` contains `class-validator` and `class-transformer`.
- New modules `ReviewModule` and `ProfileModule` exist and are imported into `AppModule`.
- Original 3 entities + 2 EASY migrations remain; `synchronize: false` unchanged.

**Nice to have**
- Add Swagger `@nestjs/swagger` with `/api` endpoint to verify schema after each step.
- Set `strictPropertyInitialization: false` in `tsconfig.json` if TypeScript complains about uninitialized entity fields.

## 1
### title
1-1 AuthorProfile with shared PK and cascade save
### body
**Steps**
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

**Minimum acceptance criteria**
- `\d author_profiles` shows `id uuid NOT NULL` as both PK and FK to `authors(id) ON DELETE CASCADE`.
- `POST /authors/:id/profile` with valid body -> 201, DB has 1 row in `author_profiles` whose `id` equals `author.id`.
- SQL log of that endpoint shows **INSERT INTO "author_profiles"** coming from cascade via `authorRepo.save`, NO direct call to `profileRepo.save`.
- `GET /authors/:id` (no query param) returns the author **without** `profile` field.
- `GET /authors/:id?withProfile=true` returns the author with `profile` populated.
- `DELETE /authors/:id` cascades and removes the profile (`SELECT COUNT(*) FROM author_profiles WHERE id = :id` = 0 after delete).

**Nice to have**
- Write `@JoinColumn({ name: 'id', referencedColumnName: 'id' })` verbosely to make the shared-PK intent obvious.
- Unit test that spies on `profileRepo.save` to prove it is NOT called inside the profile-creation endpoint.

## 2
### title
1-n Review with cascade insert from Book and CHECK rating 1-5
### body
**Steps**
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

**Minimum acceptance criteria**
- `\d reviews` shows FK `book_id -> books(id) ON DELETE CASCADE`, CHECK `rating BETWEEN 1 AND 5`, plus 2 indexes `idx_reviews_rating` and `idx_reviews_book_id_rating` (names generated by TypeORM).
- `POST /books/:id/reviews` with `rating=3` -> 201; `rating=0` or `rating=6` -> 400 (class-validator) or 500 from CHECK if validator is bypassed.
- `POST /books` with body containing `reviews: [{...}, {...}]` nested -> creates book + 2 reviews in one request; SQL log has 1 INSERT into books + 2 INSERT into reviews, with NO separate `reviewRepo.save` calls.
- `DELETE /books/:id` cascades and deletes only that book's reviews; `SELECT COUNT(*) FROM reviews WHERE book_id = :id` = 0 after delete. Reviews of other books remain.

**Nice to have**
- Endpoint `GET /books/:id/reviews?minRating=4&sort=recent` exercising the `@Index(['bookId','rating'])` for filter + sort.
- Recompute `author.profile.stats.avgRating` inside a transaction after each review insert by updating jsonb `stats` via `UPDATE author_profiles SET stats = stats || :patch`.
- Write at least one test case that sends a rating violation directly via service (bypassing validator) to prove the DB CHECK still blocks it.

## 3
### title
jsonb column Book.metadata with unique partial index on metadata->>'isbn'
### body
**Steps**
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

**Minimum acceptance criteria**
- `\d books` shows column `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`.
- `\di uniq_book_isbn`: `UNIQUE, partial` - verify the **partial** clause exists (`WHERE metadata->>'isbn' IS NOT NULL`), not a full unique.
- `POST /books` with `metadata: { isbn: "978-1", pages: 300, language: "en" }` -> 201.
- `POST /books` creating a second book with the same `metadata.isbn = "978-1"` -> 409 (controller catches `QueryFailedError code=23505`) or 500 if not caught. Error payload must surface `23505`.
- `POST /books` creating two books WITHOUT `isbn` (metadata missing the key or `{}`) -> both succeed (partial index ignores NULLs).
- `GET /books/by-isbn/978-1` returns the expected book; `EXPLAIN (ANALYZE) SELECT ... WHERE metadata->>'isbn' = '978-1';` shows `Index Scan using uniq_book_isbn`.
- `GET /books/by-language/en` returns books whose `metadata.language = 'en'` (uses jsonb `@>`).

**Nice to have**
- Add a GIN index on `metadata` for broader queries: `CREATE INDEX idx_books_metadata_gin ON books USING GIN (metadata);` - demo `metadata @> '{"pages": 300}'` hitting it.
- Create a `BookMetadataDto` with nested validation (`@IsString @Matches(/^[\d-]+$/)` for isbn).
- Write an e2e test that two concurrent inserts with null isbn both pass, proving the partial index.

## 4
### title
tsvector search_vector + DB-side trigger + GIN index for full-text search
### body
**Steps**
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

**Minimum acceptance criteria**
- Migration completes: `search_vector` is populated for every existing row (backfill), trigger `books_search_update` exists (`SELECT tgname FROM pg_trigger WHERE tgrelid='books'::regclass;`).
- `POST /books` with a new title -> `SELECT search_vector FROM books WHERE id=:id;` returns a non-empty tsvector.
- `GET /books/search?q=nestjs` hits `Bitmap Index Scan on idx_book_search_vector` in `EXPLAIN ANALYZE`.
- `PATCH /books/:id` changing title -> `search_vector` is auto-updated (verify by querying before/after).
- NO TypeScript code assigns `book.searchVector = ...` anywhere; grepping the repo shows only the entity declaration, no service writes.

**Nice to have**
- Vietnamese support: add a `CREATE TEXT SEARCH CONFIGURATION vietnamese (...)` and let the query pick a config based on `Accept-Language`.
- Return highlights using `ts_headline`.
- Benchmark search across 10k books with `autocannon`.

## 5
### title
Auto timestamp + @BeforeInsert / @BeforeUpdate hook and smoke test 5 scenarios
### body
**Steps**
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

**Minimum acceptance criteria**
- The 5 smoke test scenarios all produce the expected results above; responses/errors pasted verbatim into README.
- Grep the entire repo: NO `new Date()` assigned to `createdAt` or `updatedAt` in any service.
- All 4 new migrations (profile, review, metadata+isbn, search_vector+trigger) run and revert cleanly; running `npm run migration:revert` 4 times restores the DB to the EASY state.
- `EXPLAIN ANALYZE` of the search endpoint is pasted into README with plan `Bitmap Index Scan on idx_book_search_vector`.
- `\di` output in README shows **at least 6 indexes** between `books` and `reviews` (title, author_id+published_year, uniq_book_isbn, idx_book_search_vector, rating, book_id+rating).

**Nice to have**
- Write `docs/TIMELINE.md` summarizing the migration order and what each migration adds, so newcomers can follow.
- Micro-benchmark with `autocannon` comparing search/by-isbn/by-language endpoints with vs without their indexes.
- Export a curl script (`docs/smoke-test.sh`) covering all 5 smoke test scenarios.

# outputs
## 0
### text
Correctly implement advanced TypeORM relation modeling (1-1 shared PK, 1-n, n-n) with context-appropriate cascade behavior.
## 1
### text
Design and run safe multi-step PostgreSQL migrations with clean rollback paths.
## 2
### text
Apply `jsonb`, partial indexing, and GIN full-text search in real API flows, validated with `EXPLAIN ANALYZE`.
## 3
### text
Maintain reliable timestamp/update/delete behavior while avoiding common production anti-patterns.
## 4
### text
Produce technical evidence (SQL logs, index plans, smoke-test outputs) to self-evaluate implementation quality.

# references
## 0
### alias
TypeORM - Indices (@Index)
### url
https://typeorm.io/indices
## 1
### alias
TypeORM - Entity listeners & subscribers
### url
https://typeorm.io/listeners-and-subscribers
## 2
### alias
TypeORM - One-to-one relations
### url
https://typeorm.io/one-to-one-relations
## 3
### alias
TypeORM - Cascade options
### url
https://typeorm.io/relations#cascades
## 4
### alias
PostgreSQL - JSONB type & operators
### url
https://www.postgresql.org/docs/16/datatype-json.html
## 5
### alias
PostgreSQL - Full text search (tsvector, GIN)
### url
https://www.postgresql.org/docs/16/textsearch.html

# submissions
## 0
### type
githubUrl
### title
GitHub Repository link
### description
Repo containing source code + 4 new migrations (profile, review, metadata+isbn, search_vector+trigger) + README with a **Smoke Test** section pasting the 5 real scenarios + `\di` output (>= 6 indexes) + `EXPLAIN ANALYZE` of the search endpoint. Commit `.env.example`, DO NOT commit `.env`.
### score
30
### prompts
#### 0
##### title
1-1 AuthorProfile shared PK with cascade save from Author
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion 1 (2 points): `AuthorProfile` is modeled with shared PK correctly (`@PrimaryColumn('uuid', { name: 'id' })` + `@OneToOne` + `@JoinColumn({ name: 'id' })`), and `Author.profile` uses `cascade: true`.
- Criterion 2 (2 points): `POST /authors/:id/profile` creates profile through `authorRepo.save(author)`; SQL log shows `INSERT INTO author_profiles`; no direct `profileRepo.save` call.
- Criterion 3 (1 point): `GET /authors/:id?withProfile=true` loads profile, while default request does not.
- Criterion 4 (1 point): `DELETE /authors/:id` cascades and removes `author_profiles` correctly.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
1-n Review with cascade insert + CHECK rating + 2 indexes (rating, composite)
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion 1 (2 points): `Review` relation and DB constraints are correct (`@ManyToOne ... onDelete: 'CASCADE'`, CHECK `rating BETWEEN 1 AND 5`, rating and composite indexes).
- Criterion 2 (2 points): `POST /books` with nested `reviews[]` performs cascade insert for book + reviews in one flow.
- Criterion 3 (1 point): `DELETE /books/:id` cascades only that book's reviews.
- Criterion 4 (1 point): invalid ratings (e.g. 0, 6) are rejected correctly.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 2
##### title
jsonb column Book.metadata with unique partial index on isbn behaves correctly
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion 1 (2 points): `Book.metadata` uses `'jsonb'` with default `'{}'::jsonb` (not `'json'`).
- Criterion 2 (2 points): migration creates unique partial index `uniq_book_isbn` with `WHERE metadata->>'isbn' IS NOT NULL`.
- Criterion 3 (1 point): duplicate `isbn` fails with `23505`, while multiple rows without `isbn` succeed.
- Criterion 4 (1 point): `GET /books/by-isbn/:isbn` query works and `EXPLAIN ANALYZE` shows `Index Scan using uniq_book_isbn`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 3
##### title
tsvector search_vector + DB-side trigger + GIN index full-text search
##### score
7
##### promptText
Grading rubric (max 7 points):

- Criterion 1 (2 points): migration adds `search_vector`, DB trigger function, update trigger, GIN index `idx_book_search_vector`, and backfill for existing rows.
- Criterion 2 (2 points): no TypeScript code assigns `book.searchVector` directly (DB trigger is the only update path).
- Criterion 3 (2 points): `GET /books/search?q=<kw>` uses `search_vector @@ to_tsquery(...)` and `EXPLAIN ANALYZE` hits `Bitmap Index Scan on idx_book_search_vector`.
- Criterion 4 (1 point): updating title via `PATCH /books/:id` auto-refreshes `search_vector` (verified before/after query/search).

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 4
##### title
Auto timestamp + 6 indexes + clean up/down migrations + smoke test in README
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion 1 (2 points): `@CreateDateColumn` + `@UpdateDateColumn` are used correctly; no manual `new Date()` assignment to these timestamp fields.
- Criterion 2 (1 point): `\di` output shows at least 6 required indexes.
- Criterion 3 (1 point): all 4 new migrations run/revert cleanly and return DB to EASY baseline.
- Criterion 4 (1 point): README **Smoke Test** includes required evidence: 5 real scenarios + search `EXPLAIN ANALYZE` + `\di` output.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
## 1
### type
googleDocsUrl
### title
Design Note - which cascade for which use case, jsonb vs regular column, GIN vs B-tree
### description
Google Docs (`Anyone with link: Viewer`) at least 500 words explaining: (a) differences between `cascade: ['insert']` / `cascade: ['update']` / `cascade: true` / `onDelete: 'CASCADE'` - 4-row comparison table with real project examples; (b) when to reach for a `jsonb` column instead of creating a separate entity, trade-offs on query + index cost; (c) GIN (tsvector) vs B-tree (`metadata->>'isbn'`) vs partial index - where each shines; (d) a Mermaid `erDiagram` showing all 5 entities + 4 relations + cascade annotations.
### score
10
### prompts
#### 0
##### title
Cover all four points a/b/c/d with a comparison table and Mermaid diagram
##### score
10
##### promptText
Grading rubric (max 10 points):

- Criterion 1 (3 points): document is at least 500 words and includes all four numbered sections a/b/c/d.
- Criterion 2 (3 points): section (a) contains a complete 4-row cascade comparison table with required columns and concrete project examples.
- Criterion 3 (2 points): sections (b) and (c) correctly analyze jsonb trade-offs and GIN vs B-tree vs partial index usage.
- Criterion 4 (2 points): section (d) includes a renderable Mermaid `erDiagram` with all 5 entities, 4 relations, and cascade annotations.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.

# difficulty
medium

# score
40
