# Engineering Decisions

This document records the meaningful engineering decisions made while building DocFlow. It is intentionally not a changelog. Each decision captures the approach chosen, alternatives considered, reasoning, tradeoffs, and functionality deliberately left out of the current scope.

---

## 1. Client-Side Table Rendering

### Decision

Use **client-side rendering and pagination** for the document tables.

The frontend loads the available documents and resumes and uses AG Grid for rendering, sorting, filtering, selection, and pagination.

Pagination is currently configured on the client with a default page size of 10 and options for 20 and 50 rows.

### Alternatives Considered

* Server-side pagination
* Server-side sorting and filtering
* AG Grid Server-Side Row Model
* Backend APIs such as:

  * `GET /documents?page=1&limit=10`
  * `GET /documents?sort=createdAt`
  * `GET /documents?search=ankita`

### Reasoning

The assignment currently works with a relatively small dataset. Introducing server-side table infrastructure would add backend APIs, query handling, pagination state, sorting/filtering contracts, and additional frontend complexity without providing meaningful benefits for the expected dataset size.

AG Grid already provides a good client-side experience for this scale.

The decision keeps the implementation simpler and allows more effort to be spent on the core document-processing workflow.

### Tradeoffs Accepted

* The browser receives more records than it currently displays.
* Large datasets will eventually increase network and memory usage.
* Filtering and sorting happen against the client-side dataset rather than the complete database.

### What We Deliberately Cut

Server-side pagination, filtering, sorting, and querying were intentionally left out.

For a production system with a large number of documents, the table should move to a server-side/data-driven model where the backend/database handles pagination, filtering, sorting, and search.

This is a conscious scope decision for the assignment rather than a limitation of the architecture.

---

## 2. PDF Text Extraction in the Frontend

### Decision

Use **PDF.js in the frontend** to extract text from uploaded PDF documents.

The frontend reads the PDF, extracts text page-by-page, and sends the resulting text to the backend when semantic processing is required.

### Alternatives Considered

* Extracting PDF text entirely on the backend
* Using a dedicated document-processing service
* Sending the raw PDF directly to an AI model
* Using a third-party PDF extraction API

### Reasoning

The assignment is primarily a frontend engineering exercise, so keeping basic PDF parsing in the browser demonstrates the ability to work with browser-side document processing.

PDF.js also provides direct access to page text without requiring an additional backend document-processing service.

This keeps the architecture relatively simple:

```text
PDF
 ↓
Browser
 ↓
PDF.js
 ↓
Extracted text
 ↓
Backend
 ↓
AI semantic analysis
```

### Tradeoffs Accepted

* PDF text extraction quality depends on the PDF's internal text structure.
* Scanned/image-only PDFs cannot reliably be handled by simple text extraction.
* Complex PDF layouts can result in imperfect text ordering.

### What We Deliberately Cut

OCR was not added.

Supporting scanned PDFs properly would require an OCR pipeline, which would introduce additional processing, cost, and infrastructure that was outside the scope of the assignment.

---

## 3. Deterministic Extraction vs AI Extraction

### Decision

Use a **hybrid extraction strategy**.

Basic, predictable fields are extracted deterministically where practical, while semantic analysis is delegated to Gemini.

Examples of deterministic fields include:

* Name
* Email
* Phone
* Skills when they can be identified reliably
* Employment duration calculation

Gemini is used for:

* Resume-to-JD matching
* Matched skills
* Missing skills
* Strengths
* Gaps
* Employment record extraction

### Alternatives Considered

* Use regular expressions for everything
* Use Gemini for the complete document
* Use a dedicated resume parsing service
* Build a complete custom NLP parser

### Reasoning

Not every extraction problem requires AI.

For example, calculating total employment duration from known employment dates is deterministic and should not depend on an LLM.

On the other hand, determining whether a candidate's experience semantically matches a job description requires understanding context, synonyms, responsibilities, and technical relevance.

Using each approach where it is strongest makes the system more predictable.

### Tradeoffs Accepted

The extraction pipeline is more complex than using a single AI call.

There are also multiple representations of extracted data that need to remain consistent between the frontend, backend, database, and AI response.

### What We Deliberately Cut

A custom NLP pipeline and external resume-parsing service were not introduced.

For the current assignment, they would add significant implementation complexity without enough benefit.

---

## 4. Gemini for Semantic Resume Matching

### Decision

Use **Google Gemini** for semantic resume-to-job-description matching.

The model receives the resume text and the fixed Zamp job description and returns structured matching information.

The response includes:

* Match score
* Matched skills
* Missing skills
* Strengths
* Gaps
* Work experience records

### Alternatives Considered

* Keyword matching
* TF-IDF/cosine similarity
* Embeddings
* A vector database
* A dedicated resume-matching API
* Manual rule-based scoring

### Reasoning

Simple keyword matching would produce misleading results for resumes and job descriptions.

For example, a candidate may describe a concept differently from the wording used in the job description while still having the relevant experience.

Gemini provides semantic understanding while allowing the result to be returned in a structured format.

The fixed job description also makes the matching workflow deterministic from the application's perspective: every uploaded resume is evaluated against the same JD.

### Tradeoffs Accepted

* AI responses are probabilistic.
* AI processing adds latency.
* API usage introduces an external dependency.
* AI output must be validated before being trusted by the application.


---

## 5. Do Not Let Gemini Calculate Total Experience

### Decision

Gemini extracts employment records, but **JavaScript calculates total professional experience**.

Gemini returns records such as:

```text
Impact Analytics
May 2022 – Present

Conzumex
Jun 2021 – May 2022
```

The application then parses the dates, merges overlapping periods, and calculates total months.

### Alternatives Considered

* Ask Gemini to return total experience directly
* Calculate experience from the resume summary
* Calculate experience from project dates
* Calculate experience using employment records in the frontend

### Reasoning

LLMs are not the right source of truth for arithmetic based on structured dates.

An earlier implementation allowed Gemini to calculate experience and produced an incorrect result.

The more reliable approach is:

```text
Gemini
  ↓
Employment records
  ↓
JavaScript date parsing
  ↓
Merge overlapping periods
  ↓
Total months
  ↓
Years + months
```

This also makes the calculation reproducible.

### Tradeoffs Accepted

The application needs to handle different date formats returned by the model.

Date parsing therefore has to support formats such as:

* `June 2021`
* `Jun 2021`
* `06/2021`
* `06-2021`
* `2021`
* `Present`
* `Current`
* `Now`

### What We Deliberately Cut

We did not attempt to infer missing employment dates.

If the resume does not contain a reliable date, the application does not invent one.

This avoids presenting an AI-generated estimate as factual employment history.

---

## 6. Prevent Double Counting Employment Periods

### Decision

Merge overlapping employment ranges before calculating total experience.

For example:

```text
Jan 2022 – Present
Jun 2022 – Dec 2022
```

is counted as one continuous period rather than two.

### Alternatives Considered

* Simply sum the duration of every job
* Trust Gemini's total
* Ignore overlapping employment

### Reasoning

Candidates can have overlapping jobs, consulting engagements, or employment records.

Simply adding durations can therefore produce an inflated experience value.

The application sorts employment ranges chronologically and merges overlapping periods before calculating the total.

### Tradeoffs Accepted

The calculation represents total calendar employment duration rather than attempting to determine whether overlapping jobs were full-time, part-time, or concurrent.

### What We Deliberately Cut

No attempt is made to determine the employment type or percentage allocation of overlapping jobs.

That level of interpretation is outside the scope of the assignment.

---

## 7. Fixed Job Description Instead of JD Upload

### Decision

Use a **fixed Zamp job description** stored in:

```text
server/data/zamp-jd.txt
```

The backend reads this file when performing resume matching.

### Alternatives Considered

* Allow users to upload a JD
* Store JDs in MongoDB
* Pass the JD from the frontend
* Create a JD management interface

### Reasoning

The assignment requires demonstrating resume-to-job matching rather than building a complete recruitment platform.

Keeping the JD on the backend provides a single source of truth and prevents the frontend from controlling the matching criteria.

It also removes unnecessary UI and persistence work.

### Tradeoffs Accepted

The application currently supports one configured JD rather than arbitrary job descriptions.

Changing the JD requires changing the server-side configuration/file.

### What We Deliberately Cut

JD upload, JD CRUD, JD versioning, and a JD management UI were deliberately excluded.

These would be natural extensions in a production recruitment platform.

---

## 8. Structured Gemini Responses

### Decision

Use Gemini's structured JSON response capability with an explicit response schema.

The expected response contains fields such as:

```text
score
matchedSkills
missingSkills
strengths
gaps
workExperience
```

### Alternatives Considered

* Parse free-form model text
* Use Markdown responses
* Extract JSON manually from model output

### Reasoning

The application needs predictable data rather than conversational output.

A structured response reduces the amount of fragile string parsing required and makes the boundary between AI output and application logic clearer.

### Tradeoffs Accepted

The schema still does not guarantee that every semantic value is correct.

Application-level validation remains necessary.

### What We Deliberately Cut

No attempt was made to build a generalized AI output-repair system.

The current schema and validation are sufficient for the controlled assignment workflow.

---

## 9. MongoDB for Document Persistence

### Decision

Use **MongoDB** as the primary application database.

MongoDB stores document metadata, extracted fields, matching information, statuses, and Cloudinary references.

### Alternatives Considered

* PostgreSQL
* MySQL
* Firebase
* In-memory storage
* A document database plus a separate search database

### Reasoning

The extracted document structure is naturally document-oriented and can evolve as different document types introduce different fields.

MongoDB also keeps the backend implementation relatively lightweight for the assignment.

The current query requirements do not justify introducing a second database.

### Tradeoffs Accepted

MongoDB provides less relational structure than a SQL database.

If the system later introduces highly relational entities such as organizations, teams, permissions, workflows, audit records, and complex reporting, the data model may need to be reconsidered.

### What We Deliberately Cut

No separate search engine or vector database was added.

The current document volume and query requirements do not justify the operational complexity.

---

## 10. Cloudinary for Uploaded Files

### Decision

Store uploaded documents in **Cloudinary** and store the resulting URL and public ID in MongoDB.

The backend uses Multer's memory storage and streams the uploaded buffer to Cloudinary.

### Alternatives Considered

* Store files on the backend filesystem
* Store PDFs directly in MongoDB
* Amazon S3
* Cloudinary

### Reasoning

A local filesystem is unsuitable for serverless deployment because the deployment filesystem should not be treated as durable application storage.

Cloudinary provides persistent file storage and delivery while keeping the application server stateless.

The application therefore stores:

```text
MongoDB
  ├── metadata
  ├── extracted data
  └── cloudinaryPublicId

Cloudinary
  └── actual PDF
```

### Tradeoffs Accepted

The application now depends on an external storage provider.

There is also an additional network operation during upload.

### What We Deliberately Cut

A full S3-compatible storage abstraction was not introduced.

Cloudinary was sufficient for the assignment and reduced infrastructure/setup overhead.

---

## 11. Multer Memory Storage for Serverless Compatibility

### Decision

Use Multer's `memoryStorage()` rather than writing uploaded files to disk.

```js
const storage = multer.memoryStorage();
```

The resulting `req.file.buffer` is uploaded directly to Cloudinary.

### Alternatives Considered

* Multer disk storage
* Temporary filesystem storage
* Direct browser-to-Cloudinary upload

### Reasoning

The backend is deployed as a Vercel serverless function.

Writing to paths such as:

```text
/server/uploads
```

is not a reliable persistence strategy in this environment.

Memory storage allows the file to move directly from the request into Cloudinary without depending on a persistent server filesystem.

### Tradeoffs Accepted

The uploaded file exists in server memory during processing.

To control this, the upload size is limited.

### What We Deliberately Cut

Direct browser-to-Cloudinary uploads were not implemented.

That would reduce backend bandwidth usage but would require additional signed-upload configuration and frontend upload orchestration.

---

## 12. Vercel for Frontend and Backend Deployment

### Decision

Deploy the frontend and backend as separate Vercel projects.

The architecture is:

```text
Frontend
Vercel
   ↓
Backend API
Vercel
   ↓
MongoDB
   +
Cloudinary
   +
Gemini
```

### Alternatives Considered

* Deploy frontend and backend together
* Deploy backend on Render
* Deploy backend on Railway
* Deploy both using a traditional VM

### Reasoning

The application is already split into frontend and backend responsibilities.

Separate deployments make the architecture explicit and allow the frontend and API to be deployed independently.

Vercel also fits naturally with the Vite frontend and serverless backend API.

### Tradeoffs Accepted

Separate deployments require:

* CORS configuration
* Separate environment variables
* Separate deployment configuration
* Managing the API base URL


---

## 13. Environment Variables for External Services

### Decision

Keep credentials and service configuration in environment variables.

Examples include:

```text
MONGO_URI
GEMINI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The frontend only receives values that are explicitly safe to expose, such as:

```text
VITE_API_URL
```

### Alternatives Considered

* Hard-code configuration
* Store credentials in source control
* Pass API secrets through the frontend

### Reasoning

Secrets must never be shipped to the browser or committed to the repository.

The backend owns access to MongoDB, Gemini, and Cloudinary credentials.

### Tradeoffs Accepted

Local development and deployment require environment configuration.

### What We Deliberately Cut

No custom secrets-management service was added.

Vercel environment variables are sufficient for the current project.

---

## 14. Document Status Lifecycle

### Decision

Use a small explicit status lifecycle for documents.

Typical states include:

```text
processing
ready
review
approved
declined
```

The frontend uses these states to control UI behavior and review actions.

### Alternatives Considered

* Boolean flags such as `isProcessed`
* A larger workflow/state machine
* Free-form status strings

### Reasoning

A document-processing workflow has meaningful states, and explicit states are easier to reason about than multiple independent boolean flags.

For example:

```text
processing
    ↓
ready
    ↓
review
    ↓
approved / declined
```

This also makes the UI state predictable.

### Tradeoffs Accepted

The current workflow is intentionally simple and does not model every possible failure or processing state.

### What We Deliberately Cut

No formal workflow engine or state-machine library was introduced.

For the current workflow, simple persisted status values are sufficient.

---

## 15. Review Side Panel Instead of Navigating Away

### Decision

Clicking a document filename opens a **review side panel** rather than navigating to another page or immediately downloading the file.

The panel provides:

* Document preview
* Extracted fields
* Review/edit capability
* Approval/decline actions

### Alternatives Considered

* Navigate to a dedicated document detail route
* Open the PDF in a new browser tab
* Download the document
* Use a modal

### Reasoning

The primary task after extraction is reviewing structured information.

A side panel keeps the document list visible while allowing the user to inspect and edit a selected document.

This reduces context switching and better represents an operational document-processing workflow.

### Tradeoffs Accepted

The side panel consumes horizontal space and requires careful responsive behavior.

### What We Deliberately Cut

A full document-detail routing system was not introduced.

The current review experience does not require URL-based navigation.

---


## 17. AG Grid for Large/Dense Document Tables

### Decision

Use **AG Grid Community** for document tables.

### Alternatives Considered

* Native HTML tables
* TanStack Table
* Material UI DataGrid
* A custom table implementation

### Reasoning

The document table needs:

* Sorting
* Filtering
* Pagination
* Checkbox selection
* Custom cell rendering
* Tooltips
* Resizable columns
* Large skill lists

AG Grid provides these capabilities without requiring a large amount of custom table infrastructure.

It also provides virtualization capabilities if the dataset grows later.

### Tradeoffs Accepted

AG Grid adds library complexity and requires understanding its configuration and rendering lifecycle.

### What We Deliberately Cut

Advanced enterprise-only AG Grid capabilities and server-side row models were not introduced because they were unnecessary for the current scope.

---

## 19. Confidence Values Are Represented as 0–1 Internally

### Decision

Store confidence values internally as numeric values between `0` and `1`.

The frontend formats them as percentages.

For example:

```text
0.95 → 95%
1.0  → 100%
```

### Alternatives Considered

* Store `"95%"` as a string
* Store numeric values between `0` and `100`
* Allow Gemini to generate arbitrary confidence descriptions

### Reasoning

A numeric normalized representation is easier to compare, sort, filter, and aggregate.

Formatting should happen at the presentation layer rather than being embedded in the stored value.

### Tradeoffs Accepted

The UI needs a small formatting step.

### What We Deliberately Cut

No advanced confidence calibration model was implemented.

The confidence values are currently extraction/model confidence indicators, not statistically calibrated probabilities.

---

## 20. Deterministic Confidence for Derived Fields

### Decision

Fields derived directly by application logic receive deterministic confidence rather than asking the model to invent confidence for them.

For example, total experience calculated from validated employment dates is treated as application-derived data.

### Alternatives Considered

* Ask Gemini to provide confidence for every field
* Use the model's confidence for calculated values
* Assign arbitrary confidence values

### Reasoning

Confidence should describe uncertainty in extraction.

If the application deterministically calculates a value from known dates, there is no additional model uncertainty involved in that calculation.

Keeping this distinction makes the data model more honest.

### Tradeoffs Accepted

The application does not represent uncertainty about whether an extracted employment date itself was correctly interpreted unless that uncertainty is explicitly captured during extraction.

### What We Deliberately Cut

A complete field-level provenance and confidence-calibration system was not implemented.

---
## 22. Frontend/Backend Responsibility Split

### Decision

Keep presentation and browser-specific processing in the frontend while keeping persistence, secrets, AI integration, and external service communication in the backend.

### Frontend Responsibilities

* File selection
* PDF text extraction
* Tables
* Filtering/sorting UI
* Review panel
* Editing extracted fields
* Loading states
* User interaction

### Backend Responsibilities

* API endpoints
* MongoDB
* Cloudinary
* Gemini
* Resume/JD matching
* Persistence
* Document lifecycle

### Alternatives Considered

* Put all parsing in the backend
* Put Gemini directly in the frontend
* Build a monolithic frontend-only implementation

### Reasoning

API keys and database credentials cannot be exposed in the browser.

At the same time, PDF.js is a reasonable browser-side capability and keeps the implementation aligned with the frontend-focused nature of the assignment.

This creates a clean boundary without unnecessarily moving all processing to the backend.

### Tradeoffs Accepted

Some processing occurs in different layers, so the data contract between frontend and backend must remain consistent.

### What We Deliberately Cut

The frontend does not directly communicate with Gemini, MongoDB, or Cloudinary using secret credentials.

---

## 23. Global Loading State

### Decision

Use a shared/global loading state for application-level operations rather than implementing a completely separate full-screen loader in every component.

### Alternatives Considered

* Local loading state in every component
* React Context
* A dedicated global state library
* Skeleton loading everywhere

### Reasoning

Document loading, processing, and other major asynchronous operations need a consistent application-level visual state.

A centralized loader prevents duplicated loading UI logic.

### Tradeoffs Accepted

A global loader is appropriate for major application operations but is not ideal for every small background request.

### What We Deliberately Cut

A complete skeleton-loading system for every table and panel was not implemented.

That can be added later where it provides a better perceived-performance experience.

---

## 24. Handle Async Effects Against Stale Responses

### Decision

Use request cancellation and an active-effect guard when loading document data.

The frontend uses `AbortController` and checks whether the effect is still active before updating state.

### Alternatives Considered

* Ignore stale requests
* Only use a boolean mounted flag
* Move all loading logic into Redux
* Use a data-fetching library

### Reasoning

React development behavior can expose race conditions in asynchronous effects, especially when components mount/unmount or dependencies change quickly.

Preventing stale responses from updating state makes the loading behavior more predictable.

### Tradeoffs Accepted

Each relevant API helper needs to accept an optional abort signal.

### What We Deliberately Cut

A full data-fetching library such as React Query was not introduced because the current API surface is small.

---

# Summary of Engineering Philosophy

The implementation intentionally follows a few principles:

1. **Use deterministic logic where the problem is deterministic.**
2. **Use AI where semantic understanding is actually required.**
3. **Avoid infrastructure that does not solve a current requirement.**
4. **Keep secrets and persistence on the backend.**
5. **Keep the frontend responsible for user experience and browser capabilities.**
6. **Prefer a complete vertical slice over partially implemented features.**
7. **Make scalability decisions explicit rather than prematurely optimizing for scale.**
8. **Treat AI output as untrusted application input and validate it before relying on it.**
9. **Document tradeoffs rather than presenting every decision as universally optimal.**
10. **Optimize the implementation for the assignment's actual constraints while keeping obvious production evolution paths available.**
