# DocFlow — Engineering Decisions & Learnings

## Purpose

This document captures the important engineering decisions made while building DocFlow.

The goal is not only to document **what was built**, but also to explain:

* Why a particular approach was chosen
* What problems came up during development
* How those problems were diagnosed and fixed
* What trade-offs were considered
* What I would improve if this were a production system

---

# 1. Overall Approach

The main idea behind DocFlow was:

> **Keep simple problems deterministic and use AI where semantic understanding actually adds value.**

The application currently supports two major document types:

```text
Resume
Invoice
```

The overall flow is:

```text
Document
   ↓
Upload
   ↓
Extract text
   ↓
Document-specific parsing
   ↓
Structured data
   ↓
MongoDB
   ↓
Review / Approve / Decline
```

For resumes, there is an additional AI-powered matching flow:

```text
Resume
   ↓
Extract text
   ↓
Parse structured resume
   ↓
Resume + Zamp JD
   ↓
Gemini
   ↓
Match score + matched/missing skills
```

Implementation Note — Client-Side Table Rendering

For the current implementation, I have intentionally kept the document tables client-side rendered. Since the assignment works with a relatively small amount of data, client-side rendering keeps the implementation simpler, provides a responsive user experience, and avoids introducing unnecessary backend complexity for pagination, filtering, sorting, and querying.

Ideally, for a production system with a large number of documents, this table should be server-side rendered/data-driven. Pagination, sorting, filtering, and search should be handled by the backend/database, with the frontend requesting only the required page of data. This would reduce the amount of data transferred to the client and improve scalability as the dataset grows.

This was therefore a conscious scope and complexity trade-off for the assignment rather than a limitation of the architecture.

I intentionally avoided making everything AI-powered.

For example:

### Resume

* Email → Regex
* Phone → Regex
* LinkedIn/GitHub → Pattern matching
* Skills → Section-based parsing
* Employment dates → Deterministic date parsing
* Resume vs JD → Gemini

### Invoice

* Vendor → Gemini extraction
* Invoice number → Gemini extraction
* Invoice date → Gemini extraction
* Total amount → Gemini extraction
* Currency → Gemini extraction
* Expense type → Gemini classification

The difference exists because invoices can have significantly different layouts and terminology, making deterministic extraction much harder than extracting predictable resume fields.


---

# 2. Why PDF Parsing Happens in the Frontend

### Decision

I chose PDF.js for extracting text from uploaded resumes in the browser.

### Why

The assignment is primarily a Frontend Engineer assignment, so I wanted the frontend to demonstrate meaningful ownership of the document-processing flow.

Instead of immediately sending the entire PDF to the backend, the browser can extract the text:

```text
PDF
 ↓
PDF.js
 ↓
getPage()
 ↓
getTextContent()
 ↓
Plain text
```

That text is then passed to the resume parser.

### Trade-off

Client-side parsing means the browser performs some processing, which could become expensive for very large documents.

For this assignment, however, resumes are relatively small and the approach keeps the architecture simple.

### Production consideration

For very large documents or high-volume processing, I would consider moving PDF extraction to a backend worker or document-processing service.

---

# 3. Separating PDF Extraction from Resume Parsing

### Decision

I kept PDF extraction and resume parsing as separate responsibilities.

```text
PDF.js
  ↓
Raw text
  ↓
parseResume()
  ↓
Structured resume
```

### Why

While debugging the parser, it was important to distinguish whether an issue was caused by:

* PDF.js
* The extracted text
* The parser

Separating the stages made debugging much easier.

### Interview takeaway

If asked:

> "How did you debug PDF parsing?"

I would explain:

> "I first verified that PDF.js was extracting the expected text. Once the raw text looked correct, I debugged the parser independently. This helped isolate extraction issues from parsing issues."

---

# 4. Why Basic Resume Fields Are Not AI-Powered

### Decision

I did not use Gemini to extract every field from the resume.

Fields such as:

```text
Name
Email
Phone
LinkedIn
GitHub
```

are extracted using deterministic logic.

### Why

These fields have relatively predictable formats.

For example, there is no reason to spend an AI request to identify:

```text
ankita@example.com
```

when a regular expression can reliably identify it.

### Benefits

This gives us:

* Faster extraction
* Lower cost
* Predictable results
* Easier testing
* Easier debugging

### Principle

> AI should solve ambiguity, not replace straightforward programming.

---

# 5. Skills Parsing — Avoiding a Hardcoded Skill List

### Decision

I deliberately avoided maintaining a huge hardcoded list such as:

```js
const skillKeywords = [
  "React",
  "Angular",
  "Vue",
  "JavaScript",
  ...
];
```

### Why

A hardcoded list creates a maintenance problem.

Suppose a resume contains:

```text
Svelte
Astro
Remix
SolidJS
```

If those technologies are not in our list, the parser would miss them.

Instead, I use the resume's own `SKILLS` section as the source of truth.

### Approach

```text
Find SKILLS section
       ↓
Find next major section
       ↓
Extract only that range
       ↓
Remove category labels
       ↓
Split individual skills
       ↓
Clean values
```

This makes the parser more adaptable to different skill sets.

---

# 6. Skills Parsing Bug

### Problem

At one point the extracted skills looked like:

```text
P, r, o, g, r, a, m, i, n, g, ...
```

instead of:

```text
JavaScript
React.Js
Redux
Next.Js
...
```

### What happened?

The parser was manipulating the category string incorrectly.

Instead of treating the skills as complete values, part of the logic effectively treated the string as an iterable sequence of characters.

### How I resolved it

I simplified the parsing strategy.

Rather than trying to reconstruct the skills from individual categories, I:

1. Located `SKILLS`
2. Located the next major section
3. Took everything between those sections
4. Removed labels such as `Programming:` and `Development:`
5. Split by commas
6. Cleaned the resulting values

### Lesson

The fix was not to add more complicated parsing logic.

It was to **simplify the assumptions**.

> When parsing failed, I reduced the transformation steps instead of adding more regex. The simpler section-based approach was actually more robust.

---

# 7. Experience Calculation — Do Not Count Project Dates

### Decision

Only dates inside the `EXPERIENCE` section contribute to total professional experience.

### Why

A resume can contain dates in:

* Projects
* Education
* Certifications
* Internships
* Employment

Counting every date would produce an incorrect experience value.

For example:

```text
PROJECT
Jan 2023 - Mar 2023
```

should not automatically contribute to professional employment experience.

### Approach

```text
EXPERIENCE
   ↓
Extract employment entries
   ↓
Extract start/end dates
   ↓
Calculate duration
   ↓
Combine overlapping/continuous periods
```

### Interview takeaway

If asked:

> "How do you prevent project dates from affecting experience?"

Answer:

> "I don't calculate experience globally from every date in the document. I first scope the parser to the EXPERIENCE section and calculate employment duration only from entries found there."

---

# 8. Invoice Extraction

### Decision

Invoices are processed using Gemini because invoice layouts and terminology vary significantly.

The invoice extraction service asks Gemini to identify:

```text
Expense Type
Vendor
Invoice Number
Invoice Date
Total Amount
Currency
```

The model returns structured JSON containing:

```text
invoiceType
fields
    vendorName
    invoiceNumber
    invoiceDate
    totalAmount
    currency
```

Each field also contains:

```text
value
confidence
evidence
```

Example:

```json
{
  "vendorName": {
    "value": "MAKEMYTRIP (INDIA) PRIVATE LIMITED",
    "confidence": 1,
    "evidence": "MAKEMYTRIP (INDIA) PRIVATE LIMITED"
  }
}
```

### Why structured output?

The frontend needs predictable data rather than AI-generated prose.

This allows the UI to directly render extracted invoice fields and confidence values.

---

# 9. Invoice Confidence vs Overall Confidence

### Decision

Field-level confidence comes from Gemini, but the application calculates the overall confidence.

For example:

```text
Vendor         1.00
Invoice No.    0.95
Invoice Date   1.00
Amount         1.00
Currency       1.00
```

The backend calculates:

```text
(1 + 0.95 + 1 + 1 + 1) / 5
= 0.99
```

Therefore:

```text
Overall Confidence = 0.99
```

### Why calculate it ourselves?

I don't want the LLM to independently invent the overall score.

Instead:

```text
Gemini
   ↓
Field extraction + field confidence
   ↓
Backend
   ↓
Calculate overall confidence
```

This makes the score deterministic and reproducible.

### Missing fields

Missing fields are excluded from the average rather than automatically being treated as zero.

For example, if an invoice does not contain an invoice number, that should not automatically mean that the entire extraction has zero confidence.

---

# 10. Confidence Data Model

### Decision

Confidence is stored internally as a number between `0` and `1`.

For example:

```js
confidence: 0.99
```

The frontend converts this into a percentage:

```text
99%
```

### Why?

Keeping the raw value numeric makes sorting and calculations easier.

AG Grid can then use:

```js
{
  headerName: "Confidence",
  field: "confidence",
  cellDataType: "number",
  valueFormatter: ({ value }) =>
    value == null
      ? "-"
      : `${Math.round(value * 100)}%`
}
```

### Problem encountered

At one point confidence was stored as:

```js
confidence: "100%"
```

AG Grid interpreted the field as numeric in some circumstances and displayed:

```text
Invalid number
```

### Resolution

Keep confidence numeric in the data layer:

```text
1
0.95
0.82
```

and format it for display:

```text
100%
95%
82%
```

### Principle

> Store data in its most useful machine-readable form and format it at the presentation layer.

---

# 11. MongoDB for Document Persistence

### Decision

Resume and invoice metadata, extracted information, status, and file information are stored in MongoDB.

The database allows the application to retrieve previously uploaded documents without reprocessing them every time.

Conceptually:

```text
Document
├── file information
├── extracted information
├── status
├── confidence
└── timestamps
```

### Why MongoDB?

The extracted document structure is naturally document-oriented and can differ between resumes and invoices.

MongoDB provides flexibility without requiring a rigid relational schema for every extracted field.

---

# 12. Cloudinary for File Storage

### Decision

Uploaded PDFs are stored in Cloudinary rather than relying on the local filesystem.

The MongoDB record stores the corresponding:

```text
fileUrl
cloudinaryPublicId
```

### Why?

A local filesystem is not appropriate for serverless deployment.

On Vercel, the application filesystem is ephemeral and cannot be treated as persistent document storage.

The architecture therefore became:

```text
Browser
   ↓
Backend
   ↓
Cloudinary
   ↓
Permanent PDF URL

MongoDB
   ↓
Metadata + Cloudinary reference
```

### Upload flow

Multer uses memory storage:

```text
Uploaded PDF
     ↓
multer.memoryStorage()
     ↓
req.file.buffer
     ↓
Cloudinary upload_stream()
     ↓
secure_url
```

This avoids writing temporary files to the server filesystem.

### Production consideration

For a larger system I would additionally consider:

* Signed upload URLs
* Virus/malware scanning
* File retention policies
* Access-controlled delivery
* Content-type validation

---

# 13. Cloudinary Serverless Storage Bug

### Problem

The original upload implementation relied on disk storage.

This worked locally but failed on Vercel with filesystem errors such as:

```text
ENOENT
/var/task/server/uploads
```

### Root cause

Vercel functions should not be treated as persistent servers with writable application storage.

### Resolution

Changed Multer from disk storage to memory storage:

```js
const storage = multer.memoryStorage();
```

and upload directly from:

```js
req.file.buffer
```

to Cloudinary.

### Lesson

> Local filesystem assumptions often break when moving an application to serverless infrastructure.

---

# 14. Cloudinary PDF Delivery

### Problem

The uploaded PDF existed in Cloudinary, but opening its URL resulted in:

```text
Failed to load PDF document
```

### Investigation

The Cloudinary URL itself was valid, but PDF delivery security settings can prevent PDF assets from being served.

### Resolution

PDF delivery needs to be enabled in the Cloudinary environment when required.

### Lesson

A successful upload does not necessarily mean that the asset is configured for public delivery.

The upload and delivery paths should be debugged separately:

```text
Upload
 ↓
Cloudinary asset
 ↓
Delivery permissions
 ↓
Browser
```

---

# 15. Resume GET API

### Decision

The application exposes:

```text
GET /api/resumes
```

to retrieve stored resumes.

### Issue

At one point the frontend received:

```json
{
  "success": false,
  "message": "Failed to fetch resumes"
}
```

The backend also produced:

```text
MongooseError:
Operation `resumes.find()` buffering timed out
```

### Root cause

The Vercel serverless function was not reliably establishing/reusing the MongoDB connection before executing the query.

### Resolution

MongoDB connection handling was moved into the serverless request lifecycle and cached:

```text
Request
  ↓
connectDB()
  ↓
Cached MongoDB connection
  ↓
Controller
  ↓
Resume.find()
```

### Lesson

Serverless environments require different database connection handling from traditional long-running Node.js servers.

---

# 16. Separate Local Server and Vercel Entry Points

### Decision

The backend uses different entry points for local development and Vercel.

Local:

```text
server/server.js
```

Vercel:

```text
server/api/index.js
```

Both use the same Express application:

```text
             ┌── server.js ── Local
             │
Express app ─┤
             │
             └── api/index.js ── Vercel
```

### Why?

This keeps the Express application independent from the runtime.

The application itself contains routes and middleware, while the entry point is responsible for starting it in the appropriate environment.

---

# 17. Separate Frontend and Backend Vercel Projects

### Decision

The frontend and backend are deployed as separate Vercel projects.

```text
React/Vite
   ↓
Frontend Vercel project

Express
   ↓
Backend Vercel project
```

### Why?

Initially, attempting to host both through one Vercel project caused API routes to return `404`.

Separating the projects makes the deployment boundaries explicit.

The frontend communicates with the deployed backend through:

```text
VITE_API_URL
```

### Security consideration

The frontend API URL is intentionally public.

Only server-side secrets such as:

```text
GEMINI_API_KEY
MONGO_URI
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

must remain in the backend environment.

---

# 18. Environment Variables

### Decision

Environment-specific configuration is kept outside source code.

Frontend:

```text
VITE_API_URL
```

Backend:

```text
MONGO_URI
GEMINI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Important distinction

Vite variables prefixed with:

```text
VITE_
```

are exposed to the browser.

Therefore:

```text
VITE_API_URL
```

is safe to expose because it is only the backend URL.

Secrets such as:

```text
GEMINI_API_KEY
CLOUDINARY_API_SECRET
```

must never be placed in frontend code.

---

# 19. Delete Should Remove Both Database and Cloudinary Asset

### Decision

Deleting a document should clean up:

1. MongoDB record
2. Cloudinary asset

The MongoDB record stores:

```text
cloudinaryPublicId
```

so the backend knows which Cloudinary asset needs to be removed.

### Flow

```text
DELETE request
      ↓
Find records
      ↓
Get cloudinaryPublicId
      ↓
Delete Cloudinary assets
      ↓
Delete MongoDB records
```

### Why?

If only the database record is removed:

```text
MongoDB
  ❌ record removed

Cloudinary
  ⚠️ PDF still exists
```

This creates orphaned files and unnecessary storage usage.

---

# 20. Bulk Delete

The same principle applies when deleting multiple documents.

### Approach

```text
Selected IDs
 ↓
Find records
 ↓
Get Cloudinary public IDs
 ↓
Delete Cloudinary assets
 ↓
Delete MongoDB records
```

### Why fetch records first?

The frontend only sends document IDs.

The server needs the corresponding Cloudinary IDs to perform storage cleanup.

This keeps storage management on the backend.

---

# 21. AG Grid for Document Tables

### Decision

I chose AG Grid for the resume and invoice tables.

### Why?

The application needs:

* Sorting
* Resizing
* Selection
* Filtering
* Large-data rendering
* Custom cell renderers

AG Grid provides these capabilities without requiring a large amount of custom table infrastructure.

### Resume columns

The resume table contains information such as:

```text
Resume
Candidate
Experience
Skills
Matched Skills
Missing Skills
Match Score
Status
Uploaded
```

### Invoice columns

The invoice table focuses on the most useful scanning information:

```text
Invoice
Vendor
Invoice Number
Invoice Date
Expense Type
Amount
Confidence
Status
Uploaded
```

Not every extracted field needs to be visible in the table.

The review panel can show the complete extracted information.

---

# 22. Custom Skill Cell Rendering

### Problem

Skills can be very long and displaying every skill in one table cell makes the table difficult to scan.

### Decision

Only the first few skills are displayed as chips.

For example:

```text
JavaScript
React
Redux
Next.js
TypeScript
+4 more
```

The remaining skills are available through a tooltip.

### Why?

This provides a balance between:

* Information density
* Readability
* Horizontal scrolling
* Table performance

The same component is reused for:

```text
Skills
Matched Skills
Missing Skills
```

---

# 23. PDF Review Side Panel

### Decision

Clicking a document filename opens the document in a review panel instead of downloading it.

The flow is:

```text
AG Grid
   ↓
Click document
   ↓
Selected record
   ↓
ReviewView
   ↓
DocumentPreview
```

### Why?

The primary purpose of DocFlow is document processing and review.

The user should be able to inspect:

* Original document
* Extracted information
* Confidence
* Review status

without leaving the dashboard.

---

# 24. Document Status Workflow

Documents can move through states such as:

```text
Processing
Ready
Needs Review
Approved
Declined
Draft
```

The review panel provides actions such as:

```text
Save Draft
Approve
Decline
```

The backend updates the corresponding document record.

### Why backend status updates?

The backend is the source of truth for document state.

The frontend updates its local state after a successful API response.

---

# 25. Global Loading State

### Decision

A global loading overlay is controlled from the top-level application.

The flow is:

```text
Dashboard
    ↓
onLoadingChange(true)
    ↓
App
    ↓
isLoading
    ↓
Loader
```

### Why?

Operations such as:

* Loading documents
* Deleting documents
* Saving
* Approving
* Declining

can all require asynchronous API calls.

A centralized loader provides consistent feedback.

### Implementation principle

The loader should render the application normally and add an overlay only while loading:

```text
Application
      +
Loading overlay
```

rather than replacing the entire application tree.

---

# 26. React StrictMode and Double API Effects

### Problem

During development, the document-loading `useEffect` appeared to execute twice.

Logs looked similar to:

```text
DASHBOARD → loading TRUE
DASHBOARD → loading TRUE
```

### Root cause

React StrictMode intentionally re-runs certain lifecycle/effect behavior in development to detect unsafe side effects.

### Risk

An async effect that blindly sets loading to `false` in `finally` can cause this sequence:

```text
Request A starts
 ↓
loading = true

StrictMode cleanup
 ↓
Request A aborted

Request B starts
 ↓
loading = true

Request A finally
 ↓
loading = false
```

The UI can therefore hide the loader while Request B is still running.

### Resolution

The effect tracks cancellation:

```js
let cancelled = false;
```

and only updates loading when the current effect is still active.

### Lesson

Async effects should handle both:

```text
AbortController
```

and:

```text
Effect cancellation state
```

when appropriate.

---

# 27. Function Reference vs Function Invocation

### Problem

We had logic similar to:

```js
const callAPI =
  type === "resume"
    ? deleteResumes(selectedDocuments)
    : deleteDocuments(selectedDocuments);
```

This executes the function immediately.

### Correct approach

Select the function first:

```js
const callAPI =
  type === "resume"
    ? deleteResumes
    : deleteDocuments;

const response = await callAPI(selectedDocuments);
```

### Lesson

A function reference:

```js
deleteResumes
```

is different from invoking it:

```js
deleteResumes(...)
```

This is an important JavaScript concept when working with callbacks and conditional behavior.

---

# 28. Gemini — Where AI Actually Adds Value

### Decision

Gemini is used for problems requiring semantic understanding.

For resume matching, the important question is not:

> "Does the resume contain the word React?"

It is:

> "How well does this candidate's experience and skill set align with this particular job?"

That requires semantic understanding.

### Example

A JD might mention:

```text
React
Angular
Vue.js
```

A simple keyword system could penalize a candidate because Angular and Vue are missing.

A semantic evaluator can understand that these are frontend frameworks and that strong React experience may still be highly relevant.

This is where Gemini adds real value.

---

# 29. The Zamp JD Is Stored as Text

### Decision

For this assignment, the JD is stored as:

```text
server/data/zamp-jd.txt
```

### Why not build JD upload + database management?

There is currently one known JD.

Building:

```text
JD upload
JD CRUD
JD database model
JD file management
```

would add infrastructure without significantly improving the main assignment.

Instead:

```text
zamp-jd.txt
      ↓
Read as text
      ↓
Resume + JD
      ↓
Gemini
```

### Trade-off

This is appropriate for the assignment but not ideal for a multi-job production system.

If the product supported hundreds of JDs, I would move the JD into a database or document store.

---

# 30. Resume Match API

### Decision

The backend exposes:

```text
POST /api/resumes/match
```

The frontend sends:

```json
{
  "resumeText": "..."
}
```

The backend:

1. Reads the Zamp JD
2. Sends resume + JD to Gemini
3. Receives structured analysis
4. Returns the match result

### Why backend Gemini integration?

The Gemini API key must never be exposed in the browser.

The architecture is:

```text
React
  ↓
Our Backend
  ↓
Gemini
```

not:

```text
React
  ↓
Gemini API
```

This keeps the API key private.

---

# 31. Structured Gemini Response

### Decision

Gemini returns JSON rather than free-form text.

The response conceptually looks like:

```json
{
  "match_score": "86%",
  "matched_skill": "...",
  "missing_skills": "..."
}
```

### Why?

Structured output makes the AI result predictable for the frontend.

The UI can directly render:

```text
86%

Matched Skills
✓ React
✓ JavaScript
✓ Git

Missing Skills
! Accessibility
! Vue.js
```

We don't need fragile string parsing of an AI-generated paragraph.

---

# 32. Match Score vs Extraction Confidence

These are two separate concepts.

### Extraction confidence

Answers:

> "How confident are we that this field was extracted correctly?"

Example:

```text
Email: 99%
```

### Match score

Answers:

> "How well does this resume match the JD?"

Example:

```text
Resume Match: 86%
```

They should never be presented as the same metric.

This distinction is important because a document can have:

```text
Extraction confidence: 100%
Match score: 72%
```

That means the information was extracted reliably, but the candidate is not necessarily a strong match for the JD.

---

# 33. Zamp Match Criteria

The Zamp JD isn't just asking for specific technologies.

It emphasizes:

```text
Frontend development
Experience
Architecture
Performance
Responsive design
Accessibility
UI/UX
Leadership
Mentoring
Collaboration
Git
Agile
```

Therefore, the match analysis considers multiple dimensions rather than simply counting matching keywords.

### Interview answer

If asked:

> "Why not just calculate a percentage based on matching skills?"

I would say:

> "Because skill overlap alone doesn't represent job fit. A candidate can have the right technologies but lack the required experience, architecture knowledge, leadership exposure, or performance experience. I wanted the analysis to consider the complete JD."

---

# 34. 400 Bad Request During Gemini Match

### Problem

The match API returned:

```text
POST /api/resumes/match 400 Bad Request
```

### What the API expected

The controller expected:

```json
{
  "resumeText": "..."
}
```

### Debugging

Instead of assuming Gemini was failing, I checked the first boundary:

```js
console.log("MATCH BODY:", req.body);
```

This determines whether the frontend is actually sending the expected payload.

I also verified Express middleware:

```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

and the frontend request:

```js
fetch("/api/resumes/match", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    resumeText: text
  })
});
```

### Lesson

A 400 error is not necessarily an AI problem.

First verify:

```text
Request
 ↓
Payload
 ↓
Route
 ↓
Controller validation
 ↓
Service
```

---

# 35. GitHub Secret Issue

### Problem

GitHub rejected a push because an API key had been committed through:

```text
server/.env
```

### What we learned

Adding `.env` to `.gitignore` is necessary, but it does not remove a secret that has already entered Git history.

### Correct response

The important steps are:

1. Revoke/rotate the exposed API key.
2. Add `.env` to `.gitignore`.
3. Remove `.env` from Git tracking.
4. Clean repository history if necessary.
5. Push the cleaned history.

### Important principle

> Treat an exposed API key as compromised even if the repository is private.

---

# 36. Current Architecture

The current system can be explained as:

```text
                         ┌──────────────────────┐
                         │      React App       │
                         │                      │
                         │ Upload / Dashboard   │
                         │ Review / AG Grid     │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴───────────┐
                         │                      │
                         ▼                      ▼
                    Resume PDF             Invoice PDF
                         │                      │
                         ▼                      ▼
                       PDF.js                Backend
                         │                      │
                         ▼                      ▼
                   Resume parser        Gemini extraction
                         │                      │
                         │                      ▼
                         │              Invoice structured data
                         │
                         ▼
                   Resume structured data
                         │
                         ▼
                  Resume + Zamp JD
                         │
                         ▼
                      Gemini
                         │
                         ▼
                    Match result
                         │
                         └──────────┬───────────┘
                                    ▼
                              Express API
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       ▼                         ▼
                   MongoDB                  Cloudinary
                 Metadata/data                PDF files
```

Deployment:

```text
┌──────────────────────┐
│  Frontend Vercel     │
│  React + Vite        │
└──────────┬───────────┘
           │
           │ HTTPS
           ▼
┌──────────────────────┐
│  Backend Vercel      │
│  Express             │
└───────┬──────┬───────┘
        │      │
        ▼      ▼
   MongoDB   Cloudinary
        │
        ▼
     Gemini
```

---

# 37. What I Would Improve for Production

The current architecture is intentionally appropriate for an assignment.

If I were turning this into a production system, I would consider:

## 1. Background processing

Large documents shouldn't block the request.

I would move parsing and AI processing into a job queue:

```text
Upload
 ↓
Queue
 ↓
Worker
 ↓
Parse
 ↓
Gemini
 ↓
Database
```

## 2. JD management

Instead of one:

```text
zamp-jd.txt
```

I would have:

```text
JobDescription
```

records in the database.

That would allow:

```text
Multiple companies
Multiple roles
Multiple JDs
```

## 3. Deterministic scoring + AI reasoning

I would avoid giving Gemini complete control over the numerical score.

A stronger production approach would be:

```text
Deterministic scoring
       +
Semantic AI analysis
       ↓
Final explainable score
```

For example:

```text
Skills              40%
Experience          20%
Responsibilities    15%
Architecture        10%
Leadership           5%
UI/UX                5%
Git/Agile            5%
```

Gemini can provide semantic evidence while the scoring engine remains predictable.

## 4. Caching

The JD does not change for every resume.

I would cache the parsed JD or its embedding rather than repeatedly processing the same text.

## 5. Observability

For production I would add:

* Request IDs
* Structured logs
* AI latency
* Gemini errors
* Parsing failures
* Processing status
* Metrics

## 6. Security

I would also add:

* File type validation
* File size limits
* Malware scanning
* Authentication/authorization
* Rate limiting
* Secure file storage
* Signed/private document URLs

## 7. Better document processing

For scanned/image-only PDFs, PDF.js text extraction may not be sufficient.

I would add an OCR pipeline:

```text
PDF
 ↓
Text extraction
 ↓
If text unavailable
 ↓
OCR
 ↓
Parser
```

This would improve support for scanned invoices and resumes.

---

# 38. Key Interview Talking Points

If I had to summarize the project in an interview, I would explain it like this:

> "I designed DocFlow around a simple principle: deterministic logic for predictable extraction and AI for semantic understanding."

> "PDF.js extracts resume text on the frontend because this was a frontend-focused assignment."

> "I then parse predictable resume fields like email, phone, links, skills, and employment history using JavaScript rather than making unnecessary AI calls."

> "For invoices, the document layout is much less predictable, so I use Gemini to extract structured invoice information along with field-level confidence and evidence."

> "I calculate overall extraction confidence in the backend from the individual field confidences rather than allowing the LLM to independently determine the final score."

> "For resume matching, I compare the candidate against the fixed Zamp Job Description using Gemini. The JD is currently stored as a text file because there is only one fixed JD for the assignment."

> "I also keep extraction confidence separate from job-match score. One measures how reliable the extracted data is, while the other measures how well the candidate matches the role."

> "The documents are persisted in MongoDB while the actual PDFs are stored in Cloudinary, which is more appropriate for the serverless deployment."

> "During development I ran into issues with skill parsing, serverless filesystem storage, MongoDB connection lifecycle, Cloudinary PDF delivery, API payloads, AG Grid data types, and React StrictMode effects. I traced each issue through the system boundaries rather than treating each symptom independently."

---

# 39. Biggest Lessons

### Keep responsibilities separate

PDF extraction, parsing, persistence, AI analysis, and UI rendering shouldn't all live in one giant function.

### Don't use AI unnecessarily

AI is powerful, but deterministic code is better for deterministic problems.

### Use AI where ambiguity exists

Invoices and semantic resume matching benefit more from AI than predictable fields such as email or phone numbers.

### Make AI outputs structured

Never build important UI behavior around unpredictable AI prose.

### Keep confidence numeric

Store:

```text
0 → 1
```

and format it as:

```text
0% → 100%
```

in the UI.

### Separate extraction confidence from match score

These represent different business concepts and should remain independent.

### Don't rely on local filesystem storage in serverless

Persistent documents belong in object storage such as Cloudinary rather than the Vercel function filesystem.

### Debug from the boundary

When something fails:

```text
UI
 ↓
Request
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
External API / DB / Storage
```

Check each boundary systematically.

### Handle async effects carefully

React development behavior such as StrictMode can expose race conditions that are easy to miss if asynchronous cleanup is not handled correctly.

### Design for the assignment, but know the production trade-offs

The current solution intentionally avoids unnecessary infrastructure.

At the same time, the architecture leaves clear paths for:

* Multiple JDs
* Background processing
* OCR
* Caching
* Deterministic scoring
* Observability
* Production security
* Scalable document processing
