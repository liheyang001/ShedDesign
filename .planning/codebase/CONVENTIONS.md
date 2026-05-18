# Coding Conventions

**Analysis Date:** 2026-05-18

## Naming Patterns

**Files:**
- Components (React): PascalCase (e.g., `ImageUpload.tsx`, `UploadPage.tsx`)
- Services: camelCase (e.g., `api.ts`, `imageAnalyzer.ts`)
- Utilities and helpers: camelCase
- Configuration files: camelCase (e.g., `env.ts`)
- Type definition files: camelCase with `.ts` extension (e.g., `garden.ts`)

**Functions:**
- camelCase for all function and method names
- Example async functions: `uploadImage()`, `analyzeGardenImage()`, `handleUploadSuccess()`
- Event handlers: `handle[Action]` pattern (e.g., `handleFileChange()`, `handleUpload()`, `handleAnalysisComplete()`)
- Boolean-returning functions typically prefix with `is` or `has` (pattern observed but not consistently applied yet)

**Variables:**
- camelCase for all variable and constant declarations
- State variables follow `[thing]` pattern (e.g., `isLoading`, `error`, `preview`)
- Ref variables end with `Ref` (e.g., `fileRef`)
- Callback props use `on[Action]` naming (e.g., `onUploadSuccess`, `onAnalysisComplete`)

**Types:**
- PascalCase for interfaces and type aliases (e.g., `GardenAnalysis`, `UploadResponse`, `UserPreferences`)
- Union types for discriminated values (e.g., `'upload' | 'questionnaire' | 'result'` for `AppStep`)

## Code Style

**Formatting:**
- No enforced formatter currently (no ESLint, Prettier, or Biome config detected)
- Observed style: 2-space indentation
- Semicolons: consistently used throughout codebase
- Trailing commas: used in object/array literals
- Quotes: Single quotes in JavaScript/TypeScript, consistent throughout

**Linting:**
- No linting configuration detected
- TypeScript strict mode enabled in both `backend/tsconfig.json` and `frontend/tsconfig.json`

**Type Safety:**
- `strict: true` in TypeScript configuration enforces strict null checks, strict function types, and strict bind/call/apply
- Error handling uses `error instanceof Error` type guards (see `uploadController.ts`, `ImageUpload.tsx`)
- Type imports use explicit `type` keyword: `import type { GardenAnalysis } from './types/garden'`

## Import Organization

**Order:**
1. External library imports (React, Express, third-party packages)
2. Type imports from external packages (e.g., `import type { ... } from 'express'`)
3. Relative imports from project modules
4. Type imports from relative modules (e.g., `import type { GardenAnalysis } from './types/garden'`)

**Examples from codebase:**
- `backend/src/index.ts`: Libraries first (`express`, `cors`), then relative imports (`.js` extension required)
- `frontend/src/components/ImageUpload.tsx`: React hooks, then services, then type imports, then CSS
- `backend/src/services/imageAnalyzer.ts`: External SDK, file system, config, then type imports

**Path Aliases:**
- `@/*` mapped to `src/*` in both backend and frontend `tsconfig.json`
- Not actively used in current codebase (direct relative imports with `.js` extensions preferred in backend)

## Import Extensions

**Backend (Node.js with ESM):**
- MUST use `.js` extensions in all imports, even for `.ts` source files
- Required due to `"moduleResolution": "bundler"` in tsconfig
- Example: `import config from './config/env.js'`
- Applies to all relative imports in routes, controllers, services

**Frontend (Vite):**
- No file extensions required for imports (Vite handles resolution)
- Example: `import { ImageUpload } from '../components/ImageUpload'`

## Error Handling

**Pattern: Type Guard with Error Instanceof**
```typescript
// Backend example (uploadController.ts:30)
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : '图像处理失败'
  console.error('上传错误:', error)
  res.status(500).json({ error: message })
}
```

**Pattern: Axios Error Handling**
```typescript
// Frontend example (ImageUpload.tsx:40-42)
} catch (err: unknown) {
  const axiosError = err as { response?: { data?: { error?: string } } }
  setError(axiosError.response?.data?.error || '上传失败，请重试')
}
```

**HTTP Error Responses:**
- Errors returned as JSON: `{ error: 'message' }`
- Status codes: 400 (bad request), 404 (not found), 500 (server error)
- Development vs. production: In development, full error message; in production, generic message

## Logging

**Framework:** Native `console` (no logging library)

**Patterns:**
- `console.log()` for info-level logs with emoji indicators
- `console.warn()` for warnings (e.g., unset GEMINI_API_KEY)
- `console.error()` for errors with context

**Examples from codebase:**
- Info: `console.log('🚀 ShedDesign API Server 运行在 http://localhost:${config.port}')`
- Warn: `console.warn('⚠️ GEMINI_API_KEY 未设置，某些功能将不可用')`
- Warn: `console.warn('GEMINI_API_KEY 未设置，返回模拟分析数据')`
- Error: `console.error('Error:', err)` and `console.error('上传错误:', error)`

**Language:** Comments and log messages are primarily in Chinese (Simplified), with some English

## Comments

**When to Comment:**
- Configuration sections (e.g., multer setup explaining size limits)
- Complex logic (e.g., Gemini API prompt, base64 conversion)
- Business-critical decisions
- Environment variable warnings

**Example:** Detailed prompt in `imageAnalyzer.ts` explaining Gemini Vision analysis requirements

**JSDoc/TSDoc:**
- Not used in current codebase
- All functions lack JSDoc annotations

## Function Design

**Size:** Functions are generally small and focused
- Controllers: 5-25 lines (e.g., `uploadImage()` is 22 lines)
- Services: 15-35 lines (e.g., `analyzeGardenImage()` is 34 lines)
- Components: 20-50 lines (e.g., `ImageUpload` component is 89 lines with JSX)

**Parameters:**
- Destructuring used for function parameters (e.g., `{ onAnalysisComplete }` in component props)
- React event handlers follow TypeScript's `React.ChangeEvent<HTMLInputElement>` typing
- Express route handlers: explicit `(req: Request, res: Response)` typing

**Return Values:**
- Explicit return types used in function signatures
- Async functions return `Promise<T>`
- React components return JSX.Element (inferred)

## Module Design

**Exports:**
- Named exports for most functions and types
- Default exports for: main app files (`App.tsx`, `router`, `config`)
- Mix of both: `uploadController.ts` exports named functions, not default

**Pattern Examples:**
- Services export utility functions: `export async function analyzeGardenImage()`
- Types export interfaces: `export interface GardenAnalysis {}`
- Controllers export named handlers: `export async function uploadImage()`

**Barrel Files:**
- Not used in current structure
- Each component/service imports directly from its module

## CSS & Styling

**Framework:** Plain CSS (no CSS-in-JS or preprocessor)

**Naming Conventions:**
- kebab-case for CSS class names (e.g., `.upload-container`, `.submit-btn`, `.analysis-grid`)
- Component-scoped: CSS files named to match component (e.g., `ImageUpload.css` for `ImageUpload.tsx`)
- BEM-inspired: Child element selectors (e.g., `.upload-area`, `.upload-label`, `.upload-icon`)

**Patterns:**
- Flexbox for layouts (`.steps`, `.upload-area`, `.preview-section`)
- CSS Grid for responsive layouts (`.analysis-grid` with `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`)
- Transitions for smooth interactions (`transition: all 0.3s ease`)
- Gradient backgrounds (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)

**Color Values:**
- Hex colors for brand palette (#667eea, #764ba2 for primary purple gradient)
- Hex for text (#333, #666, #999)
- Named CSS functions: `rgba(255,255,255,0.15)` for transparency

**Organization:**
- Global styles in `App.css` (body reset, typography, layout)
- Component-specific styles in dedicated CSS files
- No CSS variables or theming system used
- Animations defined inline (e.g., `@keyframes slideIn` in `UploadPage.css`)

## React Patterns

**Hooks:**
- `useState` for component state
- `useRef` for file input reference tracking
- `useState` with explicit typing: `const [state, setState] = useState<Type | null>(null)`

**Props:**
- Props defined as interfaces ending with `Props` (e.g., `ImageUploadProps`, `UploadPageProps`)
- Destructured in function parameters

**Event Handlers:**
- Named `handle[Action]` pattern
- Arrow functions with explicit parameter types

**Components:**
- Functional components (no class components)
- Components named with PascalCase
- Default exports for page/layout components, named exports for utility components

## State Management

**Pattern:** React `useState` with callback props pattern
- Parent component holds shared state
- Props passed down to children (e.g., `onUploadSuccess`, `onAnalysisComplete`)
- No global state management (Redux, Zustand, etc.)
- No Context API usage observed

## Type Definitions Location

**Shared Types:**
- `backend/src/types/garden.ts`: Backend source of truth
- `frontend/src/types/garden.ts`: Manual copy maintained in sync (per CLAUDE.md)
- Frontend types may diverge slightly: e.g., string types instead of literal unions for sunlight values

---

*Convention analysis: 2026-05-18*
