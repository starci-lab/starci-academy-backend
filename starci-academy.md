# StarCi Academy Backend: Documentation

This document provides a comprehensive overview of the `starci-academy-backend` project, combining high-level business logic with a granular file-level breakdown.

---

## Part 1: Business Logic Overview

### 1. System Architecture
- **`src/features`**: Contains domain-specific entry points (API, GraphQL, background workers).
- **`src/modules`**: Contains reusable technical components and cross-cutting concerns (DB, Auth, AI, Search, Storage).

#### Technology Stack

- **Database**: PostgreSQL (TypeORM) for relational data.
- **Background Jobs**: BullMQ for reliable, multi-step job processing.
- **Authentication**: Keycloak for identity and access management.
- **AI/LLM**: LangChain for intelligent features.
- **Payments**: PayOS for transaction processing.
- **Logs**: Winston for structured logging.

---

### 2. Core Domain Entities
- **Course**: The top-level learning unit, containing metadata, pricing phases, and requirements.
- **Module**: A structural division within a course.
- **Content**: Individual learning items (text, files, etc.) within a module.
- **Lesson Video**: High-quality video content integrated with a CDN synchronizer.
- **Challenge**: Hands-on tasks requiring code submissions (often via Git).
- **Enrollment**: The relationship linking a User to a Course, tracked with pricing phase info.
- **Transaction**: Records of payments made via PayOS for course access.

---

### 3. Key Business Processes

#### 3.1 Course Enrollment & Access Control

Managed by the `EnrollWorker`, this process ensures users gain access to content after payment:

1.  **Validation**: Verifies the course and user exist.
2.  **Creation**: Generates an `EnrollmentEntity`.
3.  **Pricing Dynamics**: If a pricing phase (e.g., "Early Bird") reaches its slot limit, the course is automatically bumped to the next phase (e.g., "Regular").
4.  **Completion**: Updates the `TransactionStatus` to `Succeeded` and finalizes the BullMQ job.

#### 3.2 AI-Assisted Challenge Grading

The `ProcessGitSubmissionWorker` implements a sophisticated RAG (Retrieval-Augmented Generation) pipeline to grade learner code:

1.  **Load Docs**: Pulls files from the submitted GitHub repository.
2.  **Split & Vectorize**: Chunks the code and stores embeddings in a vector store for focused retrieval.
3.  **Grading (LLM)**:
    - Uses **LangChain** to invoke models (configured via `ModelProvider`).
    - Applies a custom rubric fetched from the database (`ChallengePromptEntity`).
    - Produces a score (1-20) and 2-5 specific, actionable feedback items.
4.  **Finalization**: Updates the `UserChallengeSubmission` with the score and AI feedback.

#### 3.3 CDN Synchronization

The `cdn-synchronizer` feature ensures that media assets are consistently distributed and available globally.

#### 3.4 Payment Processing

Integration with **PayOS** handles checkout sessions and webhook confirmations, linking successful payments to enrollment jobs.

---

## Part 2: File-Level Breakdown

### 1. Application Entry Points (`apps/core`)

- **[main.ts](file:///c:/WORK/PROJECT/starci-academy-backend/apps/core/src/main.ts)**: The bootstrapping file for the NestJS application.
- **[app.module.ts](file:///c:/WORK/PROJECT/starci-academy-backend/apps/core/src/app.module.ts)**: The root module that imports all feature and infrastructure modules.

### 2. Feature Layer (`src/features`)

Divided into API (HTTP/GraphQL) and Background Workers.

#### 2.1 API (`src/features/api`)

- **`http/`**: Handles RESTful endpoints.
  - **[http.ts](file:///c:/WORK/PROJECT/starci-academy-backend/src/features/api/http/http.ts)**: Defines routing for PayOS webhooks and Keycloak callbacks.
- **`graphql/`**: Handles GraphQL queries (fetching data) and mutations (actions like enroll/submit).

#### 2.2 Workers (`src/features/worker`)

- **`processors/enroll/`**:
  - **[enroll.worker.ts](file:///c:/WORK/PROJECT/starci-academy-backend/src/features/worker/processors/enroll/enroll.worker.ts)**: Main worker for enrollment tasks.
  - **`steps/enroll-step.service.ts`**: Implements database logic for creating enrollments.
- **`processors/process-git-submission/`**:
  - **[process-git-submission.worker.ts](file:///c:/WORK/PROJECT/starci-academy-backend/src/features/worker/processors/process-git-submission/process-git-submission.worker.ts)**: Orchestrates the multi-step grading pipeline.
  - **`steps/`**: Contains RAG pipeline logic (Load, Split, Vectorize, Grade).

### 3. Database Layer (`src/modules/databases`)

Infrastructure for data persistence using PostgreSQL and TypeORM.

- **`postgresql/primary/entities/`**:
  - **[course.entity.ts](file:///c:/WORK/PROJECT/starci-academy-backend/src/modules/databases/postgresql/primary/entities/course.entity.ts)**: Core Course table definition.
  - **[job.entity.ts](file:///c:/WORK/PROJECT/starci-academy-backend/src/modules/databases/postgresql/primary/entities/job.entity.ts)**: Progress tracking for background workers.
  - **`*-translation.entity.ts`**: Localization entities for multilingual support.

### 4. Business Logic Layer (`src/modules/bussiness`)

Core services encapsulating domain rules.

- **`jobs/atomic/job-action.service.ts`**: Methods for managing background job state.
- **`transactions/atomic/transaction-action.service.ts`**: Operations for updating payment statuses.

### 5. Shared Infrastructure Modules (`src/modules`)

- **`langchain/model.service.ts`**: Unified interface for AI model interactions.
- **`bullmq/bullmq.module.ts`**: Redis/Queue configuration.
- **`payos/payos.providers.ts`**: PayOS SDK integration.
- **`winston/winston.service.ts`**: Structured logging for observability.
