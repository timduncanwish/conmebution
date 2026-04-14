# Conmebution — 技术规格 (SPEC)

**版本:** v1.0
**日期:** 2026-04-09
**对应 PRD:** v2.0

---

## 1. 系统概览

### 1.1 服务组成

| 服务 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| Frontend | Next.js 15 + TypeScript | 3001 | App Router, SSR |
| Backend | Express + TypeScript | 4000 | REST API |
| Database | SQLite (dev) / PostgreSQL (prod) | — | Prisma ORM |

### 1.2 目录结构

```
E:/conmebution/
├── frontend/
│   ├── app/
│   │   ├── [locale]/           # i18n 路由
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── create/         # 内容创作
│   │   │   ├── publish/        # 平台发布
│   │   │   ├── content/        # 内容库
│   │   │   ├── analytics/      # 数据分析
│   │   │   ├── templates/      # 模板管理
│   │   │   ├── settings/       # 系统设置
│   │   │   └── test-api/       # API 测试页
│   │   ├── components/         # 共享组件
│   │   │   ├── Navigation.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   ├── ResponsiveLayout.tsx
│   │   │   ├── OptimizedImage.tsx
│   │   │   └── TouchOptimizations.tsx
│   │   └── lib/
│   │       ├── api.ts          # API 客户端
│   │       ├── api-cache.ts    # 缓存层
│   │       └── dynamic-components.ts
│   └── messages/               # i18n 翻译
│       ├── zh.json
│       └── en.json
│
├── backend/
│   ├── src/
│   │   ├── config/             # 环境变量验证 (Zod)
│   │   ├── routes/             # API 路由
│   │   ├── services/
│   │   │   ├── ai/             # AI 服务
│   │   │   │   ├── ai-manager.service.ts  # 统一管理 + fallback
│   │   │   │   ├── base.service.ts        # 抽象基类
│   │   │   │   ├── glm.service.ts         # GLM-4
│   │   │   │   ├── openai.service.ts      # GPT-4
│   │   │   │   ├── gemini.service.ts      # Gemini Pro
│   │   │   │   ├── doubao.service.ts      # 豆包
│   │   │   │   ├── mock.service.ts        # Mock (开发)
│   │   │   │   ├── image-generation.ts    # DALL-E
│   │   │   │   ├── video-generation.ts    # Seedance + HeyGen
│   │   │   │   └── providers/             # provider 注册
│   │   │   ├── platforms/      # 平台分发
│   │   │   │   ├── index.ts              # 分发服务
│   │   │   │   ├── batch-publisher.service.ts  # 批量发布
│   │   │   │   └── adapters/
│   │   │   │       ├── base.adapter.ts   # 适配器基类
│   │   │   │       ├── mock.adapter.ts   # Mock 适配器
│   │   │   │       ├── china/            # 国内平台
│   │   │   │       │   ├── bilibili.adapter.ts
│   │   │   │       │   ├── douyin.adapter.ts
│   │   │   │       │   ├── wechat-channel.adapter.ts
│   │   │   │       │   ├── wechat-mp.adapter.ts
│   │   │   │       │   └── xiaohongshu.adapter.ts
│   │   │   │       └── international/    # 国际平台
│   │   │   │           ├── youtube.adapter.ts
│   │   │   │           ├── twitter.adapter.ts
│   │   │   │           └── medium.adapter.ts
│   │   │   ├── queue/          # 任务队列
│   │   │   ├── storage/        # 文件存储
│   │   │   ├── websocket/      # WebSocket
│   │   │   └── workflow/       # 工作流引擎
│   │   └── utils/
│   │       └── logger.ts       # 日志工具
│   ├── prisma/
│   │   ├── schema.prisma       # 数据模型 (7 表)
│   │   ├── seed.ts             # 种子数据
│   │   └── dev.db              # SQLite 数据库
│   └── .env                    # 环境变量
│
├── PRD.md                      # 产品需求文档
├── SPEC.md                     # 技术规格 (本文件)
└── CLAUDE.md                   # AI 助手工作指南
```

---

## 2. API 规格

### 2.1 基础

- **Base URL:** `http://localhost:4000/api`
- **Content-Type:** `application/json`
- **认证:** JWT Bearer Token (待实现)

### 2.2 端点清单

#### 健康检查

```
GET /api/health
Response: { status: "ok", uptime, timestamp }
```

#### AI 内容生成

```
POST /api/generate/text/sync
Body: { prompt: string, provider?: "glm-4"|"gpt-4"|"gemini-pro"|"doubao", options?: GenerateTextOptions }
Response: { content: string, provider: string, tokens: number, cost: number }
```

```
GET /api/generate/cost?prompt=xxx&provider=xxx
Response: { estimatedCost: number, tokens: number, provider: string }
```

#### 平台分发

```
POST /api/platforms/batch/publish
Body: {
  content: { title, description, mediaUrls, tags },
  platforms: PlatformType[],
  credentials: Map<PlatformType, PlatformCredentials>
}
Response: { taskId: string, results: DistributionResult[] }
```

```
GET /api/platforms/batch/status/:taskId
Response: { taskId, status, results: DistributionResult[], completedAt }
```

```
GET /api/platforms/batch/statistics
Response: { totalPublished, successRate, platformStats }
```

```
GET /api/platforms/batch/history
Response: DistributionRecord[]
```

```
POST /api/platforms/test/publish
Body: { platform: string, content: { title, description } }
Response: { success, platformPostId, platformUrl }
```

#### 内容管理

```
GET    /api/content              # 内容列表
POST   /api/content              # 创建内容
GET    /api/content/:id          # 内容详情
PUT    /api/content/:id          # 更新内容
DELETE /api/content/:id          # 删除内容
```

#### 模板

```
GET    /api/templates            # 模板列表
POST   /api/templates            # 创建模板
PUT    /api/templates/:id        # 更新模板
DELETE /api/templates/:id        # 删除模板
```

---

## 3. AI 服务集成规格

### 3.1 服务接口

```typescript
interface BaseAIService {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
  estimateCost(prompt: string): Promise<CostEstimate>;
  isAvailable(): boolean;
  getProviderName(): string;
}

interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  style?: 'formal' | 'casual' | 'humorous' | 'professional';
  language?: 'zh' | 'en';
}

interface TextGenerationResult {
  content: string;
  tokens: number;
  cost: number;
  provider: string;
}

interface CostEstimate {
  estimatedCost: number;
  tokens: number;
  currency: string;
}
```

### 3.2 Provider 配置

| Provider | 环境变量 | Fallback 链 |
|----------|----------|-------------|
| GLM-4 | `GLM_API_KEY` | Doubao → GPT-4 → Gemini |
| Doubao | `DOUBAO_API_KEY` | GLM-4 → GPT-4 → Gemini |
| GPT-4 | `OPENAI_API_KEY` | Doubao → GLM-4 → Gemini |
| Gemini Pro | `GEMINI_API_KEY` | Doubao → GLM-4 → GPT-4 |
| Mock | `USE_MOCK_AI=true` | — |

### 3.3 Mock 模式

- 由 `USE_MOCK_AI` 环境变量控制（默认 `true`）
- Mock 服务返回预设内容（根据提示词关键词匹配）
- Mock 适配器模拟平台发布成功
- 生产环境应设为 `false`

---

## 4. 平台适配器规格

### 4.1 适配器接口

```typescript
abstract class BasePlatformAdapter {
  abstract validateCredentials(): Promise<boolean>;
  abstract publishContent(content: PlatformContent): Promise<PublishResult>;
  abstract getContentStatus(postId: string): Promise<ContentStatus>;
  abstract deleteContent(postId: string): Promise<boolean>;

  // 平台配置
  getPlatformCode(): string;
  getPlatformConfig(): PlatformConfig;
}

interface PlatformConfig {
  platformCode: string;
  platformName: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  supportedMediaTypes: ('image' | 'video' | 'text')[];
  maxMediaCount: number;
  maxVideoDuration?: number;  // 秒
  maxImageSize?: number;      // 字节
  maxVideoSize?: number;      // 字节
}
```

### 4.2 平台限制参考

| 平台 | 最大标题 | 最大描述 | 媒体类型 | 最大视频时长 |
|------|----------|----------|----------|-------------|
| B 站 | 80 字 | 250 字 | 视频 | 无限制 |
| 抖音 | 55 字 | 100 字 | 视频 | 15 min |
| 小红书 | 20 字 | 1000 字 | 图文/视频 | 15 min |
| 微信公众号 | 64 字 | 20000 字 | 图文 | — |
| 微信视频号 | 30 字 | 1000 字 | 视频 | 30 min |
| YouTube | 100 字符 | 5000 字符 | 视频 | 12 hr |
| Twitter | — | 280 字符 | 图文/视频 | 2m20s |
| Medium | — | 无限制 | 文字 | — |

### 4.3 批量发布引擎

```
BatchPublisherService
  ├── 并行发布到多个平台 (Promise.allSettled)
  ├── 每个平台独立状态追踪
  ├── 发布结果入库 (DistributionRecord)
  └── WebSocket 实时推送进度
```

---

## 5. 数据模型

### 5.1 Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  language  String   @default("zh")
  // ... 5 个关联关系
}

model ContentTemplate {
  id             String   @id @default(cuid())
  userId         String
  name           String
  type           String   // text | image | video | all
  promptTemplate String
  aiProvider     String
  // ...
}

model ContentHistory {
  id                String   @id @default(cuid())
  userId            String
  prompt            String
  type              String   // text | image | video | all
  generatedContent  String   // JSON
  aiProvider        String
  cost              Int?
  status            String   @default("draft") // draft | generated | published
  // ...
}

model PlatformCredential {
  id           String   @id @default(cuid())
  userId       String
  platform     String
  accessToken  String   // 加密存储
  // ...
}

model DistributionRecord {
  id              String    @id @default(cuid())
  contentId       String
  userId          String
  platform        String
  status          String    // pending | success | failed
  platformUrl     String?
  // ...
}

model WorkflowTask {
  id           String   @id @default(cuid())
  userId       String
  workflowType String
  status       String   @default("pending") // pending | running | completed | failed
  // ...
}

model ScheduledPost {
  id            String   @id @default(cuid())
  userId        String
  contentId     String
  platforms     String   // JSON
  scheduledTime DateTime
  status        String   @default("pending") // pending | sent | failed | cancelled
  // ...
}
```

### 5.2 ER 关系

```
User (1) ──< (N) ContentTemplate
User (1) ──< (N) ContentHistory
User (1) ──< (N) PlatformCredential
User (1) ──< (N) WorkflowTask
User (1) ──< (N) ScheduledPost

ContentTemplate (1) ──< (N) ContentHistory
ContentHistory  (1) ──< (N) DistributionRecord
ContentHistory  (1) ──< (N) ScheduledPost
```

---

## 6. 环境配置

### 6.1 后端 .env

```env
# 服务
PORT=4000
NODE_ENV=development
DATABASE_URL=file:./dev.db

# AI 服务 (留空则使用 Mock)
GLM_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
DOUBAO_API_KEY=
USE_MOCK_AI=true

# 存储
STORAGE_TYPE=local
UPLOAD_PATH=./uploads

# Redis (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 6.2 前端配置

- Next.js 运行于端口 3001
- API 代理到后端 4000 端口
- 国际化路由: `/zh/*` 和 `/en/*`

---

## 7. 实现状态矩阵

### 7.1 后端

| 模块 | 文件 | 实现状态 | Mock/Real |
|------|------|----------|-----------|
| AI Manager | `ai-manager.service.ts` | ✅ 完整 | Mock (默认) |
| GLM Provider | `glm.service.ts` | ✅ 架构 | Mock |
| OpenAI Provider | `openai.service.ts` | ✅ 架构 | Mock |
| Gemini Provider | `gemini.service.ts` | ✅ 架构 | Mock |
| Doubao Provider | `doubao.service.ts` | ✅ 架构 | Mock |
| 图片生成 | `image-generation.ts` | ✅ 架构 | Mock |
| 视频生成 | `video-generation.ts` | ✅ 架构 | Mock |
| 平台分发服务 | `platforms/index.ts` | ✅ 完整 | Mock |
| 批量发布 | `batch-publisher.service.ts` | ✅ 完整 | Mock |
| B 站适配器 | `bilibili.adapter.ts` | ✅ 完整 | Mock |
| 抖音适配器 | `douyin.adapter.ts` | ✅ 完整 | Mock |
| 小红书适配器 | `xiaohongshu.adapter.ts` | ✅ 完整 | Mock |
| 微信公众号适配器 | `wechat-mp.adapter.ts` | ✅ 完整 | Mock |
| 微信视频号适配器 | `wechat-channel.adapter.ts` | ✅ 完整 | Mock |
| YouTube 适配器 | `youtube.adapter.ts` | ✅ 完整 | Mock |
| Twitter 适配器 | `twitter.adapter.ts` | ✅ 完整 | Mock |
| Medium 适配器 | `medium.adapter.ts` | ✅ 完整 | Mock |
| 任务队列 | `queue/` | ✅ 架构 | — |
| 文件存储 | `storage/` | ✅ 架构 | — |
| WebSocket | `websocket/` | ✅ 架构 | — |
| 工作流引擎 | `workflow/` | ✅ 架构 | — |
| 数据库 | `prisma/schema.prisma` | ✅ 完整 | SQLite |
| 配置验证 | `config/index.ts` | ✅ 完整 | Zod |
| 用户认证 | — | ❌ 未实现 | — |

### 7.2 前端

| 页面 | 路径 | 实现状态 |
|------|------|----------|
| Dashboard | `[locale]/page.tsx` | ✅ |
| 内容创作 | `[locale]/create/` | ✅ |
| 平台发布 | `[locale]/publish/` | ✅ |
| 内容库 | `[locale]/content/` | ✅ |
| 数据分析 | `[locale]/analytics/` | ✅ (假数据) |
| 模板管理 | `[locale]/templates/` | ✅ |
| 系统设置 | `[locale]/settings/` | ✅ |
| API 测试 | `[locale]/test-api/` | ✅ |

---

## 8. 待实现规格 (Phase 0 优先级)

### 8.1 用户认证

```
POST /api/auth/register  → { email, password, name } → { user, token }
POST /api/auth/login     → { email, password }       → { user, token }
GET  /api/auth/me        → Bearer token              → { user }

JWT payload: { userId, email }
中间件: auth middleware 验证 Bearer token
密码: bcrypt hash
```

### 8.2 真实 AI 接入

```
当 USE_MOCK_AI=false 且对应 API_KEY 非空时:
- AIServiceManager 初始化真实 provider
- generateText() 调用真实 HTTP API
- 错误时按 fallback chain 切换 provider
- 成本按实际 token 用量计算
```

### 8.3 文件存储

```
POST /api/upload          → multipart/form-data → { url, filename, size }
GET  /api/files/:id       → 文件下载

存储策略:
- 开发: 本地 ./uploads/ 目录
- 生产: S3 / OSS
- 由 STORAGE_TYPE 环境变量控制
```

### 8.4 真实平台发布

```
当平台 credentials 有效时:
- 使用真实 adapter 调用平台 API
- OAuth 2.0 流程获取 access_token
- 发布结果写入 DistributionRecord
- 发布失败自动重试 (最多 3 次)
```

---

## 9. 运行与测试

### 9.1 启动

```bash
# 后端
cd backend && npm run dev    # 端口 4000

# 前端
cd frontend && npm run dev   # 端口 3001
```

### 9.2 健康检查

```bash
curl http://localhost:4000/api/health
```

### 9.3 Mock 模式测试

```bash
# 文本生成 (Mock)
curl -X POST http://localhost:4000/api/generate/text/sync \
  -H "Content-Type: application/json" \
  -d '{"prompt":"iPhone 16 评测"}'

# 平台发布 (Mock)
curl -X POST http://localhost:4000/api/platforms/test/publish \
  -H "Content-Type: application/json" \
  -d '{"platform":"bilibili","content":{"title":"测试","description":"内容"}}'
```
