# Testing Patterns

**Analysis Date:** 2026-05-18

## Test Framework

**Runner:**
- Vitest configured in both backend and frontend `package.json` scripts
- Run command: `npm run test` (from root executes `npm --workspaces run test`)
- Neither workspace has vitest config files (`vitest.config.ts`) or test dependencies installed

**Backend:**
- `backend/package.json` declares test script: `"test": "vitest"`
- No `@vitest/ui`, `vitest`, or `@types/vitest` in devDependencies
- Vitest is intended but not yet installed

**Frontend:**
- `frontend/package.json` declares test script: `"test": "vitest"`
- No vitest configuration or dependencies present

**Assertion Library:**
- Not installed (Vitest includes it by default with `expect`)
- Not yet used

**Run Commands:**
```bash
npm run test                 # Run all tests (both workspaces)
cd backend && npm run test   # Run backend tests only
cd frontend && npm run test  # Run frontend tests only
```

## Test File Organization

**Location:**
- No test files exist yet
- Convention established by `package.json` scripts: tests will run via `vitest`
- Typical location (not yet implemented): `src/**/*.test.ts` or `src/**/*.spec.ts` (vitest default)

**Naming:**
- File pattern would follow: `[module].test.ts` or `[module].spec.ts`
- Example structure (not yet created):
  - `backend/src/services/imageAnalyzer.test.ts`
  - `backend/src/controllers/uploadController.test.ts`
  - `frontend/src/components/ImageUpload.test.tsx`

**Structure:**
- Would be co-located with source files (vitest default glob)
- Test files adjacent to source modules they test

## Test Coverage

**Requirements:** None enforced
- No coverage configuration detected
- No coverage thresholds in any config files
- `npm run test` will run tests but not enforce coverage

**View Coverage:**
```bash
# Not configured, but vitest supports:
vitest --coverage  # Once vitest and @vitest/coverage are installed
```

## Test Types

**Unit Tests:**
- **Target:** Not yet created
- **Expected scope:** Services (e.g., `imageAnalyzer.test.ts`), controllers, utility functions
- **Approach:** Mock external dependencies (Gemini API, filesystem)

**Integration Tests:**
- **Target:** Not yet created
- **Expected scope:** Route handlers with mocked services, API contract testing
- **Approach:** Test routes end-to-end with mocked external calls

**E2E Tests:**
- **Framework:** Not used
- **Alternative:** Would require separate setup (Playwright, Cypress)
- **Status:** Not planned in current implementation roadmap

## Mocking Strategy

**Framework:** Vitest includes `vi` object (equivalent to Jest's `jest`)

**Expected Patterns (not yet implemented):**

### Mocking External APIs
```typescript
// For Gemini API in imageAnalyzer.test.ts
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => '{"terrain": "flat", ...}' }
      })
    })
  }))
}))
```

### Mocking Filesystem
```typescript
// For fs in uploadController.test.ts
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(() => ['image-uuid.jpg']),
  readFileSync: vi.fn(() => Buffer.from('fake-image-data'))
}))
```

### Mocking Express Request/Response
```typescript
// For route handlers
const mockRequest = {
  file: { buffer: Buffer.from('...'), originalname: 'garden.jpg', mimetype: 'image/jpeg' },
  params: { imageId: 'test-uuid' }
} as Partial<Express.Request>

const mockResponse = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  sendFile: vi.fn()
} as Partial<Express.Response>
```

**What to Mock:**
- External API calls (Gemini, database connections)
- Filesystem operations (read/write/mkdir)
- Network calls (axios in frontend)
- Environment variables

**What NOT to Mock:**
- Core business logic functions (image analysis logic)
- Data transformation functions
- Type utilities

## Fixtures and Factories

**Test Data:**
- Not yet created
- Expected location: `backend/src/__tests__/fixtures/` or similar
- Examples needed:
  - Mock `GardenAnalysis` objects
  - Mock file uploads
  - Mock Gemini responses

**Factory Pattern (anticipated):**
```typescript
// factory.ts - not yet created
export function createMockGardenAnalysis(overrides?: Partial<GardenAnalysis>): GardenAnalysis {
  return {
    estimatedSize: { width: 15, height: 20 },
    orientation: 'N',
    sunlight: { morning: 'full-sun', afternoon: 'partial-sun', evening: 'shade' },
    existingStructures: ['house', 'fence'],
    availableSpaces: [
      { x: 3, y: 5, width: 4, height: 4, score: 0.8 }
    ],
    terrain: 'flat',
    drainage: 'good',
    ...overrides
  }
}
```

## Common Testing Patterns

**Async Testing:**
```typescript
// Pattern: Vitest with async/await
it('should analyze garden image', async () => {
  const result = await analyzeGardenImage('/path/to/image.jpg')
  expect(result).toHaveProperty('estimatedSize')
})
```

**Error Testing:**
```typescript
// Pattern: Testing error cases
it('should return fallback when GEMINI_API_KEY is unset', () => {
  vi.stubEnv('GEMINI_API_KEY', undefined)
  const result = analyzeGardenImage('/path/to/image.jpg')
  expect(result).toEqual(fallbackAnalysis())
})
```

## Backend Testing Considerations

**Services to Test:**
- `imageAnalyzer.ts`: Gemini API integration, fallback behavior when API key missing
- Controllers: File upload handling, response formatting

**Routes to Test:**
- `POST /api/upload`: Multer validation, file size limits, MIME type checking, controller invocation
- `GET /api/image/:imageId`: File retrieval, 404 handling

**Database/Persistence:**
- Currently: Files saved to `uploads/` directory
- No database ORM (future phases planned)
- Mock filesystem for unit tests

## Frontend Testing Considerations

**Components to Test:**
- `ImageUpload.tsx`: File input handling, preview display, upload API call, error states
- `UploadPage.tsx`: State management, callback propagation
- `App.tsx`: Step navigation, state transitions

**Hooks to Test:**
- `useState` usage in components (tested implicitly through component tests)
- No custom hooks yet

**API Service to Test:**
- `api.ts`: Axios instance configuration, upload endpoint call, response parsing

**Patterns:**
- Use `vitest` with React testing library (if added)
- Mock axios for API calls
- Test component rendering, event handling, and callbacks

## Coverage Gaps (Not Yet Addressed)

**Critical untested areas:**
1. Gemini API integration (`imageAnalyzer.ts`): Complex JSON parsing, error handling
2. File upload validation (`uploadController.ts`): Edge cases (missing files, wrong MIME types)
3. Frontend component state (`ImageUpload.tsx`, `UploadPage.tsx`): React state updates, event handlers
4. Route handler contracts (`routes/upload.ts`): Multer middleware integration, response format
5. Error paths: All error scenarios need test coverage
6. Fallback behavior: Mock data generation when API unavailable

**Risk:** Zero test coverage means refactoring or adding features has no safety net.

## Testing Dependencies Needed

To implement testing, add to both workspaces:

**Backend:**
```json
"devDependencies": {
  "vitest": "^0.34.0",
  "@vitest/ui": "^0.34.0"
}
```

**Frontend:**
```json
"devDependencies": {
  "vitest": "^0.34.0",
  "@vitest/ui": "^0.34.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

---

*Testing analysis: 2026-05-18*
