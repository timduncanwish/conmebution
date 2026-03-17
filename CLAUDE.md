# Conmebution - AI内容自动化创作与分发系统

> **项目状态**: ✅ MVP完成 (99.5%) | **最后更新**: 2026-03-13
> **GitHub**: https://github.com/timduncanwish/conmebution

---

## 🎯 项目概述

**Conmebution** (Content + Media + Distribution) 是一个AI驱动的内容自动化创作与分发系统。

### 核心功能
- **AI内容生成**: 文案、图片、视频自动生成
- **多平台分发**: 一键发布到8+国内外平台
- **中英双语**: 完整国际化支持
- **智能成本控制**: 自动选择最优AI服务

### 核心流程
```
提示词输入 → AI生成(文案+图片+视频) → 内容预览 → 多平台分发
```

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **国际化**: next-intl (中英双语)

### 后端
- **运行时**: Node.js 25+
- **框架**: Express
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: SQLite (开发) / PostgreSQL (生产)

### AI服务
- **文案**: GLM-4.7 (主力) / OpenAI GPT-4 / Gemini Pro
- **图片**: DALL-E 3 / Stable Diffusion
- **视频**: Seedance 2.0 (主力) / HeyGen / 可灵 / Runway ML

### 支持平台
**国内 (5个)**: 抖音、B站、微信视频号、微信公众号、小红书
**国际 (3个)**: YouTube、Twitter/X、Medium

---

## 📁 项目结构

```
E:/conmebution/
├── frontend/                 # Next.js前端应用
│   ├── app/
│   │   ├── [locale]/        # 国际化路由
│   │   │   ├── page.tsx     # 首页/Dashboard
│   │   │   ├── create/      # 内容创作页面
│   │   │   ├── publish/     # 平台发布页面
│   │   │   ├── analytics/   # 数据分析页面
│   │   │   ├── templates/   # 模板管理页面
│   │   │   └── settings/    # 系统设置页面
│   │   ├── components/      # React组件
│   │   ├── lib/             # 工具库和API客户端
│   │   └── messages/        # 国际化翻译文件
│   └── package.json
│
├── backend/                  # Express后端服务
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── services/        # 业务逻辑
│   │   │   ├── ai/          # AI服务集成
│   │   │   └── platforms/   # 平台适配器
│   │   ├── lib/             # 工具库
│   │   └── middleware/      # 中间件
│   ├── prisma/              # 数据库Schema
│   ├── logs/                # 日志文件
│   └── package.json
│
├── docs/                     # 项目文档
├── PRD.md                    # 产品需求文档
├── README.md                 # 项目说明
├── CLAUDE.md                 # 本文件 - AI助手工作指南
├── DAILY_PROGRESS_*.md       # 每日进度记录
└── PROJECT_STATUS.md         # 项目状态总览
```

---

## 🚀 快速启动

### 启动服务器

```bash
# 后端 (端口 4000)
cd backend
PORT=4000 npm run dev

# 前端 (端口 3001)
cd frontend
npm run dev
```

### 访问地址
- **前端**: http://localhost:3001
- **后端**: http://localhost:4000
- **API健康检查**: http://localhost:4000/api/health

---

## 📊 当前状态 (2026-03-13)

### 完成度: **99.5%** 🎉

#### ✅ 已完成
- 后端API服务 (100%)
- AI服务集成架构 (100%)
- Mock AI服务 (无需真实API密钥)
- 8个平台适配器 (100%)
- 批量发布系统 (100%)
- 前端用户界面 (99.5%)
- 数据库系统 (100%)
- 国际化支持 (100%)

#### 🔧 当前模式
- **Mock AI模式**: 已启用（演示模式，无需API密钥）
- **Mock平台模式**: 已启用（无需真实平台凭证）

#### ⏳ 剩余工作
- 数据分析页面优化
- 动画效果增强
- 响应式优化
- 性能微调

---

## 🎨 开发约定

### 代码规范
- **TypeScript**: 严格模式，所有文件必须类型完整
- **前端**: React函数组件 + Hooks
- **后端**: Express + TypeScript类和服务层架构
- **样式**: Tailwind CSS实用类优先
- **国际化**: 所有用户可见文本必须使用 `t()` 函数

### 命名约定
- **组件**: PascalCase (例: `Navigation.tsx`)
- **函数**: camelCase (例: `generateContent`)
- **常量**: UPPER_SNAKE_CASE (例: `API_BASE_URL`)
- **文件**: kebab-case (例: `content-service.ts`)

### Git提交规范
```bash
# 格式
git commit -m "type: description

- 详细变更1
- 详细变更2

完成度: XX% → XX%"
```

**类型**: feat | fix | docs | style | refactor | test | chore

---

## 📋 重要文件说明

### 核心文档
| 文件 | 说明 |
|------|------|
| `PRD.md` | 完整产品需求文档 |
| `README.md` | 项目说明和快速开始 |
| `PROJECT_STATUS.md` | 当前项目状态总览 |
| `PROGRESS.md` | **主进度文档（持续更新）** ⭐ |
| `CLAUDE.md` | AI助手工作指南（本文件） |

### 配置文件
| 文件 | 说明 |
|------|------|
| `frontend/next.config.js` | Next.js配置 |
| `frontend/tailwind.config.js` | Tailwind样式配置 |
| `frontend/messages/zh.json` | 中文翻译 |
| `frontend/messages/en.json` | 英文翻译 |
| `backend/.env` | 后端环境变量 |
| `backend/prisma/schema.prisma` | 数据库模型 |

### 关键代码文件
| 文件 | 说明 |
|------|------|
| `frontend/app/lib/api.ts` | 前端API客户端 |
| `backend/src/routes/index.ts` | API路由入口 |
| `backend/src/services/ai/` | AI服务集成 |
| `backend/src/services/platforms/` | 平台适配器 |

---

## 🎯 下一步工作

根据 `PROGRESS.md` 中的计划：

### 优先级 1: 用户体验精细打磨 ⏰ 2-3小时
- [ ] 添加页面过渡动画
- [ ] 优化加载动画效果
- [ ] 改进交互动画流畅度
- [ ] 添加微交互动画
- [ ] 进一步优化移动端适配

### 优先级 2: 功能完善 ⏰ 2-3小时
- [ ] 完善数据可视化（分析页面）
- [ ] 添加更多图表类型
- [ ] 实现数据导出功能
- [ ] 添加自定义报表
- [ ] 实现内容批量操作
- [ ] 添加高级搜索功能

### 优先级 3: 性能优化 ⏰ 1-2小时
- [ ] 代码分割优化
- [ ] 图片懒加载
- [ ] API响应缓存
- [ ] 静态资源压缩

### 优先级 4: 文档与部署 ⏰ 1-2小时
- [ ] 完善用户使用手册
- [ ] 创建API文档
- [ ] 编写部署指南
- [ ] 准备演示材料

---

## 🔍 问题排查

### 常见问题

**1. 前端页面404**
```bash
# 检查Next.js构建
cd frontend
rm -rf .next
npm run dev
```

**2. 后端API无响应**
```bash
# 检查后端服务
cd backend
curl http://localhost:4000/api/health
```

**3. 类型错误**
```bash
# 重新生成类型
cd frontend
npx tsc --noEmit
```

**4. 数据库连接问题**
```bash
# 重新生成Prisma客户端
cd backend
npx prisma generate
npx prisma db push
```

---

## 💡 工作流程建议

### 每日工作流程
1. **启动** → 运行服务器
2. **同步** → 查看 `DAILY_PROGRESS_*.md` 了解昨日进度
3. **计划** → 查看 `TOMORROW_PLAN.md` 确认今日任务
4. **开发** → 按优先级完成任务
5. **测试** → 验证功能正常
6. **提交** → Git commit with detailed message
7. **更新** → 更新今日进度文档

### 每日结束前
- [ ] 更新 `DAILY_PROGRESS_YYYY-MM-DD.md`
- [ ] 创建/更新 `TOMORROW_PLAN.md`
- [ ] 提交代码到Git
- [ ] 更新 `PROJECT_STATUS.md`

---

## 🎖️ 项目亮点

### 技术亮点
- 🌟 完整的TypeScript类型安全
- 🌟 可扩展的平台适配器架构
- 🌟 智能AI服务成本估算
- 🌟 Mock模式支持（无需真实API即可演示）
- 🌟 并发批量发布系统

### 业务亮点
- 🎯 8个平台支持（国内外）
- 🎯 中英双语完整支持
- 🎯 智能成本控制（1元/秒视频生成）
- 🎯 完整的内容管理流程

---

## 📞 联系信息

- **项目位置**: E:\conmebution
- **Git仓库**: https://github.com/timduncanwish/conmebution
- **邮箱**: timduncanwish@gmail.com

---

## 📚 快速参考

### Mock模式API测试

```bash
# AI内容生成
curl -X POST http://localhost:4000/api/generate/text/sync \
  -H "Content-Type: application/json" \
  -d '{"prompt":"iPhone 16 Pro Max评测","provider":"glm-4"}'

# 平台发布测试
curl -X POST http://localhost:4000/api/platforms/test/publish \
  -H "Content-Type: application/json" \
  -d '{"platform":"bilibili","content":{"title":"测试","description":"内容"}}'
```

### 有用的命令

```bash
# 查看项目状态
cat E:/conmebution/PROJECT_STATUS.md

# 查看最新进度
cat E:/conmebution/DAILY_PROGRESS_2026-03-13.md

# 查看明日计划
cat E:/conmebution/TOMORROW_PLAN.md

# Git状态
git status

# 运行测试
npm test

# 类型检查
npx tsc --noEmit
```

---

**最后更新**: 2026-03-17
**维护者**: Claude AI Assistant
**版本**: v1.0
