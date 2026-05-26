# title
<!-- @starci/seperator -->
Library CRUD with TypeORM + PostgreSQL (Author 1-n Book n-n Tag) and real migrations
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
You will build a library management API with **NestJS**, **TypeORM**, and **PostgreSQL** using three entities **Author**, **Book**, **Tag** and 1-n and n-n relations. The goal is to master CRUD flow, write real step-by-step migrations, and query data by tag with QueryBuilder.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Build a NestJS project `library-typeorm-postgres` running on real PostgreSQL via Docker, with the library domain `Author 1-n Book` and `Book n-n Tag`.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must include Postgres 16 in `docker-compose.yml`; 3 entities `Author/Book/Tag` with correct relations; TypeORM configured via `ConfigService` + `src/database/data-source.ts` for CLI migrations; `synchronize: false` and `migrationsRun: false` in every env.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Run `docker compose up -d` first, then boot the app, to isolate DB connection issues.
- Name the join table explicitly `book_tags` for cleaner queries/filters later.
- Reserve `publishedYear` for migration 2, not initial schema creation.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 6):

- Criterion A (2 points): NestJS project scaffolded with correct module structure, boots cleanly via `nest start --watch` without missing module errors.
- Criterion B (2 points): 3 entities `Author/Book/Tag` declare correct 1-n and n-n relations with TypeORM decorators (`@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinTable`).
- Criterion C (1 point): `docker-compose.yml` runs Postgres 16 + container healthy, app connects via `ConfigService`.
- Criterion D (1 point): `data-source.ts` exports `DataSource` with `synchronize: false`, `migrations` pointing at the correct path, ready for CLI migrations.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Practice production-style migration flow: init schema first, then evolve it safely with a second migration after the system has data.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Must provide exactly 2 migrations under `src/migrations/`: migration 1 creates `authors/books/tags/book_tags` + FK + index on `books.author_id`; migration 2 adds `books.published_year int NULL`. Both have full `up()` and `down()` and are revertable.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use standard CLI scripts `migration:generate`, `migration:run`, `migration:revert` via `typeorm-ts-node-commonjs`.
- After each run/revert verify with `psql` (`\dt`, `\d books`).
- Migration 2 must be nullable so it applies to a table with existing data.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 5):

- Criterion A (2 points): Migration 1 (`InitSchema`) creates all 4 tables + FK `books.author_id -> authors.id` + index on the FK; runs successfully on an empty DB.
- Criterion B (2 points): Migration 2 (`AddBookPublishedYear`) adds `published_year int NULL` WITHOUT losing existing data; `up()` and `down()` are symmetric.
- Criterion C (1 point): Both migrations revert cleanly — `npm run migration:revert` drops only that migration's artefacts, leaving others intact.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Implement core CRUD for Author, Book, Tag and tag-based filtering with TypeORM Repository + QueryBuilder.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Required endpoints: `POST /authors`, `POST /tags`, `POST /books` (validate `authorId` + `tagIds`, return 404 when invalid), `GET /authors/:id/books` (load `relations: ['books']`), `GET /books?tag=<tagName>` (use QueryBuilder + join tags, return `Book[]` with `tags`).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Check `tags.length !== dto.tagIds.length` to detect missing tag IDs early.
- Use `innerJoinAndSelect` to filter and return tags in one query.
- Enable `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` globally.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 6):

- Criterion A (2 points): The 3 POST endpoints (Author/Tag/Book) return HTTP 201 with valid JSON; validation failures return 400 with `class-validator` messages.
- Criterion B (2 points): `POST /books` handles error cases correctly — missing `authorId` returns 404 `author not found`; wrong tag ID returns 404 `tag not found`.
- Criterion C (1 point): `GET /authors/:id/books` loads relation via `relations: ['books']` and returns the array (possibly empty).
- Criterion D (1 point): `GET /books?tag=<name>` uses QueryBuilder `innerJoinAndSelect`, returns matching books or an empty array (NOT 404 when no match).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Finalize the deliverable to submission standards: 6-section README, smoke test with real output, and safe env handling.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README must include 6 sections: Challenge description, How to run, Architecture/Stack (with Mermaid ERD), Smoke Test (paste real JSON output + `psql \dt` text), Code Execution Trace (≥3 hops `file:line -> method()`), Design Decisions. Commit only `.env.example`; never commit real `.env`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Capture successful migration-run logs + `psql \dt` output to increase reviewer confidence.
- Code Execution Trace should cover `POST /books` showing author + tag validation, save with cascade.
- A simple Mermaid ERD `AUTHORS ||--o{ BOOKS : writes` + `BOOKS }o--o{ TAGS : tagged_with` is enough.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- `synchronize: true` in any env/file -> **0 prompt migration**.
- Lazy relation (`Promise<Book[]>`) without `await`, leaking `Promise` strings in responses -> **0 whole challenge**.
- Commit a real `.env` with credentials to a public repo -> **0 whole challenge**.
- Wrong optional/nullable declarations for required entity fields (`Author.name`, `Book.title`, `Tag.name`) -> **0 prompt entity requirements**.
- Fabricate output in the README Smoke Test section (paste fake JSON instead of running) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
3
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 3):

- Criterion A (1 point): README contains all 6 required sections (Challenge description, How to run, Architecture, Smoke Test, Code Execution Trace, Design Decisions).
- Criterion B (1 point): Smoke Test pastes real JSON output + real `psql \dt` text + real migration run log (no fabrication).
- Criterion C (1 point): Code Execution Trace has ≥3 hops `file:line -> method()` for a main flow (e.g. `POST /books`).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You can implement a library CRUD API with **NestJS** and **TypeORM** with correct relations across Author, Book, Tag.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You can operate a 2-step migration flow (init schema + evolve schema) safely as in production.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You can implement tag-based queries with QueryBuilder and handle common validation/error cases correctly.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You keep env configuration safe (no `synchronize: true`, no real `.env` commits) and write a 6-section README to standard.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed lesson `1-typeorm-and-postgresql` (1:1/1:N/N:N via Cat/Toy/Owner entities).
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Basic SQL (CREATE TABLE, JOIN, FK).
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
`docker` + `docker compose` installed.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Comfortable with `@nestjs/config` / `ConfigService`.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Scaffold the project and Postgres docker-compose
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the project + install deps:
  ```bash
  nest new library-typeorm-postgres
  cd library-typeorm-postgres
  npm i @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer
  npm i -D @types/pg
  ```
- **Step 2:** Create `docker-compose.yml` with service `postgres:16`, ports `5432:5432`, env `POSTGRES_DB/USER/PASSWORD=library`, volume `pgdata:/var/lib/postgresql/data`. Run `docker compose up -d`.
- **Step 3:** Create `.env` + `.env.example` with `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=library`, `DB_PASSWORD=library`, `DB_NAME=library`. Add `.env` to `.gitignore`.
- **Step 4:** Scaffold modules `nest g module database/author/book/tag`.

### 2. Minimum acceptance criteria
- `docker compose up -d` starts Postgres successfully; `docker ps` shows healthy `postgres:16`.
- `psql -h localhost -U library -d library` logs in using the password from `.env`.
- `.env.example` is committed; real `.env` is in `.gitignore` (verify with `git status`).
- `nest start --watch` boots without missing module errors.

### 3. Nice to have
- Add `pgadmin` or `adminer` service in `docker-compose.yml` for UI browsing.
- Add `npm run db:up` script as alias for `docker compose up -d`.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/typeorm`** + **`typeorm`** + **`pg`** — standard for NestJS + PostgreSQL via TypeORM Repository pattern.

**API mapping:**
- `TypeOrmModule.forRootAsync` -> bootstrap DataSource from ConfigService.
- `TypeOrmModule.forFeature([Entity])` -> register repository per module.
- `@InjectRepository(Entity)` -> inject `Repository<Entity>` into service.

**Differences / gotchas:**
- `synchronize: true` is convenient in dev but forbidden in production — can drop columns when entity changes.
- `autoLoadEntities: true` only scans entities of modules that called `forFeature` — forgetting to register silently skips them.
##### example
```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: "postgres",
        host: cfg.get("DB_HOST"),
        port: cfg.get<number>("DB_PORT"),
        username: cfg.get("DB_USER"),
        password: cfg.get("DB_PASSWORD"),
        database: cfg.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class AppModule {}
```
#### 1
##### lang
csharp
##### guide
**Main library:** **EF Core 8** + `Npgsql.EntityFrameworkCore.PostgreSQL`.

**API mapping:**
- `TypeOrmModule.forRoot` -> `services.AddDbContext<LibraryDbContext>(opt => opt.UseNpgsql(connStr))`.
- `@InjectRepository` -> constructor inject `LibraryDbContext`.
- `migration:generate` -> `dotnet ef migrations add InitSchema`.

**Differences / gotchas:**
- EF Core has no `synchronize: true` — always use version-controlled migrations.
- Connection string read from `appsettings.json` via `IConfiguration`.
##### example
```csharp
public class LibraryDbContext : DbContext {
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Tag> Tags => Set<Tag>();
    public LibraryDbContext(DbContextOptions<LibraryDbContext> opt) : base(opt) {}
}
builder.Services.AddDbContext<LibraryDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Library")));
```
#### 2
##### lang
go
##### guide
**Main library:** **`gorm.io/gorm`** + `gorm.io/driver/postgres`.

**API mapping:**
- `TypeOrmModule.forRoot` -> `gorm.Open(postgres.Open(dsn), &gorm.Config{})`.
- `Repository<T>` -> `*gorm.DB` passed into service struct.
- `migration:generate` -> separate `golang-migrate` tool.

**Differences / gotchas:**
- `AutoMigrate` only safe in dev — use `golang-migrate` with versioned SQL files in prod.
- `gorm.Model` embed gives `CreatedAt`/`UpdatedAt`/`DeletedAt` automatically.
##### example
```go
dsn := "host=localhost user=library password=library dbname=library port=5432 sslmode=disable"
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
if err != nil { log.Fatal(err) }
// production: use golang-migrate, NOT AutoMigrate
```
#### 3
##### lang
java
##### guide
**Main library:** **Spring Boot Data JPA** (Hibernate) + `org.postgresql:postgresql` driver.

**API mapping:**
- `TypeOrmModule.forRoot` -> `application.yml` `spring.datasource.url` + JPA auto-config.
- `Repository<T>` -> `interface AuthorRepo extends JpaRepository<Author, UUID>`.
- `migration:generate` -> Flyway/Liquibase SQL script.

**Differences / gotchas:**
- `spring.jpa.hibernate.ddl-auto=none` in production (equivalent to `synchronize: false`).
- Flyway auto-runs migrations at startup when enabled.
##### example
```java
@SpringBootApplication
public class LibraryApp {
    public static void main(String[] args) { SpringApplication.run(LibraryApp.class, args); }
}
// application.yml: spring.datasource.url, spring.jpa.hibernate.ddl-auto: none
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Define 3 entities with correct 1-n and n-n relations
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create `src/author/entities/author.entity.ts` with `@PrimaryGeneratedColumn('uuid')`, `name`, `bio` (nullable text), `@OneToMany(() => Book, b => b.author) books`, `@CreateDateColumn`/`@UpdateDateColumn`.
- **Step 2:** Create `src/book/entities/book.entity.ts` with `id` (uuid), `title`, `@ManyToOne(() => Author, a => a.books, { onDelete: 'CASCADE' })` + `@JoinColumn({ name: 'author_id' })`, `authorId` column, `@ManyToMany(() => Tag, t => t.books, { cascade: true })` + `@JoinTable({ name: 'book_tags' })`. DO NOT add `publishedYear` yet.
- **Step 3:** Create `src/tag/entities/tag.entity.ts` with `id` (uuid), `name` (unique), `@ManyToMany(() => Book, b => b.tags) books`.
- **Step 4:** Create `src/database/data-source.ts` exporting `new DataSource({ type: 'postgres', ..., synchronize: false, logging: ['error', 'warn', 'migration'] })`.
- **Step 5:** In `AppModule` import `TypeOrmModule.forRootAsync({ useFactory, inject: [ConfigService] })` with `autoLoadEntities: true`, `synchronize: false`, `migrationsRun: false`.

### 2. Minimum acceptance criteria
- 3 entity files exist with the correct decorators and relations as described.
- `Book.publishedYear` does NOT appear in code yet (reserved for migration 2).
- `src/database/data-source.ts` exports a `DataSource` with `synchronize: false`, `migrations` pointing correctly.
- Repo-wide grep: NO occurrence of `synchronize: true` anywhere.

### 3. Nice to have
- Add `@Index(['name'])` on `Author.name` for future search.
- Extract a common `IRepository<T>` interface for additional abstraction practice.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Write and run migration 1 (init schema) via CLI
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Add scripts to `package.json`: `typeorm`, `migration:generate`, `migration:run`, `migration:revert` using `typeorm-ts-node-commonjs`.
- **Step 2:** Generate init migration: `npm run migration:generate -- src/migrations/InitSchema`. Verify the file has 4 `CREATE TABLE` + FK + unique index.
- **Step 3:** Run `npm run migration:run`.
- **Step 4:** Verify with `docker exec -it <container> psql -U library -d library -c "\dt"` — must show 4 tables + the `migrations` table.
- **Step 5:** Test revert: `npm run migration:revert` → `\dt` shows only `migrations` → `migration:run` again to restore.

### 2. Minimum acceptance criteria
- `npm run migration:run` succeeds with log `Migration "InitSchema<timestamp>" has been executed successfully`.
- `psql \dt` shows exactly 5 tables: `authors`, `books`, `tags`, `book_tags`, `migrations`.
- FK `books.author_id -> authors.id` exists (verify with `\d books`).
- `npm run migration:revert` drops all 4 business tables; re-running `migration:run` restores them.

### 3. Nice to have
- Add an explicit `idx_books_author_id` in migration 1 instead of letting TypeORM auto-generate it.
- Add a `db:seed` script for 2 authors + 5 books + 3 tags as smoke test fixtures.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Write CRUD + QueryBuilder tag filter
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** In each module (`author`, `book`, `tag`) import `TypeOrmModule.forFeature([<Entity>])` and inject `@InjectRepository(<Entity>)` into the service.
- **Step 2:** `AuthorService`: `create(dto)`, `findById(id, { relations: ['books'] })`.
- **Step 3:** `TagService`: `create(dto)` throws `ConflictException` on duplicate name.
- **Step 4:** `BookService.create(dto)` — validate `authorRepo.findOneBy({ id: authorId })`, validate `tagRepo.findBy({ id: In(tagIds) })` (check `tags.length !== tagIds.length`), then `bookRepo.create({ title, author, tags })` + `save`.
- **Step 5:** `BookService.findByTag(tagName)` uses `createQueryBuilder('book').innerJoinAndSelect('book.tags', 'tag').where('tag.name = :n', { n: tagName }).getMany()`.
- **Step 6:** Enable `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` globally in `main.ts`.
- **Step 7:** `AuthorController.getBooks(@Param('id'))` calls `authorRepo.findOne({ where: { id }, relations: ['books'] })`, null -> `NotFoundException`.

### 2. Minimum acceptance criteria
- `POST /authors`, `POST /tags`, `POST /books` all return 201 with valid JSON; validation failures return 400.
- `POST /books` with missing `authorId` returns 404 `author not found`; wrong tagId returns 404 `tag not found`.
- `GET /authors/:id/books` returns JSON with `id`, `name`, `books: [...]`.
- `GET /books?tag=<name>` returns only matching books; no match -> empty `[]` (NOT 404).

### 3. Nice to have
- Add pagination (`?page`, `?size`) to `GET /books`.
- Separate DTO + response interfaces to avoid leaking internal columns.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **TypeORM `Repository` + `QueryBuilder`** — primary CRUD/filter pattern in NestJS.

**API mapping:**
- `findOneBy({ id })` -> single-row lookup by PK.
- `findBy({ id: In(ids) })` -> multi-row lookup.
- `createQueryBuilder('alias').innerJoinAndSelect(...)` -> JOIN that returns the relation too.

**Differences / gotchas:**
- `findOneBy` does NOT load relations — use `findOne({ where, relations })` when needed.
- An empty `In([])` produces invalid `IN ()` SQL on Postgres — early-return when the array is empty.
##### example
```typescript
async create(dto: CreateBookDto) {
  const author = await this.authorRepo.findOneBy({ id: dto.authorId })
  if (!author) throw new NotFoundException("author not found")
  const tags = await this.tagRepo.findBy({ id: In(dto.tagIds) })
  if (tags.length !== dto.tagIds.length) throw new NotFoundException("tag not found")
  const book = this.bookRepo.create({ title: dto.title, author, tags })
  return this.bookRepo.save(book)
}

findByTag(name: string) {
  return this.bookRepo.createQueryBuilder("book")
    .innerJoinAndSelect("book.tags", "tag")
    .where("tag.name = :n", { n: name })
    .getMany()
}
```
#### 1
##### lang
csharp
##### guide
**Main library:** **EF Core 8** `DbContext` + LINQ.

**API mapping:**
- `findOneBy` -> `ctx.Authors.FirstOrDefaultAsync(a => a.Id == id)`.
- `findBy({ id: In(ids) })` -> `ctx.Tags.Where(t => ids.Contains(t.Id)).ToListAsync()`.
- `createQueryBuilder().innerJoinAndSelect` -> `ctx.Books.Include(b => b.Tags).Where(b => b.Tags.Any(t => t.Name == name))`.

**Differences / gotchas:**
- LINQ `Contains` translates to `IN (...)`; empty list is safe at the SQL level.
- `Include` is always eager — opposite of TypeORM defaults.
##### example
```csharp
public async Task<Book> CreateAsync(CreateBookDto dto) {
    var author = await _ctx.Authors.FirstOrDefaultAsync(a => a.Id == dto.AuthorId)
        ?? throw new NotFoundException("author not found");
    var tags = await _ctx.Tags.Where(t => dto.TagIds.Contains(t.Id)).ToListAsync();
    if (tags.Count != dto.TagIds.Count) throw new NotFoundException("tag not found");
    var book = new Book { Title = dto.Title, Author = author, Tags = tags };
    _ctx.Books.Add(book);
    await _ctx.SaveChangesAsync();
    return book;
}
```
#### 2
##### lang
go
##### guide
**Main library:** **GORM** with preload + manual association.

**API mapping:**
- `findOneBy` -> `db.First(&author, "id = ?", id)`.
- `findBy In` -> `db.Where("id IN ?", ids).Find(&tags)`.
- `innerJoinAndSelect` -> `db.Joins("INNER JOIN book_tags ON ...").Preload("Tags")`.

**Differences / gotchas:**
- GORM returns `gorm.ErrRecordNotFound` instead of nil — wrap with `errors.Is`.
- `db.Model(&book).Association("Tags").Replace(tags)` is the proper way to set N:N.
##### example
```go
func (s *BookService) Create(dto CreateBookDto) (*Book, error) {
    var author Author
    if err := s.db.First(&author, "id = ?", dto.AuthorID).Error; err != nil {
        return nil, errors.New("author not found")
    }
    var tags []Tag
    s.db.Where("id IN ?", dto.TagIDs).Find(&tags)
    if len(tags) != len(dto.TagIDs) { return nil, errors.New("tag not found") }
    book := &Book{Title: dto.Title, AuthorID: author.ID, Tags: tags}
    return book, s.db.Create(book).Error
}
```
#### 3
##### lang
java
##### guide
**Main library:** **Spring Data JPA** with derived query + `@Query` JPQL.

**API mapping:**
- `findOneBy` -> `authorRepo.findById(id)` (Optional).
- `findBy In` -> `tagRepo.findAllById(ids)`.
- `innerJoinAndSelect` -> `@Query("SELECT b FROM Book b JOIN b.tags t WHERE t.name = :name")`.

**Differences / gotchas:**
- `findAllById` returns a list possibly shorter than input — check size to detect missing.
- `@Transactional` boundary controls flush timing; place at service method to rollback correctly.
##### example
```java
@Transactional
public Book create(CreateBookDto dto) {
    Author author = authorRepo.findById(dto.getAuthorId())
        .orElseThrow(() -> new NotFoundException("author not found"));
    List<Tag> tags = tagRepo.findAllById(dto.getTagIds());
    if (tags.size() != dto.getTagIds().size()) throw new NotFoundException("tag not found");
    Book book = new Book(dto.getTitle(), author, tags);
    return bookRepo.save(book);
}
```
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Migration 2 - add Book.publishedYear over a DB that already has data
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Seed at least 2 authors + 3 books + 2 tags via curl to simulate a prod DB with existing data.
- **Step 2:** Open `book.entity.ts` and add `@Column({ name: 'published_year', type: 'int', nullable: true }) publishedYear: number | null`.
- **Step 3:** Generate the diff migration: `npm run migration:generate -- src/migrations/AddBookPublishedYear`.
- **Step 4:** Verify the new migration: `up()` has `ADD COLUMN "published_year"` (nullable) and `down()` has `DROP COLUMN`. Manually fix if TypeORM mis-generates (e.g. NOT NULL without default).
- **Step 5:** Run `npm run migration:run` — verify success log + `SELECT COUNT(*) FROM books` unchanged.
- **Step 6:** Test revert: `npm run migration:revert` → `\d books` no longer shows `published_year` → `migration:run` again.
- **Step 7:** Update DTOs `CreateBookDto`/`UpdateBookDto` to optionally accept `publishedYear`; verify `POST /books` stores it correctly.

### 2. Minimum acceptance criteria
- `src/migrations/` contains exactly 2 migration files with increasing timestamps.
- After migration 2, `\d books` shows `published_year int NULL`; `SELECT COUNT(*) FROM books` unchanged.
- `npm run migration:revert` drops only `published_year`, leaving other columns intact.
- `POST /books` with body `publishedYear: 2024` -> record has `publishedYear=2024`; omitted -> `NULL`.

### 3. Nice to have
- Write idempotent migration using `hasColumn` before add/drop.
- Add CHECK constraint `published_year BETWEEN 1000 AND 2100` in the migration.
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Smoke test with curl and paste real output into README
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Run `docker compose up -d` + `npm run migration:run` + `nest start --watch`.
- **Step 2:** Create author `POST /authors` (George Orwell + bio).
- **Step 3:** Create 2 tags `dystopia` + `classic`, capture their ids.
- **Step 4:** Create book `1984` with both tags + `publishedYear: 1949`.
- **Step 5:** Verify eager load: `GET /authors/<id>/books`.
- **Step 6:** Verify QueryBuilder filter: `GET /books?tag=dystopia` + `GET /books?tag=no-such-tag`.
- **Step 7:** In `README.md` section **Smoke Test**, paste 4 real JSON response blocks + raw `psql \dt` output + raw `npm run migration:run` success log.
- **Step 8:** Draw the ERD in Mermaid: `AUTHORS ||--o{ BOOKS : writes` + `BOOKS }o--o{ TAGS : tagged_with`.

### 2. Minimum acceptance criteria
- All 4 scenarios return valid HTTP 201/200; `GET /authors/:id/books` shows `books: [...]` with the created book.
- `GET /books?tag=dystopia` returns the `1984` book; `GET /books?tag=no-such-tag` returns `[]`.
- README has a renderable Mermaid ERD and a **Smoke Test** section with 4 real JSON blocks + `psql \dt` output + migration log.
- README has all 6 required sections.

### 3. Nice to have
- Add `DELETE /authors/:id` to test FK cascade.
- Export curl script `docs/smoke-test.sh`.
- Add a GIF demo (migration -> create -> query) to README.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
NestJS - Database TypeORM
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://docs.nestjs.com/techniques/database
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
TypeORM - Migrations
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/migrations
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
TypeORM - Many-to-many relations
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://typeorm.io/many-to-many-relations
<!-- @starci/seperator -->

## 3
### alias
<!-- @starci/seperator -->
PostgreSQL - ALTER TABLE
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.postgresql.org/docs/16/sql-altertable.html
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
Public repo with `library-typeorm-postgres` source: `src/` + `src/migrations/` (exactly 2 files), `docker-compose.yml`, `.env.example`, and `README.md` with all 6 sections (Challenge description, How to run, Architecture with Mermaid ERD, Smoke Test pasting real JSON output + `psql \dt` text + real migration log, Code Execution Trace with ≥3 hops `file:line -> method()`, Design Decisions).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
