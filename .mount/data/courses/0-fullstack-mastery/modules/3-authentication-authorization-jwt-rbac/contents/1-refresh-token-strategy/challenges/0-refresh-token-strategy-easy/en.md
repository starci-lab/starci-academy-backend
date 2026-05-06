# title
Refresh Token Strategy with Rotation

# description
Extend the authentication system with Refresh Token lifecycle, implementing Rotation and Revocation mechanisms to secure user sessions.

# requirements
`POST /auth/signin` returns both `access_token` (15 minutes) and `refresh_token` (7 days). The hash of the refresh token is stored in the `hashedRefreshToken` column of the User table. `POST /auth/refresh` verifies the refresh token, compares it with the hash in the database, and issues a new token pair (Rotation). `POST /auth/logout` sets `hashedRefreshToken = null` (Revocation). Reusing an old refresh token after rotation must return 401 Unauthorized.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- Understanding of JWT authentication flow

# steps

## 0
### title
Initialize the project and add hashedRefreshToken column
### body
- **Steps to follow:**
  - Step 1: Create a new project using the CLI:
    ```bash
    nest new refresh-token-strategy-easy
    ```
  - Step 2: Navigate to the project directory and install dependencies:
    ```bash
    cd refresh-token-strategy-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
    npm install -D @types/passport-jwt @types/bcrypt
    ```
  - Step 3: Create a `docker-compose.yml` file with PostgreSQL:
    ```yaml
    services:
      postgres:
        image: postgres:16
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: refresh_token_db
    ```
  - Step 4: Start PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Step 5: Configure `TypeOrmModule.forRoot()` in `AppModule` with connection details, enable `synchronize: true`.
  - Step 6: Create a `User` entity with the following fields: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string), `hashedRefreshToken` (string, nullable). The `hashedRefreshToken` column stores the hash of the current refresh token.
- **Expected result:** PostgreSQL runs on port 5432, the User table is auto-created with a nullable `hashedRefreshToken` column.
- **Conclusion:** The database is ready with a structure supporting hashed refresh token storage.

## 1
### title
Implement sign-in with dual token issuance
### body
- **Steps to follow:**
  - Step 1: Create `AuthModule`, `AuthService`, `AuthController`. Import `JwtModule` and `TypeOrmModule.forFeature([User])`.
  - Step 2: In `AuthService`, implement the `signup(email, password)` method: hash the password with bcrypt and save the new user.
  - Step 3: Implement the `signin(email, password)` method:
    - Validate credentials (find user, compare password with bcrypt).
    - Create an `access_token` with payload `{ sub: user.id, email: user.email }`, expiring in 15 minutes.
    - Create a `refresh_token` with payload `{ sub: user.id }`, expiring in 7 days.
    - Hash the refresh token using `bcrypt.hash()` and save it to the user's `hashedRefreshToken` column.
    - Return `{ access_token, refresh_token }`.
  - Step 4: In `AuthController`, create endpoints `POST /auth/signup` and `POST /auth/signin`.
- **Expected result:** `POST /auth/signin` returns both tokens, and the refresh token is hashed and stored in the database.
- **Conclusion:** The system issues dual tokens, with the refresh token secured by hashing before storage.

## 2
### title
Implement refresh with Rotation mechanism
### body
- **Steps to follow:**
  - Step 1: Create `JwtStrategy` (for access tokens) and `JwtAuthGuard` similar to the previous challenge.
  - Step 2: Create `RefreshTokenStrategy` extending `PassportStrategy(Strategy, 'jwt-refresh')`:
    - Extract the token from the `Authorization: Bearer <token>` header.
    - In the `validate(req, payload)` method, extract the refresh token from the request and return `{ userId: payload.sub, refreshToken }`.
  - Step 3: Create `RefreshTokenGuard` extending `AuthGuard('jwt-refresh')`.
  - Step 4: In `AuthService`, implement the `refreshTokens(userId, refreshToken)` method:
    - Find the user by id, check that `hashedRefreshToken` exists (throw `UnauthorizedException` if null).
    - Compare the refresh token with `hashedRefreshToken` using `bcrypt.compare()`. Throw `UnauthorizedException` if it does not match.
    - Generate a new token pair (access + refresh).
    - Hash the new refresh token and update `hashedRefreshToken` in the database (Rotation).
    - Return the new `{ access_token, refresh_token }`.
  - Step 5: In `AuthController`, create endpoint `POST /auth/refresh` using `@UseGuards(RefreshTokenGuard)`, calling `this.authService.refreshTokens()`.
- **Expected result:** `POST /auth/refresh` with a valid refresh token returns a new token pair. The old refresh token is invalidated after rotation.
- **Conclusion:** The Rotation mechanism ensures each refresh token can only be used once, reducing the risk of replay attacks.

## 3
### title
Implement logout and test the complete flow
### body
- **Steps to follow:**
  - Step 1: In `AuthService`, implement the `logout(userId)` method: set `hashedRefreshToken = null` in the database.
  - Step 2: In `AuthController`, create endpoint `POST /auth/logout` using `@UseGuards(JwtAuthGuard)`, calling `this.authService.logout()`.
  - Step 3: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 4: Register and sign in:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'

    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
    Save the `access_token` and `refresh_token` from the response.
  - Step 5: Call refresh to get a new token pair:
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <refresh_token>"
    ```
    Verify it returns a new token pair.
  - Step 6: Reuse the old refresh token (already rotated):
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <old_refresh_token>"
    ```
    Verify it returns 401 Unauthorized.
  - Step 7: Call logout:
    ```bash
    curl -X POST http://localhost:3000/auth/logout \
      -H "Authorization: Bearer <access_token>"
    ```
  - Step 8: After logout, call refresh with the latest token:
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <new_refresh_token>"
    ```
    Verify it returns 401 Unauthorized because `hashedRefreshToken` has been cleared.
- **Expected result:**
  - `POST /auth/signin` -> returns `{ access_token, refresh_token }`.
  - `POST /auth/refresh` with valid token -> returns new token pair.
  - `POST /auth/refresh` with old token -> 401 Unauthorized.
  - `POST /auth/logout` -> success.
  - `POST /auth/refresh` after logout -> 401 Unauthorized.
- **Conclusion:** If all results are correct, the Rotation and Revocation mechanisms work properly, protecting the system from old token reuse attacks.

# references
## 0
### alias
Token Revocation Best Practices
### url
https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/

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
Rotation works
##### score
10
##### promptText
`POST /auth/refresh` verifies the refresh token, issues a new token pair, hashes the new refresh token, and saves it to the database. The old refresh token can no longer be used after rotation.
#### 1
##### title
Revocation works
##### score
10
##### promptText
`POST /auth/logout` sets `hashedRefreshToken = null`. After logout, all refresh requests return 401 Unauthorized.

# difficulty
easy

# score
20
