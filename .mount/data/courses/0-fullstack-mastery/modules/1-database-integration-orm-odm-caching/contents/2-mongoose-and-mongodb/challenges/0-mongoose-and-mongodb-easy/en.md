# title
Blog API with Mongoose and MongoDB

# description
This is a hands-on coding challenge using NestJS, Mongoose, and MongoDB. You will build a basic Blog API to practice flexible schemas, document queries, and safe update flows.

# requirements
## 0
### purpose
Set up a real MongoDB-backed NestJS project for blog document CRUD.
### technicalConstraints
MongoDB must run via `docker compose`, app must connect through `MongooseModule.forRoot`, and use database `blog`.
### proTipsHints
- Start Mongo first, then boot NestJS to isolate infra vs app issues.
- Keep connection config explicit to simplify debugging.

## 1
### purpose
Define a `Post` schema that is structured but still flexible.
### technicalConstraints
`PostSchema` must include: `title` (required, indexed), `content` (required), `author` (required), `tags` (`[String]`), `metadata` (Mixed/Object), and `timestamps: true`.
### proTipsHints
- Use `SchemaFactory.createForClass(Post)` for clean decorator-to-schema mapping.
- Keep `metadata` flexible but intentional; avoid turning everything into Mixed.

## 2
### purpose
Implement core API behavior for create/list/detail/update flows.
### technicalConstraints
Must provide `POST /posts`, `GET /posts`, `GET /posts/:id`, `PATCH /posts/:id`; list endpoint must sort by `createdAt` descending; detail/update must throw `NotFoundException` for missing ids.
### proTipsHints
- Use `.exec()` for predictable async behavior.
- Use `{ new: true }` in update to return the updated document.

## 3
### purpose
Prove endpoint correctness with runtime evidence.
### technicalConstraints
Testing must use curl, with raw JSON/terminal output pasted as evidence; update flow must clearly show `updatedAt` changes.
### proTipsHints
- Create two posts with different `metadata` shapes to prove flexibility.
- Reuse returned ids to run update and detail checks quickly.

### forbidden
- Missing `timestamps: true` in `@Schema` -> **0 schema prompt**.
- No index on `title` -> **0 schema prompt**.
- `GET /posts` not sorted by latest-first -> **0 endpoint prompt**.
- Using screenshots instead of raw output text as main evidence -> **0 evidence prompt**.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI
## 2
### text
Docker (to run MongoDB)
## 3
### text
npm install

# steps

## 0
### title
Initialize the project and configure MongoDB
### body
### 1. Steps to follow
- Step 1: Create a new project using NestJS CLI:
    ```bash
    nest new mongoose-and-mongodb-easy
    ```
- Step 2: Navigate to the project directory:
    ```bash
    cd mongoose-and-mongodb-easy
    ```
- Step 3: Install the required dependencies:
    ```bash
    npm install @nestjs/mongoose mongoose
    ```
- Step 4: Create a `docker-compose.yml` file at the project root to start MongoDB:
    ```yaml
    services:
      mongo:
        image: mongo:7
        environment:
          MONGO_INITDB_ROOT_USERNAME: mongo
          MONGO_INITDB_ROOT_PASSWORD: mongo
        ports:
          - "27017:27017"
    ```
- Step 5: Start MongoDB:
    ```bash
    docker compose up -d
    ```
- Step 6: Configure `MongooseModule.forRoot()` in `AppModule` with the connection string `mongodb://mongo:mongo@localhost:27017/blog?authSource=admin`.

### 2. Minimum acceptance criteria
- MongoDB starts successfully via `docker compose up -d`.
- NestJS connects to database `blog` without connection errors.
- App boots with Mongoose integration enabled.

### 3. Nice to have
- Move connection string to `MONGO_URI` env var.
- Add a health endpoint to report DB connection status.

## 1
### title
Define Schema and Model
### body
### 1. Steps to follow
- Step 1: Create `post.schema.ts` and define `PostSchema` with `@Schema({ timestamps: true })`.
- Step 2: Add `title`, `content`, `author`, `tags`, and `metadata` with correct constraints and types.
- Step 3: Export schema via `SchemaFactory.createForClass(Post)`.
- Step 4: Register it in module using `MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])`.

### 2. Minimum acceptance criteria
- `PostSchema` contains all required fields and types.
- `title` is indexed, required fields are enforced.
- `timestamps` generates `createdAt` and `updatedAt`.

### 3. Nice to have
- Add min-length validation for `title` and `content`.
- Add a typed metadata contract for common keys.

## 2
### title
Build Service and Controller
### body
### 1. Steps to follow
- Step 1: Create `PostService` and inject Model via `@InjectModel(Post.name)`.
- Step 2: Implement `create`, `findAll`, `findOne`, `update` using proper Mongoose Model methods.
- Step 3: Ensure `findAll` sorts by `createdAt: -1`.
- Step 4: Throw `NotFoundException` for missing ids in detail/update methods.
- Step 5: Create controller endpoints for `POST/GET/GET:id/PATCH:id`.

### 2. Minimum acceptance criteria
- All 4 endpoints behave according to contract.
- List endpoint returns newest posts first.
- Update endpoint returns updated document.

### 3. Nice to have
- Add DTO + `ValidationPipe`.
- Use response mappers to control output shape.

## 3
### title
Test the endpoints
### body
### 1. Steps to follow
- Step 1: Start the application:
    ```bash
    nest start --watch
    ```
- Step 2: Create a new post with tags and flexible metadata:
    ```bash
    curl -X POST http://localhost:3000/posts \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Getting Started with MongoDB",
        "content": "MongoDB is a document database...",
        "author": "Jane Doe",
        "tags": ["mongodb", "nosql", "tutorial"],
        "metadata": { "readTime": 5, "featured": true, "source": "internal" }
      }'
    ```
- Step 3: Create a second post with differently structured metadata:
    ```bash
    curl -X POST http://localhost:3000/posts \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Mongoose Best Practices",
        "content": "Schema design is crucial...",
        "author": "Jane Doe",
        "tags": ["mongoose", "best-practices"],
        "metadata": { "series": "MongoDB Mastery", "part": 2 }
      }'
    ```
- Step 4: Get the list of posts (verify sorted by createdAt descending):
    ```bash
    curl http://localhost:3000/posts
    ```
- Step 5: Update a post, adding a new tag:
    ```bash
    curl -X PATCH http://localhost:3000/posts/<id> \
      -H "Content-Type: application/json" \
      -d '{
        "tags": ["mongodb", "nosql", "tutorial", "beginner"]
      }'
    ```

### 2. Minimum acceptance criteria
- `POST /posts` returns `_id`, `createdAt`, and `updatedAt`.
- `GET /posts` returns newest-first ordering.
- `PATCH /posts/:id` updates data and changes `updatedAt`.
- Two different `metadata` structures are both stored successfully.

### 3. Nice to have
- Add 404 test for missing id in `GET /posts/:id` and `PATCH /posts/:id`.
- Paste additional raw Mongo query evidence for reviewer verification.

# outputs
## 0
### text
Build a working Blog API with NestJS + Mongoose on a real MongoDB instance.
## 1
### text
Understand how to combine strict required fields with flexible metadata in document schemas.
## 2
### text
Implement and verify create/list/detail/update document flows correctly.
## 3
### text
Provide reproducible technical evidence using raw output text.

# references
## 0
### alias
NestJS Mongoose Integration
### url
https://docs.nestjs.com/techniques/mongodb
## 1
### alias
Mongoose Schemas Guide
### url
https://mongoosejs.com/docs/guide.html
## 2
### alias
Mongoose Queries
### url
https://mongoosejs.com/docs/queries.html

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit the GitHub repository link containing your challenge source code.
### score
20
### prompts
#### 0
##### title
Correct Schema and Model structure
##### score
10
##### promptText
Grading rubric (max 10 points):

- Criterion 1 (4 points): `PostSchema` defines all required fields with correct data types.
- Criterion 2 (3 points): `title` index exists and required constraints work as expected.
- Criterion 3 (3 points): Schema is correctly registered in module and timestamps are functional.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
Correct endpoint results
##### score
10
##### promptText
Grading rubric (max 10 points):

- Criterion 1 (4 points): `POST /posts` creates posts with flexible `tags` and `metadata`.
- Criterion 2 (3 points): `GET /posts` returns data sorted by `createdAt` descending.
- Criterion 3 (3 points): `PATCH /posts/:id` updates the document and changes `updatedAt`.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.

# difficulty
easy

# score
20
