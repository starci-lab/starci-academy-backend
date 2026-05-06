# title
OTP Security Flow with Redis (Rate Limiting & Retry Limit)

# description
Context: The OTP registration confirmation system is under bot attack, leading to high SMS costs and code guessing via brute force. Input: OTP send and verify requests from clients. Task: Build a request frequency limiter and a failed attempt limiter mechanism using Redis.

# requirements
## 0
### purpose
Build an OTP sending API with frequency control (Rate Limiting).
### technicalConstraints
- Endpoint `POST /otp/send` accepting `{ "phone": "string" }`.
- Generate a 6-digit OTP code using the secure `crypto.randomInt` function.
- Save the OTP in Redis with a 5-minute TTL. Key format: `otp:{phone}`.
- Control the number of requests using Redis (e.g., max 3 times/minute). Exceeding this returns a `429 Too Many Requests` error. Key format: `retry:{phone}`.
### proTipsHints
Use `ioredis` to connect to Redis. Remember to set the TTL for the `retry:{phone}` key when it is initialized so the counter auto-resets after 1 minute.

## 1
### purpose
Build an OTP verification API with Brute-force protection.
### technicalConstraints
- Endpoint `POST /otp/verify` accepting `{ "phone": "string", "code": "string" }`.
- Compare the `code` with the value in `otp:{phone}`.
- If incorrect: increment the counter in `fails:{phone}` (TTL 15 minutes). After 5 failed attempts, block verification for this phone number for 15 minutes (return `403 Forbidden`).
- If correct: delete the OTP and return a success response.
### proTipsHints
Use the Redis `INCR` command to safely increment the counter in a multi-threaded environment.

### forbidden
- Do not use global in-memory variables to store OTPs; using Redis is mandatory.
- Do not ignore the failed attempts limit, as 6-digit codes are extremely vulnerable to brute-force attacks.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI
## 2
### text
Docker (to run Redis)

# steps
## 0
### title
Initialize the project and configure the Redis connection
### body
### 1. Implementation Steps
- Initialize a new NestJS project: `nest new otp-verification-easy`
- Install dependencies: `npm install ioredis`
- Create a `docker-compose.yml` file to run Redis on port 6379. Start it using `docker compose up -d`.
- Create an `OtpModule` and configure the `ioredis` Provider to connect to `localhost:6379`.
### 2. Minimum Requirements
- The project starts successfully, printing a log indicating a successful connection to Redis.
### 3. Nice to have
- Create a dedicated Redis Module that exports the `REDIS_CLIENT` provider for easier use across modules.

## 1
### title
Implement the Send OTP Flow
### body
### 1. Implementation Steps
- In `OtpService`, create the `sendOtp(phone: string)` function.
- Read the value of `retry:{phone}`. If >= 3, throw an `HttpException` (429).
- Use `crypto.randomInt(100000, 999999)` to generate a 6-digit OTP. Save it to `otp:{phone}` with a 300s TTL.
- Increment the `retry:{phone}` counter using `INCR` and set a 60s TTL if it's the first time the counter is created.
- Create the `POST /otp/send` endpoint to call this function, return a message, and log the OTP to the terminal (for testing).
### 2. Minimum Requirements
- Calling the API successfully 3 times, with the 4th call (within 1 minute) returning a 429 error.
### 3. Nice to have
- Use Redis Multi (Transaction) to ensure `INCR` and `EXPIRE` are executed atomically.

## 2
### title
Implement the Verify OTP Flow
### body
### 1. Implementation Steps
- Create the `verifyOtp(phone: string, code: string)` function.
- Read the `fails:{phone}` value. If >= 5, throw an `HttpException` (403 Forbidden).
- Read the `otp:{phone}` value. If missing or mismatched with `code`, use `INCR` to increment `fails:{phone}` by 1 (set TTL 900s) and throw a 400 Bad Request error.
- If the code matches, delete both `otp:{phone}` and `fails:{phone}` using `DEL`. Return a 200 OK success response.
### 2. Minimum Requirements
- Entering the wrong code 5 times consecutively results in an HTTP 403.
- Entering the correct code before 5 attempts results in an HTTP 200, and the OTP is subsequently unusable.
### 3. Nice to have
- Log a warning to the system console when a user intentionally inputs the wrong OTP code multiple times.

# outputs
## 0
### text
Design and implement a basic Rate Limiting mechanism using Redis.
## 1
### text
Understand and build a Brute-force protection flow that limits failed attempts.
## 2
### text
Proficiently use fundamental Redis In-memory operations (`GET`, `SET`, `INCR`, `EXPIRE`, `DEL`).

# references
## 0
### alias
NestJS Security Rate Limiting
### url
https://docs.nestjs.com/security/rate-limiting
## 1
### alias
ioredis Documentation
### url
https://github.com/redis/ioredis

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
A repository containing the source code for the NestJS application solving the OTP Rate Limit problem, Redis configuration, and a README.md file attaching terminal logs proving the results.
### score
20
### prompts
#### 0
##### title
Send Flow (Rate Limit) works correctly
##### score
10
##### promptText
Grading according to the Rubric (max 10 points):
- Criteria 1 (5 points): Generates a proper random 6-digit code and saves it to Redis.
- Criteria 2 (5 points): Blocks the 4th request onwards (within the same minute) and returns a `429 Too Many Requests` error.
Grading rule: Points are awarded per criteria met.
#### 1
##### title
Verification Flow (Brute-force Challenge) works correctly
##### score
10
##### promptText
Grading according to the Rubric (max 10 points):
- Criteria 1 (5 points): Accurately counts and limits failed attempts. Returns a `403 Forbidden` error on the 5th failed attempt onwards.
- Criteria 2 (5 points): Verifying the correct code returns success and deletes the OTP so it cannot be reused.
Grading rule: Points are awarded per criteria met.

# difficulty
easy

# score
20
