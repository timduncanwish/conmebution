# Conmebution YouTube MVP Design Document

**Date:** 2025-03-10
**Author:** Claude Code & User Collaboration
**Status:** Approved
**Version:** 1.0

---

## 1. Overview

### 1.1 Goal
Build an end-to-end AI content generation and YouTube publishing system as the first MVP platform.

### 1.2 Scope
- **AI Content Generation:** Text (articles), Images (thumbnails), Videos (short videos)
- **YouTube Integration:** OAuth authentication, article publishing, video uploading
- **User Experience:** Both one-click mode and advanced step-by-step mode
- **Multi-AI Support:** User-configurable AI services (GLM-4.7, OpenAI, Gemini)

### 1.3 Success Criteria
- Text generation success rate > 95%
- YouTube publishing success rate > 90%
- End-to-end workflow < 5 minutes
- All errors have user-friendly Chinese messages
- Real-time progress feedback for all operations

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  - Content Creation Wizard              │
│  - Generation Preview Panel             │
│  - YouTube Publish Dialog               │
│  - WebSocket Client                     │
└─────────────────────────────────────────┘
              ↕ API + WebSocket
┌─────────────────────────────────────────┐
│         Backend (Express)               │
│  - REST API                             │
│  - WebSocket Server                     │
│  - Bull Task Queue                      │
└─────────────────────────────────────────┘
      ↓         ↓         ↓         ↓
┌─────────┐ ┌───────┐ ┌──────┐ ┌─────────┐
│AI Engine│ │Storage│ │YouTube│ │Workflow │
│         │ │Service│ │Service│ │Engine   │
│- GLM    │ │-Local │ │-OAuth │ │- Tasks  │
│- OpenAI │ │-OSS   │ │-Upload│ │- State  │
│- Gemini │ │-AWS   │ │-Quota │ │- Retry  │
└─────────┘ └───────┘ └──────┘ └─────────┘
              ↓
┌─────────────────────────────────────────┐
│         Database (Prisma + SQLite)      │
│  - Users, ContentHistory                │
│  - PlatformCredentials, Tasks           │
└─────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- next-intl (i18n)
- WebSocket client

**Backend:**
- Node.js 25+
- Express 5
- TypeScript
- Prisma ORM
- Bull (task queue)
- WebSocket (ws)
- Winston (logging)

**Storage:**
- Abstract storage interface
- Local / OSS / AWS S3

**AI Services:**
- GLM-4.7 (primary)
- OpenAI GPT-4
- Gemini Pro
- DALL-E 3
- Seedance 2.0

---

## 3. Core Components

### 3.1 Frontend Components

#### ContentCreationWizard
- Multi-line text input (max 500 chars)
- Content type selector (text/image/video/all)
- AI service selector (dynamic, user-configured)
- Mode switcher (simple/advanced)
- Quick template area
- Cost estimation display

#### GenerationPreviewPanel
- Text editor (rich text, word count)
- Image preview grid (regenerate, download)
- Video player (preview, download MP4)
- Cost display (actual cost)
- Action buttons (regenerate, save draft, publish)

#### YouTubePublishDialog
- OAuth login button (popup window)
- Account info display
- Publishing options (title, description, tags, privacy)
- Publishing preview (simulated YouTube display)
- Scheduled publishing time picker

### 3.2 Backend Services

#### AIService
```typescript
interface AIService {
  generateText(prompt: string, options: GenerateOptions): Promise<TextResult>
  generateImage(prompt: string, options: ImageOptions): Promise<ImageResult>
  generateVideo(prompt: string, options: VideoOptions): Promise<VideoResult>
  estimateCost(type: string, prompt: string): Promise<CostEstimate>
}
```

#### StorageService
```typescript
interface StorageService {
  upload(file: File, path: string): Promise<string>
  download(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
  getUrl(path: string): string
}
```

#### YouTubeService
```typescript
interface YouTubeService {
  getAuthUrl(): Promise<string>
  handleCallback(code: string): Promise<TokenPair>
  uploadVideo(video: Video, metadata: Metadata): Promise<UploadResult>
  postArticle(content: Article): Promise<PostResult>
  checkQuota(): Promise<QuotaInfo>
}
```

---

## 4. API Endpoints

### 4.1 Content Generation
```
POST /api/generate/text
  Request: { prompt, aiService, options }
  Response: { taskId, status }

POST /api/generate/image
  Request: { prompt, aiService, style, count }
  Response: { taskId, status }

POST /api/generate/video
  Request: { prompt, aiService, duration, style }
  Response: { taskId, status }

POST /api/generate/all
  Request: { prompt, aiServices }
  Response: { taskId, status }

GET /api/estimate-cost
  Query: ?type=text&prompt=...
  Response: { cost, breakdown }
```

### 4.2 Task Status
```
GET /api/tasks/:taskId
  Response: { status, progress, currentStep, result, error }

WS /api/tasks/:taskId/ws
  Real-time progress updates
```

### 4.3 YouTube Integration
```
GET /api/youtube/auth
  Response: { authUrl }

POST /api/youtube/callback
  Request: { code, state }
  Response: { success, accountInfo }

POST /api/youtube/upload
  Request: { videoPath, title, description, tags }
  Response: { taskId }

POST /api/youtube/post
  Request: { content, title }
  Response: { postId, url }

GET /api/youtube/quota
  Response: { used, limit, resetTime }
```

---

## 5. Data Models

### 5.1 Enhanced ContentHistory
```typescript
{
  generatedContent: {
    text: {
      versions: string[],
      selected: number,
      wordCount: number
    },
    images: Array<{
      path: string,
      url: string,
      style: string,
      size: { width, height }
    }>,
    videos: Array<{
      path: string,
      url: string,
      duration: number,
      resolution: string
    }>
  },
  costBreakdown: {
    text: number,
    images: number,
    videos: number,
    total: number
  }
}
```

### 5.2 Task Tracking
```typescript
{
  id: string,
  type: 'generate-text' | 'generate-image' | 'generate-video' | 'youtube-upload',
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: 0-100,
  currentStep: string,
  result?: any,
  error?: {
    type: ErrorType,
    message: string,
    retryable: boolean
  },
  retryCount: number,
  startedAt: Date,
  completedAt?: Date
}
```

---

## 6. Error Handling

### 6.1 Error Types
```typescript
enum ErrorType {
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  QUOTA_ERROR = 'QUOTA_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### 6.2 Retry Strategy
```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000,
  retryableErrors: [
    'NETWORK_ERROR',
    'AI_SERVICE_ERROR',
    'RATE_LIMIT_ERROR'
  ]
}
```

### 6.3 AI Fallback Chain
```typescript
const AI_FALLBACK_CHAIN = {
  text: ['glm-4', 'gpt-4', 'gemini-pro'],
  image: ['dalle-3', 'stable-diffusion'],
  video: ['seedance-2.0', 'runway-ml']
}
```

---

## 7. Implementation Phases

### Phase 1.1 - Core Generation (Week 2)
- AI service configuration UI
- Text generation API with multi-service support
- Cost estimation API
- Content creation wizard UI
- WebSocket progress推送

### Phase 1.2 - Multi-modal Generation (Week 3)
- Image generation (DALL-E 3)
- Video generation (Seedance 2.0)
- One-click generate all
- Generation preview page

### Phase 1.3 - YouTube Publishing (Week 4)
- YouTube OAuth 2.0 (popup)
- Article publishing (Community Posts)
- Video upload (async + progress)
- Publishing status tracking

---

## 8. Security & Compliance

### 8.1 Data Security
- All API keys encrypted (AES-256)
- Platform credentials encrypted
- HTTPS only in production
- Regular security audits

### 8.2 OAuth Security
- PKCE flow for YouTube OAuth
- Short-lived access tokens (1 hour)
- Secure token refresh mechanism
- CSRF protection

### 8.3 Privacy
- User data isolation
- Auto-cleanup after 30 days (unless saved)
- GDPR compliance
- Clear data retention policy

---

## 9. Cost Optimization

### 9.1 Cost Estimation
- Pre-generation cost estimate
- User confirmation before generation
- Real-time cost tracking
- Monthly budget alerts

### 9.2 Smart AI Selection
- Automatic cost-based selection
- Prefer GLM-4 (best value)
- Use free tiers when available
- Cache similar prompts

---

## 10. Testing Strategy

### 10.1 Unit Tests
- AI service switching
- Storage abstraction
- Error handling
- Cost calculation

### 10.2 Integration Tests
- YouTube OAuth flow
- Video upload process
- Article publishing
- Task queue processing

### 10.3 E2E Tests
- Complete workflow (generate → preview → publish)
- Error recovery
- Fallback mechanisms
- Multi-platform scenarios

---

## 11. Deployment

### 11.1 Development
```bash
# Frontend
cd frontend && npm run dev  # localhost:3000

# Backend
cd backend && npm run dev    # localhost:4000
```

### 11.2 Production
- Frontend: Vercel
- Backend: Railway / Render
- Database: PostgreSQL (cloud)
- Storage: Aliyun OSS / AWS S3
- Redis: Bull queue (cloud)

---

## 12. Monitoring & Logging

### 12.1 Metrics
- AI service response times
- Generation success rates
- YouTube upload success rates
- Cost per content type
- User session duration

### 12.2 Logging
- Structured logging (Winston)
- Log levels: error, warn, info, debug
- Sensitive data redaction
- Centralized log aggregation

### 12.3 Alerts
- AI service failures
- YouTube quota exceeded
- High error rates
- Unusual cost spikes

---

## Appendix A: Technology Choices Rationale

### Why Next.js 15?
- Latest App Router with server components
- Built-in API routes for BFF pattern
- Excellent developer experience
- Strong community support

### Why Express over Fastify?
- Simpler learning curve
- More middleware options
- Better compatibility with existing libraries

### Why Bull over Agenda?
- Better Redis support
- More active development
- Built-in retry mechanisms
- Better UI (Bull Board)

### Why SQLite for Development?
- Zero configuration
- Fast prototyping
- Easy to migrate to PostgreSQL
- Prisma supports seamless migration

---

## Appendix B: Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI service downtime | High | Medium | Multiple AI providers with fallback |
| YouTube API changes | High | Low | Version锁定, 监控API announcements |
| Cost overrun | Medium | Medium | Pre-estimation, budget caps |
| Large upload timeouts | Medium | High | Async tasks with resumable uploads |
| OAuth token expiration | Low | Medium | Auto-refresh with retry logic |

---

**End of Design Document**
