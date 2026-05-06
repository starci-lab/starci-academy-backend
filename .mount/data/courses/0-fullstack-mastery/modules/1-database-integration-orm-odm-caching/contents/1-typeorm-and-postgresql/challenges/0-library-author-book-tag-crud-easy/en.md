# title
Library CRUD with TypeORM + PostgreSQL (Author 1-n Book n-n Tag) and real migrations

# description
This is a hands-on coding challenge. You will build a NestJS library API with TypeORM and PostgreSQL using three entities: Author, Book, and Tag, with core relationships between them. The goal is to practice basic CRUD flow, step-by-step migrations, and tag-based querying.

# requirements
## 0
### purpose
Build a NestJS project `library-typeorm-postgres` running on real PostgreSQL via Docker, with the core library domain `Author 1-n Book` and `Book n-n Tag`.
### technicalConstraints
Must include Postgres 16 in `docker-compose.yml`, 3 entities (`Author`, `Book`, `Tag`) with correct relations, and TypeORM setup through `ConfigService` + `src/database/data-source.ts` for CLI migrations with `synchronize: false` and `migrationsRun: false`.
### proTipsHints
- Start Postgres with `docker compose up -d` before booting the app to isolate connection issues quickly.
- Keep the join-table name explicit as `book_tags` for clearer queries and debugging.
- Reserve `publishedYear` for migration 2, not initial schema creation.

## 1
### purpose
Practice production-style migration flow: initialize schema first, then evolve it safely with a second migration.
### technicalConstraints
Must provide exactly 2 migrations under `src/migrations/`: init schema (`authors/books/tags/book_tags` + FK + index) and add `books.published_year int NULL`; both migrations require full `up()`/`down()`.
### proTipsHints
- Use the standard CLI scripts:
  - `typeorm`: `typeorm-ts-node-commonjs`
  - `migration:generate`: `npm run typeorm -- migration:generate -d src/database/data-source.ts`
  - `migration:run`: `npm run typeorm -- migration:run -d src/database/data-source.ts`
  - `migration:revert`: `npm run typeorm -- migration:revert -d src/database/data-source.ts`
- After each run/revert, verify schema with `psql` (`\dt`, `\d books`) so you know it matches expectations.

## 2
### purpose
Implement core CRUD with TypeORM Repository and tag-based filtering through QueryBuilder.
### technicalConstraints
Required endpoints: `POST /authors`, `POST /tags`, `POST /books` (validate `authorId` + `tagIds`, return 404 when invalid), `GET /authors/:id/books` (load `relations: ['books']`), `GET /books?tag=<tagName>` (use QueryBuilder + join tags, return `Book[]` including `tags`).
### proTipsHints
- Validate `tagIds` by count matching to detect missing IDs early.
- Prefer `innerJoinAndSelect` for filter + response shape in one query.
- Avoid unresolved lazy relations leaking `Promise` values in API responses.

## 3
### purpose
Finish the deliverable to submission standards, keeping configuration and commit scope safe.
### technicalConstraints
Commit `.env.example` only; never commit a real `.env`.
### proTipsHints
- Capture successful migration-run output to increase reviewer confidence.
- Keep commits clean and focused on the code and docs required for the challenge.

### forbidden
- `synchronize: true` in any env/file -> **0 prompt migration**.
- Lazy relation (`Promise<Book[]>`) without `await` -> response may stringify `Promise` -> **0 whole challenge**.
- Commit a real `.env` file; only commit `.env.example`.
- Incorrect optional/nullable declarations for required entity fields per the brief -> **0 prompt entity requirements**.

# prerequisites
## 0
### text
Completed the EASY challenge `0-sql-nosql-landscape-survey-easy` (know when to pick SQL).
## 1
### text
Basic SQL (CREATE TABLE, JOIN, FK).
## 2
### text
`docker` + `docker compose` installed.
## 3
### text
Comfortable with `@nestjs/config` / `ConfigService`.

# steps

## 0
### title
Bootstrap the project and the Postgres docker-compose
### body
**Steps to follow**
- **Step 1:** Create the project and install deps:
  ```bash
  nest new library-typeorm-postgres
  cd library-typeorm-postgres
  npm i @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer
  npm i -D @types/pg
  ```
- **Step 2:** Create `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16
      ports: ["5432:5432"]
      environment:
        POSTGRES_DB: library
        POSTGRES_USER: library
        POSTGRES_PASSWORD: library
      volumes: ["pgdata:/var/lib/postgresql/data"]
  volumes:
    pgdata:
  ```
  Run:
  ```bash
  docker compose up -d
  ```
- **Step 3:** Create `.env` + `.env.example` with `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=library`, `DB_PASSWORD=library`, `DB_NAME=library`. Add `.env` to `.gitignore`.
- **Step 4:** Scaffold the skeleton:
  ```bash
  nest g module database
  nest g module author
  nest g module book
  nest g module tag
  ```

**Minimum acceptance criteria**
- `docker compose up -d` starts Postgres successfully; `docker ps` shows the `postgres:16` container.
- `psql -h localhost -U library -d library` logs in with the `.env` password.
- `.env.example` is committed; the real `.env` sits in `.gitignore`.
- `nest start --watch` boots without missing-module errors.

**Nice to have**
- Add a `pgadmin` or `adminer` service in `docker-compose.yml` to browse the DB via UI.
- Add `npm run db:up` aliasing `docker compose up -d`.

## 1
### title
Define the 3 entities with the correct 1-n and n-n relationships
### body
**Steps to follow**
- **Step 1:** Create `src/author/entities/author.entity.ts`:
  ```ts
  @Entity('authors')
  export class Author {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() name: string;
    @Column({ type: 'text', nullable: true }) bio: string | null;
    @OneToMany(() => Book, (b) => b.author) books: Book[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
- **Step 2:** Create `src/book/entities/book.entity.ts`:
  ```ts
  @Entity('books')
  export class Book {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() title: string;
    @ManyToOne(() => Author, (a) => a.books, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' }) author: Author;
    @Column({ name: 'author_id' }) authorId: string;
    @ManyToMany(() => Tag, (t) => t.books, { cascade: true })
    @JoinTable({ name: 'book_tags' })
    tags: Tag[];
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  ```
  (The `publishedYear` column is added in migration 2 - do NOT declare it yet.)
- **Step 3:** Create `src/tag/entities/tag.entity.ts`:
  ```ts
  @Entity('tags')
  export class Tag {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ unique: true }) name: string;
    @ManyToMany(() => Book, (b) => b.tags) books: Book[];
  }
  ```
- **Step 4:** Create `src/database/data-source.ts`:
  ```ts
  import { DataSource } from 'typeorm';
  import { config } from 'dotenv';
  config();
  export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: ['error', 'warn', 'migration'],
  });
  ```
- **Step 5:** In `AppModule`, import `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })` returning a config with `autoLoadEntities: true`, `synchronize: false`, `migrationsRun: false`.

**Minimum acceptance criteria**
- The 3 entity files exist with the exact decorators and relations described above.
- `Book.publishedYear` is NOT present in code at this step (reserved for migration 2).
- `src/database/data-source.ts` default-exports a `DataSource` with `synchronize: false` and `migrations` pointing at the right path.
- Repo-wide grep: NO `synchronize: true` anywhere.

**Nice to have**
- Add `@Index(['name'])` on `Author.name` for future search.
- Extract a generic `IRepository<T>` interface if you want to practice abstractions.

## 2
### title
Write and run migration 1 (init schema) via the CLI
### body
**Steps to follow**
- **Step 1:** Add scripts to `package.json`:
  ```json
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/database/data-source.ts",
    "migration:run":      "npm run typeorm -- migration:run -d src/database/data-source.ts",
    "migration:revert":   "npm run typeorm -- migration:revert -d src/database/data-source.ts"
  }
  ```
- **Step 2:** Generate the init migration from the entities:
  ```bash
  npm run migration:generate -- src/migrations/InitSchema
  ```
  Open `src/migrations/<timestamp>-InitSchema.ts` and verify there are 4 `CREATE TABLE` statements (`authors`, `books`, `tags`, `book_tags`) + FKs + the `tags.name` unique index.
- **Step 3:** Run the migration:
  ```bash
  npm run migration:run
  ```
- **Step 4:** Verify through psql:
  ```bash
  docker exec -it <container> psql -U library -d library -c "\dt"
  ```
  You should see 4 business tables + the `migrations` tracking table.
- **Step 5:** Test revert:
  ```bash
  npm run migration:revert
  ```
  Confirm `\dt` shows only the `migrations` table, then run `migration:run` again to restore.

**Minimum acceptance criteria**
- `npm run migration:run` succeeds on an empty DB with the log `Migration "InitSchema<timestamp>" has been executed successfully`.
- `psql \dt` shows **exactly 5 tables**: `authors`, `books`, `tags`, `book_tags`, `migrations`.
- FK `books.author_id -> authors.id` exists (verify via `\d books`).
- `npm run migration:revert` drops all 4 business tables; a subsequent `migration:run` restores them.

**Nice to have**
- Declare `idx_books_author_id` explicitly in migration 1 instead of relying on TypeORM's default.
- Write a `db:seed` script inserting 2 authors + 5 books + 3 tags for smoke tests.

## 3
### title
Implement the CRUD + QueryBuilder tag filter
### body
**Steps to follow**
- **Step 1:** In each module (`author`, `book`, `tag`) import `TypeOrmModule.forFeature([<Entity>])` and inject `@InjectRepository(<Entity>)` into the service.
- **Step 2:** `AuthorService`: `create(dto)`, `findById(id, { relations: ['books'] })`.
- **Step 3:** `TagService`: `create(dto)` throws `ConflictException` on duplicate name.
- **Step 4:** `BookService.create(dto)`:
  ```ts
  async create(dto: CreateBookDto) {
    const author = await this.authorRepo.findOneBy({ id: dto.authorId });
    if (!author) throw new NotFoundException('author not found');
    const tags = await this.tagRepo.findBy({ id: In(dto.tagIds) });
    if (tags.length !== dto.tagIds.length) throw new NotFoundException('tag not found');
    const book = this.bookRepo.create({ title: dto.title, author, tags });
    return this.bookRepo.save(book);
  }
  ```
- **Step 5:** `BookService.findByTag(tagName)` uses `QueryBuilder`:
  ```ts
  return this.bookRepo.createQueryBuilder('book')
    .innerJoinAndSelect('book.tags', 'tag')
    .where('tag.name = :n', { n: tagName })
    .getMany();
  ```
- **Step 6:** Matching controllers, DTOs + a global `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `main.ts`.
- **Step 7:** `AuthorController.getBooks(@Param('id') id)` calls `authorRepo.findOne({ where: { id }, relations: ['books'] })`; if null -> `NotFoundException`.

**Minimum acceptance criteria**
- `POST /authors`, `POST /tags`, `POST /books` all return 201 with valid JSON; validation failures return 400 with `class-validator` messages.
- `POST /books` with a non-existent `authorId` -> 404 `author not found`; an unknown `tagId` -> 404 `tag not found`.
- `GET /authors/:id/books` returns JSON with `id`, `name`, and `books: [...]` (may be empty when no book exists).
- `GET /books?tag=<name>` returns only books tagged accordingly; an unknown tag returns `[]` (NOT 404).
- No `Promise` string appears in responses (no lazy-relation leak).

**Nice to have**
- Add pagination (`?page`, `?size`) to `GET /books`.
- Add a default `GET /books` returning the 20 most-recent items ordered by `createdAt desc`.
- Use separate DTOs + response interfaces so internal columns don't leak.

## 4
### title
Migration 2 - add Book.publishedYear and apply against a DB that already has data
### body
**Steps to follow**
- **Step 1:** Seed at least 2 authors + 3 books + 2 tags through curl to mimic a "prod" DB that already has data.
- **Step 2:** Open `book.entity.ts` and add:
  ```ts
  @Column({ name: 'published_year', type: 'int', nullable: true })
  publishedYear: number | null;
  ```
- **Step 3:** Generate the diff migration:
  ```bash
  npm run migration:generate -- src/migrations/AddBookPublishedYear
  ```
- **Step 4:** Open the new migration, verify `up()` has `ADD COLUMN "published_year"` (nullable) and `down()` has `DROP COLUMN "published_year"`. If TypeORM generates a NOT NULL column without a default (which would fail on a table with data) -> manually switch to `nullable: true`.
- **Step 5:** Run:
  ```bash
  npm run migration:run
  ```
  Confirm success and that the old rows remain (`SELECT COUNT(*) FROM books` unchanged).
- **Step 6:** Test revert:
  ```bash
  npm run migration:revert
  ```
  Verify the column is gone (`\d books` no longer shows `published_year`); rerun `migration:run`.
- **Step 7:** Update `CreateBookDto` + `UpdateBookDto` to optionally accept `publishedYear`; confirm `POST /books` with `{title, authorId, tagIds, publishedYear: 2024}` persists the value.

**Minimum acceptance criteria**
- `src/migrations/` contains **exactly 2 migration files** (InitSchema + AddBookPublishedYear) with ascending timestamps.
- After migration 2, `\d books` shows `published_year int NULL`; `SELECT COUNT(*) FROM books` keeps the previous row count (no data loss).
- `npm run migration:revert` drops just `published_year`, leaving other columns intact.
- `POST /books` with `publishedYear: 2024` persists `publishedYear=2024`; omitting the field stores `NULL`.

**Nice to have**
- Make the migration idempotent via a `hasColumn` check before add/drop.
- Add a `CHECK` constraint `published_year BETWEEN 1000 AND 2100`.

## 5
### title
Smoke-test 3 scenarios via curl and paste the output into the README
### body
**Steps to follow**
- **Step 1:** Run `docker compose up -d` + `npm run migration:run` + `nest start --watch`.
- **Step 2:** Create an author:
  ```bash
  curl -X POST http://localhost:3000/authors \
    -H "Content-Type: application/json" \
    -d '{"name":"George Orwell","bio":"English novelist"}'
  ```
- **Step 3:** Create 2 tags (`POST /tags` with `{"name":"dystopia"}` and `{"name":"classic"}`) and capture their ids.
- **Step 4:** Create a book with both tags and a `publishedYear`:
  ```bash
  curl -X POST http://localhost:3000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"1984","authorId":"<authorId>","tagIds":["<tagId1>","<tagId2>"],"publishedYear":1949}'
  ```
- **Step 5:** Verify eager load:
  ```bash
  curl http://localhost:3000/authors/<authorId>/books
  ```
- **Step 6:** Verify the QueryBuilder filter:
  ```bash
  curl "http://localhost:3000/books?tag=dystopia"
  ```
- **Step 7:** In `README.md` under **Smoke Test**, paste the 4 real JSON responses (create author, create book, get author with books, filter by tag) + paste raw `psql \dt` text output (showing 5 tables) + paste raw successful `npm run migration:run` log text.
- **Step 8:** Draw the ERD in the README using Mermaid:
  ```
  erDiagram
    AUTHORS ||--o{ BOOKS : writes
    BOOKS }o--o{ TAGS : tagged_with
  ```

**Minimum acceptance criteria**
- The 4 scenarios return HTTP 201/200; `GET /authors/:id/books` has a `books: [...]` array containing the book just created.
- `GET /books?tag=dystopia` returns an array containing `"1984"`; `GET /books?tag=does-not-exist` returns `[]` (not 404, not 500).
- The README contains a rendered Mermaid ERD and a **Smoke Test** section with the 4 real JSON responses + raw `psql \dt` output text + raw migration log text.
- Deleting an `author` (`DELETE /authors/:id` if implemented) cascades and removes their books (verify with `SELECT COUNT` before/after) thanks to `onDelete: 'CASCADE'`.

**Nice to have**
- Add `DELETE /authors/:id` to test cascade.
- Export a curl script to `docs/smoke-test.sh`.
- Include a GIF of migrate -> create -> query in the README.

# outputs
## 0
### text
Build a working NestJS + TypeORM library CRUD API with correct Author/Book/Tag relationship modeling.
## 1
### text
Run a safe two-step migration workflow (initial schema + schema evolution) against PostgreSQL.
## 2
### text
Implement tag-based filtering with QueryBuilder and handle core validation/error cases correctly.
## 3
### text
Maintain safe environment practices during implementation (`synchronize: false`, commit only `.env.example`).

# references
## 0
### alias
NestJS - Database TypeORM
### url
https://docs.nestjs.com/techniques/database
## 1
### alias
TypeORM - Migrations
### url
https://typeorm.io/migrations
## 2
### alias
TypeORM - Many-to-many relations
### url
https://typeorm.io/many-to-many-relations
## 3
### alias
PostgreSQL - ALTER TABLE
### url
https://www.postgresql.org/docs/16/sql-altertable.html

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
A repository with full source + `docker-compose.yml` for Postgres + 2 migrations + a README containing a Mermaid ERD and a **Smoke Test** section pasting the 4 real JSON responses + raw `psql \dt` output text + raw migration log text. Commit `.env.example` only; do not commit the real `.env`.
### score
20
### prompts
#### 0
##### title
docker-compose Postgres + 3 entities with correct 1-n and n-n relationships
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion 1 (2 points): `docker-compose.yml` runs Postgres 16 and `docker compose up -d` starts successfully.
- Criterion 2 (2 points): The 3 entities `Author`, `Book`, `Tag` use correct relationship decorators (`Author @OneToMany Book`, `Book @ManyToOne Author onDelete CASCADE`, `Book @ManyToMany Tag` with `@JoinTable({ name: 'book_tags' })`, `Tag.name` UNIQUE).
- Criterion 3 (1 point): `AppModule` uses `TypeOrmModule.forRootAsync` and reads config from `ConfigService`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
2 migrations that run up/down cleanly, schema is correct, synchronize stays false
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion 1 (2 points): `src/migrations/` contains exactly 2 files (InitSchema + AddBookPublishedYear) with ascending timestamps.
- Criterion 2 (2 points): `npm run migration:run` on an empty DB creates `authors`, `books`, `tags`, `book_tags` and FK `books.author_id`.
- Criterion 3 (1 point): Migration 2 adds `published_year int NULL` without data loss; `npm run migration:revert` drops the column correctly.
- Criterion 4 (1 point): Repo-wide grep shows no `synchronize: true`; config keeps `synchronize: false` and `migrationsRun: false`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 2
##### title
Repository CRUD + QueryBuilder tag filter behave correctly
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion 1 (2 points): `POST /authors`, `POST /tags`, `POST /books` return 201 with valid JSON; invalid `authorId`/`tagIds` correctly return 404.
- Criterion 2 (2 points): `GET /authors/:id/books` eager-loads and returns real `books: [...]` data.
- Criterion 3 (1 point): `GET /books?tag=<name>` uses QueryBuilder tag filtering correctly; unknown tag returns `[]`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 3
##### title
Forbidden rules and safe commit compliance
##### score
4
##### promptText
Grading rubric (max 4 points):

- Criterion 1 (1 point): No `synchronize: true` in any environment/file.
- Criterion 2 (1 point): No lazy relation leak (`Promise<Book[]>`) in API responses.
- Criterion 3 (1 point): Do not commit real `.env`; commit only `.env.example`.
- Criterion 4 (1 point): Required entity fields are not incorrectly declared optional/nullable.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.

# difficulty
easy

# score
20

