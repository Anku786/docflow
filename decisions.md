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

The application has three major responsibilities:

```text
Document
   ↓
Extract text
   ↓
Parse structured information
   ↓
Store / Review
   ↓
Compare against JD
   ↓
Generate match score
```

I intentionally avoided making everything AI-powered.

For example:

* Email → Regex
* Phone → Regex
* LinkedIn/GitHub → Pattern matching
* Skills section → Section-based parsing
* Employment dates → Deterministic date parsing
* Resume vs JD → Gemini

This keeps the system easier to debug, more predictable, and less expensive.

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

Client-side parsing means the browser does some processing, which could become expensive for very large documents.

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

Initially, while debugging the parser, it was tempting to treat PDF extraction and parsing as one problem.

That made it difficult to understand whether an issue was caused by:

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

I deliberately avoided maintaining a huge hardcoded list like:

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
2. Located the next section, `PROJECTS`
3. Took everything between those sections
4. Removed labels such as `Programming:` and `Development:`
5. Split by commas
6. Cleaned the resulting values

### Lesson

The fix was not to add more complicated parsing logic.

It was to **simplify the assumptions**.

That's something I'd highlight in an interview:

> "When parsing failed, I reduced the transformation steps instead of adding more regex. The simpler section-based approach was actually more robust."

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

# 8. MongoDB for Resume Persistence

### Decision

Resume metadata and extracted information are stored in MongoDB.

The record contains information such as:

```text
originalName
fileName
filePath
mimeType
size
status
extracted
createdAt
updatedAt
```

### Why

The uploaded file and the structured representation of that file are different concerns.

The PDF is stored on the filesystem while MongoDB stores the information needed to identify and work with it.

This also allows the UI to retrieve previously uploaded resumes without reprocessing the PDF every time.

---

# 9. Resume GET API

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
  "message": "Failed to fetch document"
}
```

But the resume controller was returning:

```text
Failed to fetch resumes
```

### How I diagnosed it

The most useful clue was that the expected backend log was not appearing.

That meant the request probably wasn't reaching the controller.

Instead of immediately changing database code, I checked:

```text
Frontend URL
      ↓
Express route
      ↓
Controller
```

The issue was related to the route being used/registered.

### Lesson

When a controller's expected log doesn't appear, check the request path and route registration before debugging the controller itself.

---

# 10. Delete Should Remove Both Database and Physical File

### Decision

Deleting a resume should clean up:

1. MongoDB record
2. Uploaded PDF

### Why

If we only delete the MongoDB record:

```text
MongoDB
  ❌ record removed

uploads/
  ⚠️ PDF still exists
```

Those files become orphaned and continue consuming storage.

### Final flow

```text
DELETE request
      ↓
Find resume
      ↓
Get filePath
      ↓
Delete physical file
      ↓
Delete MongoDB record
```

I also handle `ENOENT` so an already-deleted file doesn't unnecessarily make the API fail.

---

# 11. Bulk Delete

The same principle applies when deleting multiple resumes.

### Approach

```text
IDs
 ↓
Find records
 ↓
Get file paths
 ↓
Delete physical files
 ↓
Delete MongoDB records
```

### Why fetch records first?

The frontend only sends IDs.

The server needs the corresponding `filePath` to know which physical files should be removed.

This also keeps the cleanup logic on the backend, where it belongs.

---

# 12. Gemini — Where AI Actually Adds Value

### Decision

Gemini is used for semantic resume-to-JD matching.

The important question is not:

> "Does the resume contain the word React?"

It is:

> "How well does this candidate's experience and skill set align with this particular job?"

That requires semantic understanding.

### Example

The Zamp JD mentions:

```text
React
Angular
Vue.js
```

A simple keyword system might penalize a candidate because Angular and Vue are missing.

A better evaluator understands that these are alternative frontend frameworks and that strong React experience is still highly relevant.

This is where Gemini adds real value.

---

# 13. The Zamp JD Is Stored as Text

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

would add a lot of infrastructure without helping demonstrate the main requirement.

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

# 14. Resume Match API

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

# 15. Match Score vs Extraction Confidence

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

---

# 16. Zamp Match Criteria

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

Therefore, the match analysis considers multiple dimensions rather than just counting matching keywords.

### Interview answer

If asked:

> "Why not just calculate a percentage based on matching skills?"

I would say:

> "Because skill overlap alone doesn't represent job fit. A candidate can have the right technologies but lack the required experience, architecture knowledge, leadership exposure, or performance experience. I wanted the score to consider the complete JD."

---

# 17. Structured Gemini Response

### Decision

Gemini returns JSON rather than free-form text.

The response looks conceptually like:

```json
{
  "score": 86,
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "gaps": []
}
```

### Why

Structured output makes the AI result predictable for the frontend.

The UI can directly render:

```text
86%

Matched Skills
✓ React
✓ JavaScript
✓ Git

Missing / Weak
! Accessibility
! Vue.js

Strengths
...

Gaps
...
```

We don't need fragile string parsing of an AI-generated paragraph.

---

# 18. parseResume as the Main Orchestrator

The desired API from the application layer is simple:

```js
const result = await parseResume(text);
```

Internally:

```text
parseResume()
     │
     ├── Extract resume fields
     │
     └── Calculate JD match
             │
             ├── Read Zamp JD
             │
             └── Gemini
```

The caller doesn't need to know how the extraction or AI analysis happens.

The final result can contain:

```js
{
  name,
  email,
  phone,
  linkedin,
  github,
  skills,
  experience,
  match
}
```

This gives us a clean abstraction around the complete resume-processing workflow.

---

# 19. 400 Bad Request During Gemini Match

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

This tells us whether the frontend is actually sending the expected payload.

I also verified Express JSON middleware:

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

# 20. GitHub Secret Issue

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
4. Clean the repository history if necessary.
5. Push the cleaned history.

### Important principle

> Treat an exposed API key as compromised even if the repository is private.

---

# 21. Function Reference vs Function Invocation

### Problem

We had logic similar to:

```js
let callAPI =
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

This is a small issue, but it is an important JavaScript concept when working with callbacks and conditional behavior.

---

# 22. Current Architecture

The current system can be explained as:

```text
                    ┌────────────────────┐
                    │     React App      │
                    │                    │
                    │ Upload / Review    │
                    │ Resume UI          │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │      PDF.js        │
                    │                    │
                    │ Extract PDF text   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │   parseResume()    │
                    │                    │
                    │ Deterministic      │
                    │ extraction         │
                    └─────────┬──────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              Resume fields       Match API
                                      │
                                      ▼
                              ┌───────────────┐
                              │ zamp-jd.txt   │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │    Gemini     │
                              │               │
                              │ Resume vs JD  │
                              └───────┬───────┘
                                      │
                                      ▼
                                Match result
                                      │
                                      ▼
                              ┌───────────────┐
                              │   MongoDB     │
                              │               │
                              │ Resume data   │
                              └───────────────┘
```

---

# 23. What I Would Improve for Production

The current architecture is intentionally appropriate for an assignment.

If I were turning this into a production system, I would consider:

### 1. Background processing

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

### 2. JD management

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

### 3. Deterministic scoring + AI reasoning

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

### 4. Caching

The JD does not change for every resume.

I would cache the parsed JD or its embedding rather than repeatedly processing the same text.

### 5. Observability

For production I would add:

* Request IDs
* Structured logs
* AI latency
* Gemini errors
* Parsing failures
* Processing status
* Metrics

### 6. Security

I would also add:

* File type validation
* File size limits
* Malware scanning
* Authentication/authorization
* Rate limiting
* Secure file storage

---

# 24. Key Interview Talking Points

If I had to summarize the project in an interview, I would explain it like this:

> "I designed DocFlow around a simple principle: deterministic logic for predictable extraction and AI for semantic understanding."

> "PDF.js extracts the resume text on the frontend because this was a frontend-focused assignment."

> "I then parse predictable fields like email, phone, links, skills, and employment history using JavaScript rather than making an unnecessary AI call."

> "For the actual intelligence layer, I compare the resume against the Zamp Job Description using Gemini. The JD is currently stored as a text file because there is only one fixed JD for the assignment."

> "I also made the Gemini response structured so the UI can show an explainable match score, matched skills, missing skills, strengths, and gaps."

> "One important design consideration was separating extraction confidence from job-match score. One tells us how reliable the extraction is, while the other tells us how suitable the resume is for the role."

> "During development I ran into issues with skill parsing, routing, API payloads, and file cleanup. Rather than patching symptoms, I traced each issue through the system boundaries and simplified the implementation where possible."

---

# 25. Biggest Lessons

### Keep responsibilities separate

PDF extraction, parsing, persistence, and AI analysis shouldn't all live in one giant function.

### Don't use AI unnecessarily

AI is powerful, but deterministic code is better for deterministic problems.

### Make AI outputs structured

Never build important UI behavior around unpredictable AI prose.

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
External API / DB
```

check each boundary systematically.

### Design for the assignment, but know the production trade-offs

The current solution intentionally avoids unnecessary infrastructure.

At the same time, the architecture leaves clear paths for:

* Multiple JDs
* Background processing
* Caching
* Deterministic scoring
* Observability
* Production security

