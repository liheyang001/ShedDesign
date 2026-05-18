# Codebase Concerns

**Analysis Date:** 2026-05-18

## Tech Debt

**Type Definition Mismatch Between Frontend and Backend:**
- Issue: Frontend `types/garden.ts` defines `terrain` and `drainage` as generic `string` types, while backend `types/garden.ts` defines them as strict union types (`'flat' | 'sloped' | 'irregular'` and `'good' | 'moderate' | 'poor'`)
- Files: `frontend/src/types/garden.ts`, `backend/src/types/garden.ts`
- Impact: Type safety is lost on the frontend. Invalid values from the backend won't be caught at compile time. Frontend type system doesn't validate API responses, creating risk of runtime errors when the backend returns unexpected values.
- Fix approach: Synchronize frontend types with backend. Update `frontend/src/types/garden.ts` lines 20-21 to use strict union types matching backend definitions exactly. Consider creating a shared types package to eliminate manual duplication.

**Manual Type Synchronization Between Packages:**
- Issue: `GardenAnalysis`, `UserPreferences`, and `DesignRecommendation` types must be manually kept in sync between `backend/src/types/garden.ts` and `frontend/src/types/garden.ts` per CLAUDE.md guidance. This is error-prone.
- Files: `backend/src/types/garden.ts`, `frontend/src/types/garden.ts`
- Impact: Types can drift. When backend adds new optional fields or changes type definitions, frontend won't automatically update, causing potential runtime errors or UI breakage.
- Fix approach: Extract types to a shared npm package or use TypeScript's monorepo features to import types from a single source. Alternatively, use code generation to sync types from backend to frontend at build time.

**Incomplete Error Handling in Image Analysis:**
- Issue: `imageAnalyzer.ts` line 73-76 uses a regex to extract JSON from Gemini response: `responseText.match(/\{[\s\S]*\}/)`. If the regex fails or JSON is malformed, only a generic error is thrown. No validation of the parsed JSON structure against `GardenAnalysis` interface.
- Files: `backend/src/services/imageAnalyzer.ts`
- Impact: Invalid JSON from Gemini that passes the regex (e.g., missing required fields, wrong data types) will pass through and cause downstream errors when frontend tries to render missing properties or encounters unexpected types.
- Fix approach: Implement proper JSON parsing with schema validation. Use a library like `zod` or `io-ts` to validate the parsed response matches `GardenAnalysis` exactly. Add specific error messages when fields are missing.

**Unvalidated File Path Construction in getImage:**
- Issue: `uploadController.ts` lines 39-48: `getImage()` accepts `imageId` from URL params and searches `fs.readdirSync(uploadsDir)` for files starting with that ID. The `imageId` is used directly to construct a file path with `path.join(uploadsDir, file)`. While `fs.readdirSync` results are safe, user input isn't validated before file system operations.
- Files: `backend/src/controllers/uploadController.ts`
- Impact: Although path traversal is mitigated by searching only within `uploadsDir`, the function doesn't validate imageId format. A malicious imageId could theoretically match unintended files if naming is not strict (e.g., a file named `abc123xyz` could match imageId `abc123`).
- Fix approach: Validate imageId format (should match UUID v4 pattern) before searching. Ensure exact filename match, not prefix match. Consider storing a metadata file of uploaded image IDs and filenames.

## Known Bugs

**Frontend Type Definition Out of Sync with Backend:**
- Symptoms: TypeScript compilation succeeds on frontend, but API responses contain strict enum values that aren't recognized by the loose `string` type definitions. This creates a false sense of type safety.
- Files: `frontend/src/types/garden.ts` (lines 20-21)
- Trigger: Any API response with `terrain` or `drainage` values
- Workaround: Frontend code can still work because `string` accepts any string value, but type checking doesn't prevent errors in code like `if (analysis.terrain === 'unknown_value')`.

**Gemini Response JSON Extraction is Fragile:**
- Symptoms: If Gemini returns a response with multiple JSON objects or JSON in an unexpected position, the regex `/\{[\s\S]*\}/` will capture from the first `{` to the last `}`, potentially capturing malformed or incomplete JSON.
- Files: `backend/src/services/imageAnalyzer.ts` (line 73)
- Trigger: Gemini returns markdown code blocks or multiple JSON objects in a single response
- Workaround: None currently implemented. Backend will throw "无法从 Gemini 响应中提取 JSON" error.

## Security Considerations

**GEMINI_API_KEY Exposure Risk in Development:**
- Risk: Backend exposes Gemini API key through `config.geminiApiKey` at line 9 of `config/env.ts`. If the backend crashes or logs errors, the key could be logged to console or error logs. The `.env` file is properly listed in `.gitignore` but developers may accidentally expose the key in git history.
- Files: `backend/src/config/env.ts`, `backend/src/services/imageAnalyzer.ts` (line 52)
- Current mitigation: dotenv loads from `.env` file (not committed). API key is not logged in success cases.
- Recommendations: Add environment variable validation at startup (fail fast if required keys are missing in production). Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) in production rather than .env files. Implement logging redaction to ensure API keys never appear in logs. Add audit logging for API calls.

**File Upload Security - MIME Type Only:**
- Risk: Multer validates MIME type only (`file.mimetype.startsWith('image/')` at `routes/upload.ts` line 11). MIME type can be spoofed by malicious clients. No file size validation against actual file content.
- Files: `backend/src/routes/upload.ts` (lines 7-17), `backend/src/controllers/uploadController.ts` (lines 25)
- Current mitigation: 5MB size limit on multer. File extension is preserved from original filename. Files saved with UUID prefix.
- Recommendations: Validate file magic bytes (first few bytes) to confirm the actual file type, not just MIME type. Reject files with suspicious extensions (e.g., `.exe`, `.sh`). Scan uploaded files with antivirus/malware library. Store uploaded files outside webroot or implement download-only access patterns to prevent accidental execution.

**Unencrypted File Storage:**
- Risk: Uploaded garden images are stored to disk in `backend/uploads/` with no encryption. Sensitive user images (showing their property layout) could be exposed if the server is compromised.
- Files: `backend/src/controllers/uploadController.ts` (line 25)
- Current mitigation: None
- Recommendations: Encrypt files at rest using server-side encryption. Use a dedicated file storage service (AWS S3 with encryption, Google Cloud Storage, Azure Blob Storage) rather than local filesystem. Implement access control so users can only view their own images.

**Unprotected Upload Endpoint:**
- Risk: `POST /api/upload` has no authentication or rate limiting. Any client can upload unlimited images, consuming server disk space and API quotas (Gemini API calls).
- Files: `backend/src/routes/upload.ts` (line 19)
- Current mitigation: 5MB size limit per file and multer memory storage limit
- Recommendations: Implement authentication (JWT tokens, session cookies). Add rate limiting per IP/user (e.g., 10 uploads per hour). Implement disk space quotas. Add CSRF protection if running on same-origin with browser clients.

**Environment Variable `.env.example` has Misleading Structure:**
- Risk: `.env.example` line 2 uses `VITE_GEMINI_API_KEY` (frontend convention) but `backend/src/config/env.ts` reads `GEMINI_API_KEY` (no VITE prefix). This could confuse developers about which variable to set.
- Files: `.env.example` (line 2), `backend/src/config/env.ts` (line 9)
- Current mitigation: None
- Recommendations: Correct `.env.example` to use `GEMINI_API_KEY` for backend. Use `VITE_GEMINI_API_KEY` only if frontend needs direct access (it shouldn't — API calls should go through backend proxy).

## Performance Bottlenecks

**Synchronous Image File Write in Upload:**
- Problem: `uploadController.ts` line 25 uses `fs.writeFileSync()`, blocking the entire event loop while writing the file to disk. With concurrent uploads, this serializes I/O operations.
- Files: `backend/src/controllers/uploadController.ts` (line 25)
- Cause: Synchronous file I/O blocks the Express request handler
- Improvement path: Use `fs.promises.writeFile()` or `fs.writeFile()` with callback to make the operation asynchronous. Implement proper async/await handling in the controller.

**Linear File Search in getImage:**
- Problem: `uploadController.ts` lines 40-41 lists all files in `uploadsDir` and searches linearly with `.find()`. With thousands of uploaded images, this becomes slow.
- Files: `backend/src/controllers/uploadController.ts` (lines 40-41)
- Cause: No indexing or metadata store. Every request scans the entire directory.
- Improvement path: Store upload metadata (imageId → filename mapping) in a database or in-memory cache. Query the metadata instead of filesystem scan.

**Full Image Base64 Encoding in Memory:**
- Problem: `imageAnalyzer.ts` line 55 reads entire image into memory and encodes as base64. Large images (5MB limit is generous) will consume significant memory, especially with concurrent requests.
- Files: `backend/src/services/imageAnalyzer.ts` (line 55-56)
- Cause: Gemini API requires base64-encoded inline data. No chunking or streaming approach.
- Improvement path: Monitor memory usage with large files. Consider streaming or multipart uploads for very large files. Implement temporary file cleanup to prevent memory leaks.

**No Request Timeout on Gemini API:**
- Problem: Axios client in `frontend/src/services/api.ts` has a 60-second timeout, but Gemini Vision API can take longer with larger images or high load. If timeout is exceeded frequently, users see "upload failed" errors.
- Files: `frontend/src/services/api.ts` (line 8)
- Cause: Fixed timeout doesn't account for variable API latency
- Improvement path: Increase timeout or implement polling pattern. Add visual feedback for long-running requests. Implement server-side timeout management with graceful degradation.

## Fragile Areas

**Gemini Vision API Integration:**
- Files: `backend/src/services/imageAnalyzer.ts`
- Why fragile: The function depends on Gemini API response format (JSON extraction with regex), specific JSON structure, and API availability. Gemini updates its model behavior or response format frequently. Error handling is minimal (only JSON extraction fails are caught). Fallback returns hardcoded mock data that may not match actual garden characteristics.
- Safe modification: Add comprehensive logging around API calls. Implement retry logic with exponential backoff. Use strict type validation (zod) for parsed JSON. Test with various image formats and sizes. Consider implementing a circuit breaker pattern if Gemini API becomes unreliable.
- Test coverage: No tests visible in `backend/src/services/` directory. High risk area that needs comprehensive unit and integration tests.

**Frontend State Management in App.tsx:**
- Files: `frontend/src/App.tsx`
- Why fragile: Entire app state (`imageId`, `analysis`) held in useState at top level. No persistence (localStorage), so page refresh loses the current analysis. The state flow is linear (upload → questionnaire → result) with no way to go backwards or retry. The "questionnaire" and "result" steps show placeholder "coming-soon" messages.
- Safe modification: Add localStorage persistence for analysis results. Implement proper state machine (useReducer or state management library) for more complex flows. Add navigation back to upload step. Mock the questionnaire/result steps during testing.
- Test coverage: No test files visible for components. UI state changes are untested.

**Type Definition Drift Risk:**
- Files: `backend/src/types/garden.ts`, `frontend/src/types/garden.ts`
- Why fragile: Duplicate type definitions are manually synchronized. When backend adds new fields to `GardenAnalysis` (e.g., a new `availableSpaces` field with different structure), frontend won't know about it unless someone manually updates the duplicate. TypeScript won't catch this mismatch because the frontend types are loose (`string` instead of union types).
- Safe modification: Use a type generator or monorepo package to share types. Add a test that compares serialized JSON from backend against frontend types. Consider using API response validators on frontend.
- Test coverage: No type synchronization tests exist.

**CORS Configuration:**
- Files: `backend/src/index.ts` (line 8)
- Why fragile: `cors()` middleware with no options means all origins are allowed (`Access-Control-Allow-Origin: *`). This is acceptable for development but dangerous in production.
- Safe modification: In production, configure CORS with specific allowed origins: `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`. Add CSRF protection. Implement proper auth tokens.
- Test coverage: No CORS tests visible.

## Scaling Limits

**File Storage on Local Filesystem:**
- Current capacity: Limited by server disk space
- Limit: Breaks when disk is full (500 error on upload). No cleanup of old uploads. No backup strategy.
- Scaling path: Migrate to cloud file storage (AWS S3, Google Cloud Storage). Implement automated cleanup policies (delete uploads older than 30 days). Add database to track upload metadata and user ownership.

**In-Memory Image Processing:**
- Current capacity: ~100 concurrent uploads with 5MB images = ~500MB memory
- Limit: Runs out of memory under high concurrency
- Scaling path: Implement request queuing. Use worker threads for image processing. Switch to streaming/chunked uploads.

**No Database Layer:**
- Current capacity: Single server, no persistence
- Limit: Cannot scale horizontally. No user accounts or data recovery.
- Scaling path: Add PostgreSQL (schema hints in `.env.example` already suggest this). Implement user authentication and image ownership. Add analytics/metrics database.

**Gemini API Rate Limits:**
- Current capacity: Google's rate limits (tier-dependent, typically 10-15 requests/min for free tier)
- Limit: App will fail when rate limits are exceeded
- Scaling path: Implement request queuing/batching. Cache analysis results. Add retry logic with backoff. Upgrade to paid tier with higher limits.

## Dependencies at Risk

**@google/generative-ai (^0.21.0):**
- Risk: Pinned to minor version only (^0.21.0). Updates could introduce breaking changes. Library is relatively new and undergoing active development.
- Impact: Major version bump could break image analysis feature
- Migration plan: Test new versions in staging before upgrading. Review changelog for breaking changes. Consider pinning to specific patch version for production stability (e.g., `0.21.0` instead of `^0.21.0`).

**React 18 Ecosystem (react, react-dom, @react-three/fiber, @react-three/drei):**
- Risk: Multiple 3D rendering libraries in early feature stage. R3F is stable but Three.js updates frequently.
- Impact: Complex 3D scenes (Phase 8-9) may break with library updates. Rendering performance may degrade.
- Migration plan: Pin Three.js and R3F to specific versions once 3D implementation is complete. Implement E2E tests for 3D rendering.

**Multer (^1.4.5-lts.1):**
- Risk: LTS version suggests active maintenance is ending. Express ecosystem standardizing on other solutions (e.g., busboy, formidable).
- Impact: Security vulnerabilities may not be patched quickly
- Migration plan: Monitor for security advisories. Consider switching to `multipart/form-data` parser with better async support when upgrading major versions.

## Missing Critical Features

**No User Authentication:**
- Problem: App is completely public. No way to associate uploads/designs with users. Anyone can see/modify anyone else's data.
- Blocks: User accounts, saved projects, collaboration, data privacy compliance (GDPR, etc.)

**No Data Persistence:**
- Problem: Analyses are lost on server restart or page refresh. No way to save designs or revisit previous recommendations.
- Blocks: Real user workflows, saved project management, project history/versioning

**No Questionnaire Implementation:**
- Problem: Phase 6 shows placeholder "coming soon". App can't collect user preferences or generate recommendations without this.
- Blocks: Design recommendation feature, 3D scene generation

**No 3D Rendering:**
- Problem: Phases 8-9 dependencies (Three.js, R3F, Drei) are installed but not implemented. Result page doesn't exist.
- Blocks: Final design visualization and export

**No Error Recovery:**
- Problem: Upload fails silently or shows generic error message. No retry mechanism. No server-side error logging dashboard.
- Blocks: Debugging user issues, improving reliability

## Test Coverage Gaps

**No Backend Unit Tests:**
- What's not tested: Image upload validation, Gemini API integration, JSON parsing, error handling, route handlers
- Files: `backend/src/` (all files)
- Risk: Critical features untested. Regressions not caught. Configuration errors undetected.
- Priority: High — Phase 4 (image analysis) is core functionality

**No Frontend Component Tests:**
- What's not tested: ImageUpload component file selection/preview, error handling, UploadPage display logic, state transitions
- Files: `frontend/src/components/`, `frontend/src/pages/`
- Risk: UI regressions silently break user workflows. No regression protection as features are added.
- Priority: High — UI is primary user interface

**No E2E Tests:**
- What's not tested: Full upload → analysis → questionnaire flow, API integration, frontend-backend contract
- Files: Entire app
- Risk: Integration points are untested. Type mismatches between frontend/backend only caught in production.
- Priority: High — most critical for feature validation

**No Type Safety Tests:**
- What's not tested: Frontend type definitions match backend responses, Gemini API responses match expected structure
- Files: `frontend/src/types/garden.ts`, `backend/src/types/garden.ts`, `backend/src/services/imageAnalyzer.ts`
- Risk: Type definition drift goes unnoticed. Invalid API responses silently break the app.
- Priority: High — blocks confident frontend development

**No Load/Performance Tests:**
- What's not tested: Concurrent upload handling, memory leaks under high load, Gemini API rate limiting
- Files: `backend/src/` (all files)
- Risk: Performance issues only discovered in production. Scaling limits unknown.
- Priority: Medium — important for production readiness

---

*Concerns audit: 2026-05-18*
