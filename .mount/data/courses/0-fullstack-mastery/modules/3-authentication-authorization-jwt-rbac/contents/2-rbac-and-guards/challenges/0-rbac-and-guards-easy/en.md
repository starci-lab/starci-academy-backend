# title
Role-Based Access Control with RBAC

# description
Implement an RBAC (Role-Based Access Control) system with a custom @Roles() decorator and RolesGuard, clearly distinguishing Authentication and Authorization in a NestJS application.

# requirements
Create a Role enum with two values: `USER` and `ADMIN`. Add a `role` column to the User entity with a default value of `USER`. Create a `@Roles()` decorator using `SetMetadata` to attach role metadata to routes. Create a `RolesGuard` implementing `CanActivate`, using `Reflector` to read role metadata from the route and compare it with the user's role in the request. Endpoint `DELETE /users/:id` decorated with `@Roles('ADMIN')` combined with `@UseGuards(JwtAuthGuard, RolesGuard)`: a user with role `USER` receives 403 Forbidden, a user with role `ADMIN` succeeds.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- JwtAuthGuard already working

# steps

## 0
### title
Initialize the project and define Role enum
### body
- **Steps to follow:**
  - Step 1: Create a new project using the CLI:
    ```bash
    nest new rbac-and-guards-easy
    ```
  - Step 2: Navigate to the project directory and install dependencies:
    ```bash
    cd rbac-and-guards-easy
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
          POSTGRES_DB: rbac_db
    ```
  - Step 4: Start PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Step 5: Configure `TypeOrmModule.forRoot()` in `AppModule`, enable `synchronize: true`.
  - Step 6: Create the `Role` enum with two values:
    ```typescript
    export enum Role {
      USER = 'USER',
      ADMIN = 'ADMIN',
    }
    ```
  - Step 7: Create a `User` entity with the following fields: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string), `role` (enum Role, default `Role.USER`).
- **Expected result:** PostgreSQL runs on port 5432, the User table is created with a `role` column defaulting to `USER`.
- **Conclusion:** The database and entity structure are ready with the role system in place.

## 1
### title
Create @Roles() decorator and AuthModule
### body
- **Steps to follow:**
  - Step 1: Create `AuthModule`, `AuthService`, `AuthController` with signup and signin functionality similar to previous challenges (bcrypt password hashing, JWT signing).
  - Step 2: In the `signup` method, save the user with the default role `USER`. For testing purposes, create an additional endpoint or seed data to create a user with the `ADMIN` role.
  - Step 3: In the `signin` method, include the `role` field in the JWT payload: `{ sub: user.id, email: user.email, role: user.role }`.
  - Step 4: Create `JwtStrategy` and `JwtAuthGuard`. In the `validate(payload)` method, return `{ userId: payload.sub, email: payload.email, role: payload.role }` so the role is available in `request.user`.
  - Step 5: Create a `roles.decorator.ts` file defining the custom `@Roles()` decorator:
    ```typescript
    import { SetMetadata } from '@nestjs/common';
    export const ROLES_KEY = 'roles';
    export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
    ```
- **Expected result:** The `@Roles()` decorator can attach role metadata to any route. The JWT payload contains the user's role information.
- **Conclusion:** The role metadata mechanism is ready. The next step creates the Guard to read and enforce this metadata.

## 2
### title
Create RolesGuard using Reflector
### body
- **Steps to follow:**
  - Step 1: Create a `roles.guard.ts` file defining `RolesGuard` implementing `CanActivate`.
  - Step 2: Inject `Reflector` into the constructor of `RolesGuard`.
  - Step 3: In the `canActivate(context)` method:
    - Use `this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()])` to retrieve the required roles from metadata.
    - If no role metadata exists (route does not use `@Roles()`), return `true` (allow access).
    - Get `user` from `context.switchToHttp().getRequest().user`.
    - Check `requiredRoles.includes(user.role)`. If not matched, throw `ForbiddenException`.
  - Step 4: Create `UserModule` with `UserController`. Create endpoint `DELETE /users/:id` and decorate it:
    ```typescript
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    deleteUser(@Param('id') id: string) { ... }
    ```
  - Step 5: In `UserService`, implement the `deleteUser(id)` method to delete a user by id from the database.
- **Expected result:** `RolesGuard` reads metadata from the decorator and compares it with the user's role. The route only allows users with the appropriate role.
- **Conclusion:** RolesGuard combined with Reflector creates a flexible authorization mechanism, reusable for any route that needs protection.

## 3
### title
Test authorization with different roles
### body
- **Steps to follow:**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Register a regular user (role USER):
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "user@example.com", "password": "123456"}'
    ```
  - Step 3: Create or seed an admin user (role ADMIN). You can use a dedicated endpoint or directly update the database:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "123456"}'
    ```
    Then update the role in the database or use a seed endpoint.
  - Step 4: Sign in with the regular user and get the token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "user@example.com", "password": "123456"}'
    ```
  - Step 5: Call `DELETE /users/1` with the regular user's token:
    ```bash
    curl -X DELETE http://localhost:3000/users/1 \
      -H "Authorization: Bearer <user_token>"
    ```
    Verify it returns 403 Forbidden.
  - Step 6: Sign in with the admin and get the token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "123456"}'
    ```
  - Step 7: Call `DELETE /users/1` with the admin's token:
    ```bash
    curl -X DELETE http://localhost:3000/users/1 \
      -H "Authorization: Bearer <admin_token>"
    ```
    Verify the operation succeeds.
- **Expected result:**
  - `DELETE /users/:id` with user token (role USER) -> 403 Forbidden.
  - `DELETE /users/:id` with admin token (role ADMIN) -> success (200).
  - `DELETE /users/:id` without token -> 401 Unauthorized (blocked by JwtAuthGuard first).
- **Conclusion:** If the results are correct, the RBAC system clearly distinguishes Authentication (who is accessing) and Authorization (do they have permission) through two Guard layers.

# references
## 0
### alias
NestJS Authorization
### url
https://docs.nestjs.com/security/authorization

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
RBAC structure correct
##### score
10
##### promptText
Role enum (USER, ADMIN) exists, `role` column in User entity defaults to USER, `@Roles()` decorator uses `SetMetadata`, and `RolesGuard` uses `Reflector` to read role metadata.
#### 1
##### title
Guard enforcement works
##### score
10
##### promptText
`DELETE /users/:id` with `@Roles('ADMIN')` and `@UseGuards(JwtAuthGuard, RolesGuard)`: user with role USER gets 403 Forbidden, user with role ADMIN succeeds, no token returns 401.

# difficulty
easy

# score
20
