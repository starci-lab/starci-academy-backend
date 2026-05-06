# title
User Authentication with JWT

# description
Build a complete JWT authentication flow for an employee management system. Users register, sign in to receive an access token, and access protected routes using JwtAuthGuard.

# requirements
Create a NestJS project with `AuthModule` and `EmployeeModule`. `POST /auth/signup` accepts `email` and `password`, hashes the password using **bcrypt**, and saves to PostgreSQL. `POST /auth/signin` validates credentials and returns `{ access_token }` (JWT signed with a secret, expires in 15 minutes). `GET /employees/profile` is protected by `JwtAuthGuard`: returns 401 Unauthorized if no token or token is expired, returns user info from JWT payload if the token is valid.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- NestJS CLI

# steps

## 0
### title
Initialize the project and configure PostgreSQL with Docker
### body
- **Steps to follow:**
  - Step 1: Create a new project using the CLI:
    ```bash
    nest new jwt-authentication-flow-easy
    ```
  - Step 2: Navigate to the project directory and install required dependencies:
    ```bash
    cd jwt-authentication-flow-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
    npm install -D @types/passport-jwt @types/bcrypt
    ```
  - Step 3: Create a `docker-compose.yml` file at the project root with PostgreSQL:
    ```yaml
    services:
      postgres:
        image: postgres:16
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: jwt_auth_db
    ```
  - Step 4: Start PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Step 5: Configure `TypeOrmModule.forRoot()` in `AppModule` with PostgreSQL connection details, enable `synchronize: true` to auto-create tables from entities.
- **Expected result:** PostgreSQL runs on port 5432, the NestJS application connects successfully and is ready to create tables from entities.
- **Conclusion:** The project environment and database are ready for implementing the authentication module.

## 1
### title
Create User entity and AuthModule with bcrypt and JWT
### body
- **Steps to follow:**
  - Step 1: Create a `User` entity with the following fields: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string).
  - Step 2: Create `AuthModule`, `AuthService`, `AuthController` using the CLI or manually.
  - Step 3: Import `TypeOrmModule.forFeature([User])` and `JwtModule.register({ secret: 'your-secret-key', signOptions: { expiresIn: '15m' } })` into `AuthModule`.
  - Step 4: In `AuthService`, implement the `signup(email, password)` method:
    - Check if the email already exists, throw `ConflictException` if so.
    - Hash the password using `bcrypt.hash(password, 10)`.
    - Save the new user to the database and return a success message.
  - Step 5: In `AuthService`, implement the `signin(email, password)` method:
    - Find the user by email, throw `UnauthorizedException` if not found.
    - Compare the password using `bcrypt.compare()`, throw `UnauthorizedException` if incorrect.
    - Create a JWT with payload `{ sub: user.id, email: user.email }` and return `{ access_token }`.
  - Step 6: In `AuthController`, create `POST /auth/signup` calling `this.authService.signup()` and `POST /auth/signin` calling `this.authService.signin()`.
- **Expected result:** `POST /auth/signup` creates a user with a hashed password in the database. `POST /auth/signin` returns a valid JWT access token.
- **Conclusion:** The registration and sign-in flow is complete with bcrypt hashing and JWT signing.

## 2
### title
Create JwtStrategy and JwtAuthGuard
### body
- **Steps to follow:**
  - Step 1: Create a `jwt.strategy.ts` file in the auth directory. The `JwtStrategy` class extends `PassportStrategy(Strategy)` from `passport-jwt`.
  - Step 2: Configure the strategy in the constructor:
    - `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()` to extract the token from the `Authorization: Bearer <token>` header.
    - `ignoreExpiration: false` to reject expired tokens.
    - `secretOrKey` matching the secret used when signing the JWT.
  - Step 3: Implement the `validate(payload)` method returning `{ userId: payload.sub, email: payload.email }`. This value will be attached to `request.user`.
  - Step 4: Create `JwtAuthGuard` extending `AuthGuard('jwt')`.
  - Step 5: Register `JwtStrategy` in the `providers` array of `AuthModule` and export `JwtAuthGuard` for other modules to use.
  - Step 6: Create `EmployeeModule` with `EmployeeController`. Create endpoint `GET /employees/profile` decorated with `@UseGuards(JwtAuthGuard)` that returns `request.user`.
- **Expected result:** Requests to `GET /employees/profile` without a token return 401. Requests with a valid token return the user info from the JWT payload.
- **Conclusion:** JwtStrategy and JwtAuthGuard successfully protect the route, only allowing requests with valid tokens to access it.

## 3
### title
Test the complete authentication flow
### body
- **Steps to follow:**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Register a new user:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
  - Step 3: Sign in to get the access token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
    Verify the response returns `{ "access_token": "eyJ..." }`.
  - Step 4: Access the protected route with the token:
    ```bash
    curl http://localhost:3000/employees/profile \
      -H "Authorization: Bearer <access_token>"
    ```
    Verify it returns the user information.
  - Step 5: Access the protected route without a token:
    ```bash
    curl http://localhost:3000/employees/profile
    ```
    Verify it returns 401 Unauthorized.
- **Expected result:**
  - `POST /auth/signup` -> user created successfully (201).
  - `POST /auth/signin` -> returns `{ access_token }` (200).
  - `GET /employees/profile` with token -> returns user info (200).
  - `GET /employees/profile` without token -> 401 Unauthorized.
- **Conclusion:** If all endpoints return the correct results, the complete JWT authentication flow works correctly.

# references
## 0
### alias
NestJS Authentication
### url
https://docs.nestjs.com/security/authentication

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
Auth flow correct
##### score
10
##### promptText
`POST /auth/signup` hashes the password with bcrypt and saves to PostgreSQL. `POST /auth/signin` validates credentials and returns a valid `{ access_token }` JWT with a 15-minute expiration.
#### 1
##### title
Guard protection works
##### score
10
##### promptText
`GET /employees/profile` is protected by `JwtAuthGuard`. No token returns 401 Unauthorized. A valid token returns user info from the JWT payload.

# difficulty
easy

# score
20
