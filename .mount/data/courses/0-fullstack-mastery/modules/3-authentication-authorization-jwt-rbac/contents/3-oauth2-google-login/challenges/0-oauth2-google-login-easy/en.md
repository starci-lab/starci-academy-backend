# title
Google Login with OAuth2

# description
Integrate Google login into a NestJS system using OAuth2, automatically creating accounts when users sign in for the first time and issuing internal JWT tokens.

# requirements
Configure Google OAuth2 on Google Cloud Console to obtain `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Create a `GoogleStrategy` using `passport-google-oauth20`. `GET /auth/google` redirects to the Google login page. `GET /auth/google/callback` receives the result from Google, checks the email in the database: if the email does not exist, creates a new user with information from the Google profile (email, firstName, picture) - this is the **silent registration** mechanism; if the email already exists, uses the existing user. Then issues an internal `access_token` JWT and returns it to the client.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- Google Cloud Console account

# steps

## 0
### title
Configure Google Cloud Console and set up the project
### body
- **Steps to follow:**
  - Step 1: Create a new project using the CLI:
    ```bash
    nest new oauth2-google-login-easy
    ```
  - Step 2: Navigate to the project directory and install dependencies:
    ```bash
    cd oauth2-google-login-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-google-oauth20 @nestjs/config
    npm install -D @types/passport-google-oauth20
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
          POSTGRES_DB: oauth2_db
    ```
  - Step 4: Start PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Step 5: Go to Google Cloud Console (https://console.cloud.google.com), create a new project or select an existing one.
  - Step 6: Navigate to **APIs & Services > Credentials**, create an **OAuth 2.0 Client ID** of type Web application. Add `http://localhost:3000/auth/google/callback` to **Authorized redirect URIs**.
  - Step 7: Create a `.env` file at the project root with the following variables:
    ```
    GOOGLE_CLIENT_ID=your-client-id
    GOOGLE_CLIENT_SECRET=your-client-secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
    JWT_SECRET=your-jwt-secret
    ```
  - Step 8: Import `ConfigModule.forRoot()` into `AppModule` to read environment variables. Configure `TypeOrmModule.forRoot()` with PostgreSQL connection details, enable `synchronize: true`.
- **Expected result:** Google OAuth2 credentials are created, environment variables are configured, PostgreSQL is running, and the application is ready.
- **Conclusion:** The OAuth2 environment and database are ready for implementing Google login.

## 1
### title
Create User entity and GoogleStrategy
### body
- **Steps to follow:**
  - Step 1: Create a `User` entity with the following fields: `id` (PrimaryGeneratedColumn), `email` (unique), `firstName` (string, nullable), `picture` (string, nullable), `password` (string, nullable - because OAuth users do not have a password).
  - Step 2: Create a `google.strategy.ts` file defining `GoogleStrategy` extending `PassportStrategy(Strategy, 'google')` from `passport-google-oauth20`.
  - Step 3: In the constructor, configure:
    ```typescript
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
    ```
  - Step 4: Implement the `validate(accessToken, refreshToken, profile, done)` method:
    - Extract information from `profile`: `email` from `profile.emails[0].value`, `firstName` from `profile.name.givenName`, `picture` from `profile.photos[0].value`.
    - Return the object `{ email, firstName, picture }` via `done(null, user)`.
  - Step 5: Register `GoogleStrategy` in the `providers` array of `AuthModule`.
- **Expected result:** `GoogleStrategy` reads information from the Google profile and passes it to Passport for processing.
- **Conclusion:** The strategy is ready to receive data from Google. The next step handles user creation logic and JWT issuance.

## 2
### title
Implement controller endpoints and silent registration
### body
- **Steps to follow:**
  - Step 1: Create `GoogleAuthGuard` extending `AuthGuard('google')`.
  - Step 2: In `AuthController`, create the redirect endpoint:
    ```typescript
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    googleAuth() {}
    ```
    This endpoint automatically redirects to the Google login page.
  - Step 3: Create the callback endpoint:
    ```typescript
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    googleAuthCallback(@Req() req) {
      return this.authService.googleLogin(req.user);
    }
    ```
  - Step 4: In `AuthService`, implement the `googleLogin(googleUser)` method:
    - Find the user by email in the database.
    - If not found: create a new user with `email`, `firstName`, `picture` from the Google profile (silent registration).
    - If found: use the existing user.
    - Create a JWT with payload `{ sub: user.id, email: user.email }` and return `{ access_token }`.
  - Step 5: Ensure `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '15m' } })` is imported into `AuthModule`.
- **Expected result:** A user signing in with Google for the first time gets an account automatically created. Subsequent sign-ins use the existing account. Both cases return an `access_token` JWT.
- **Conclusion:** The silent registration mechanism ensures a seamless experience where users do not need to register manually before using Google login.

## 3
### title
Test the complete OAuth2 flow
### body
- **Steps to follow:**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Open a browser and navigate to:
    ```
    http://localhost:3000/auth/google
    ```
    Verify the browser redirects to the Google login page.
  - Step 3: Sign in with a Google account. After successful authentication, the browser is redirected to the callback URL.
  - Step 4: Verify the response returns `{ "access_token": "eyJ..." }`.
  - Step 5: Check the database: the User table should have a new record with email, firstName, and picture from the Google profile.
  - Step 6: Sign in again with the same Google account. Verify no new record is created in the database (the existing user is reused).
  - Step 7: Use the access token to access a protected route (if available) to confirm the JWT is valid:
    ```bash
    curl http://localhost:3000/some-protected-route \
      -H "Authorization: Bearer <access_token>"
    ```
- **Expected result:**
  - `GET /auth/google` -> redirects to Google login.
  - `GET /auth/google/callback` -> returns `{ access_token }` JWT.
  - First sign-in -> creates a new user in the database.
  - Second sign-in -> uses the existing user, no duplicate created.
  - The JWT access token is valid and can be used for protected routes.
- **Conclusion:** If all results are correct, the OAuth2 Google login flow with silent registration and internal JWT issuance works completely.

# references
## 0
### alias
OAuth2 Login NestJS
### url
https://dev.to/imichaelowolabi/how-to-implement-login-with-google-in-nestjs-2aoa

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
GoogleStrategy configured correctly
##### score
10
##### promptText
`GoogleStrategy` uses `passport-google-oauth20` with the correct `clientID`, `clientSecret`, `callbackURL`. `GET /auth/google` redirects to Google. `GET /auth/google/callback` receives the result and extracts email, firstName, picture from the Google profile.
#### 1
##### title
Silent registration and JWT issued
##### score
10
##### promptText
First-time users are automatically created in the database with information from Google. Subsequent sign-ins use the existing user. Both cases return a valid `access_token` JWT.

# difficulty
easy

# score
20
