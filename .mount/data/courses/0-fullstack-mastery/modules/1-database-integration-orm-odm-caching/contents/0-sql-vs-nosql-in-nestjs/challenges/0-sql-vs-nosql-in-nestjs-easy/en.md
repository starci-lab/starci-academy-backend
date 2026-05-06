# title
Compare SQL and NoSQL with a mini NestJS library API

# description
This is a hands-on coding challenge. You will build a small NestJS API with two parallel storage flows for the same book management domain: one flow uses PostgreSQL (SQL), and one flow uses MongoDB (NoSQL). The goal is to understand the difference between strict relational data modeling and flexible metadata-based modeling.

# requirements
## 0
### purpose
Build two endpoint groups in parallel (`/sql/books`, `/nosql/books`) to create/read book data using two different database models.
### technicalConstraints
You must split SQL and NoSQL responsibilities into exactly two independent modules in NestJS; SQL must use TypeORM + PostgreSQL, NoSQL must use Mongoose + MongoDB, and in-memory arrays are not allowed.
### proTipsHints
- For SQL, model a relation such as `Book` - `Author` to highlight joins and constraints.
- For NoSQL, include flexible fields (e.g. `metadata`, `tags`, `extraInfo`) to show schema flexibility.

## 1
### purpose
Implement core API operations for both SQL and NoSQL flows: create and read.
### technicalConstraints
All 6 endpoints are mandatory (`POST /sql/books`, `GET /sql/books`, `GET /sql/books/:id`, `POST /nosql/books`, `GET /nosql/books`, `GET /nosql/books/:id`) and input validation must enforce at least `title` and `authorName`.
### proTipsHints
- Use DTO + `ValidationPipe` to fail invalid payloads early.
- For SQL, load relations appropriately so responses include author data.

## 2
### purpose
Make the output clearly demonstrate the difference between relational and document-style data.
### technicalConstraints
SQL responses must show relational output (book + author), NoSQL responses must include flexible metadata with at least 2 custom keys, and `README.md` must briefly explain when SQL or NoSQL is a better fit for this challenge context.
### proTipsHints
- Keep business logic similar across both flows so comparisons stay fair.
- Keep explanations practical and evidence-based from your API outputs.

### forbidden
- Using in-memory arrays instead of real PostgreSQL/MongoDB -> **0 environment prompt**.
- Missing any of the 6 required endpoints -> **0 for the corresponding endpoint prompt**.
- No flexible metadata in NoSQL flow -> **0 NoSQL prompt**.
- SQL response does not show relational book-author data -> **0 SQL prompt**.

# prerequisites
## 0
### text
Node.js LTS, npm, git installed.
## 1
### text
Docker Desktop (or Docker Engine) and docker compose available.
## 2
### text
Basic NestJS module/controller/service structure.
## 3
### text
Basic DTO + validation usage.
## 4
### text
Basic CRUD with TypeORM or Mongoose.

# steps
## 0
### title
Initialize project and wire PostgreSQL + MongoDB
### body
**Steps to follow**
- Create a new NestJS project (or use an equivalent starter).
- Add docker compose configuration for PostgreSQL and MongoDB.
- Install required packages for TypeORM/PostgreSQL and Mongoose/MongoDB.
- Configure DB modules in `AppModule` (or dedicated modules).

**Minimum acceptance criteria**
- App and both databases can run successfully via docker compose.
- App boots with no DB connection errors.

**Nice to have**
- Move configuration into `.env`.
- Add npm scripts for faster environment startup/shutdown.

## 1
### title
Implement the SQL flow for book management
### body
**Steps to follow**
- Create SQL entities for `Book` and `Author` (or an equivalent relational design).
- Create DTOs, service, and controller for `/sql/books`.
- Implement:
  - `POST /sql/books` to create a book with an author.
  - `GET /sql/books` to list books.
  - `GET /sql/books/:id` to fetch details by id.

**Minimum acceptance criteria**
- At least one SQL record can be created via API.
- `GET /sql/books/:id` returns book data plus author data.

**Nice to have**
- Prevent obvious duplicates (e.g. same title + author).
- Use clear response DTO mapping.

## 2
### title
Implement the NoSQL flow for book management
### body
**Steps to follow**
- Create a Mongoose schema for `NoSqlBook`.
- Add flexible metadata fields (e.g. object `metadata` and/or array `tags`).
- Create DTOs, service, and controller for `/nosql/books`.
- Implement:
  - `POST /nosql/books`
  - `GET /nosql/books`
  - `GET /nosql/books/:id`

**Minimum acceptance criteria**
- At least one NoSQL record can be created via API.
- NoSQL response contains flexible metadata with at least 2 custom keys.

**Nice to have**
- Support filtering by tag or metadata key.
- Normalize SQL/NoSQL response shapes for easier comparison.

## 3
### title
Test with curl and write a short SQL vs NoSQL conclusion
### body
**Steps to follow**
- Run the app with `nest start --watch`.
- Test SQL and NoSQL endpoints with `curl`.
- Capture representative responses from both flows.
- Add a short comparison section in `README.md`:
  - When you prefer SQL.
  - When you prefer NoSQL.
  - Main long-term maintenance trade-offs.

**Minimum acceptance criteria**
- All 6 required endpoints are successfully callable.
- `README.md` includes a 6-8 sentence comparison backed by your actual API behavior.

**Nice to have**
- Add a compact SQL vs NoSQL comparison table in README.
- Add one extra endpoint per flow (e.g. title search) for stronger realism.

# outputs
## 0
### text
Implement two parallel NestJS API flows for the same domain using SQL and NoSQL.
## 1
### text
Explain relational vs document-model differences using real API responses from both flows.
## 2
### text
Make context-based storage choices instead of applying one persistence model to every use case.

# references
## 0
### alias
NestJS - Database techniques (TypeORM / Sequelize / Mongoose / Prisma)
### url
https://docs.nestjs.com/techniques/database
## 1
### alias
MongoDB - NoSQL explained
### url
https://www.mongodb.com/resources/basics/databases/nosql-explained
## 2
### alias
PostgreSQL - About
### url
https://www.postgresql.org/about/
## 3
### alias
Redis - Data types overview
### url
https://redis.io/docs/latest/develop/data-types/
## 4
### alias
Elasticsearch - JavaScript client
### url
https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html
## 5
### alias
AWS - NoSQL vs SQL
### url
https://aws.amazon.com/nosql/

# submissions
## 0
### type
githubRepository
### title
Repository link - SQL vs NoSQL challenge (library context)
### description
Submit a public repository link containing the NestJS source code for this challenge. The repository must include clear run instructions, endpoint testing notes for SQL/NoSQL flows, and a short comparison conclusion in `README.md`.
### score
20
### prompts
#### 0
##### title
Environment setup and complete SQL flow implementation
##### score
6
##### promptText
Grading rubric (max 6 points):

- Criterion A (2 points): Project runs against real PostgreSQL (no in-memory persistence).
- Criterion B (2 points): All required SQL endpoints exist: `POST /sql/books`, `GET /sql/books`, `GET /sql/books/:id`.
- Criterion C (2 points): SQL responses clearly show relational data (book + author).

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
Complete NoSQL flow implementation with flexible metadata
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion A (2 points): Project runs against real MongoDB.
- Criterion B (2 points): All required NoSQL endpoints exist: `POST /nosql/books`, `GET /nosql/books`, `GET /nosql/books/:id`.
- Criterion C (1 point): NoSQL responses include flexible metadata with at least 2 custom keys.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 2
##### title
Endpoint testing evidence for both SQL and NoSQL flows
##### score
5
##### promptText
Grading rubric (max 5 points):

- Criterion A (2 points): Repository provides clear endpoint testing instructions.
- Criterion B (2 points): Repository includes evidence of successful SQL and NoSQL endpoint calls (curl or equivalent API client).
- Criterion C (1 point): Responses clearly demonstrate differences between relational and document data models.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 3
##### title
README comparison quality for SQL vs NoSQL
##### score
4
##### promptText
Grading rubric (max 4 points):

- Criterion A (2 points): `README.md` clearly explains when SQL vs NoSQL should be preferred in this challenge context.
- Criterion B (2 points): Includes realistic trade-off analysis in at least 6-8 sentences (not generic statements).

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.

# difficulty
easy

# score
20
