# Conmebution - AI内容自动化创作与分发系统

<div align="center">

**Content + Media + Distribution**

一个AI驱动的内容自动化创作与分发系统，用户只需输入简单提示词，系统即可自动生成文案、图片、视频，并一键分发到多个国内外社交媒体平台。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRD](https://img.shields.io/badge/文档-PRD-blue.svg)](./PRD.md)

</div>

## 🎯 项目概述

### 核心功能

- **AI内容生成** - 自动生成文案、图片、视频
- **多平台分发** - 一键发布到国内外8+平台
- **中英双语** - 界面支持中英文切换
- **智能成本控制** - 自动选择最优AI服务

### 核心流程

```
提示词输入 → AI生成(文案+图片+视频) → 内容预览 → 多平台分发
```

## ✨ 主要特性

### 1. AI内容生成引擎

- **文案生成** - GLM-4.7 (主力) / OpenAI GPT-4 / Gemini Pro
- **图片生成** - DALL-E 3 / Stable Diffusion
- **视频生成** - Seedance 2.0 (⭐首选) / HeyGen / 可灵 / Runway ML

### 2. 智能平台分发

**国内平台:**
- ✅ 抖音
- ✅ B站 (bilibili)
- ✅ 微信视频号
- ✅ 微信公众号
- ✅ 小红书 (浏览器自动化)

**国际平台:**
- ✅ YouTube
- ✅ Twitter/X
- ✅ Medium
- ✅ Instagram
- ✅ TikTok

### 3. 成本优化

- **Seedance 2.0** - 仅1元/秒 (性价比最高)
- **智能选择器** - 自动选择最优AI服务
- **成本预估** - 生成前显示预计成本
- **月度预算** - 成本控制和超标提醒

## 🚀 快速开始

### 环境要求

- Node.js 25+
- Python 3.12+
- npm / pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/timduncanwish/conmebution.git
cd conmebution

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 快速启动命令

**每天开机后恢复项目:**
```
/start claude
然后输入: resume conmebution
```

## 📚 文档

- **[PRD文档](./PRD.md)** - 完整的产品需求文档
- **[技术方案](./PRD.md#7-技术架构)** - 技术架构设计
- **[API文档](./docs/api.md)** - API接口文档（待完成）

## 🏗️ 技术栈

### 前端
- Next.js 15 (App Router)
- next-intl (中英双语)
- shadcn/ui (组件库)
- TypeScript
- Tailwind CSS

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite / PostgreSQL

### AI服务
- GLM-4.7 (文案主力)
- DALL-E 3 (图片)
- Seedance 2.0 (视频主力)
- HeyGen / 可灵 / Runway ML (备选)

### 第三方集成
- OpenClaw (Agent系统)
- Chrome DevTools MCP (浏览器自动化)
- 各平台开放API

## 📊 项目结构

```
conmebution/
├── frontend/          # Next.js前端
├── backend/           # Node.js后端
├── openclaw-integration/  # OpenClaw集成
├── docs/              # 文档
├── PRD.md             # 产品需求文档
└── README.md          # 本文件
```

## 🛠️ 开发路线图

### Phase 1: MVP核心功能 (第1-4周)
- ✅ 基础框架搭建
- ✅ GLM文案生成
- ✅ Seedance 2.0视频生成
- ✅ B站和抖音发布

### Phase 2: 平台扩展 (第5-6周)
- ⏳ 微信平台集成
- ⏳ 小红书自动化
- ⏳ 多平台批量发布

### Phase 3: 国际化 (第7-8周)
- ⏳ 国际平台集成
- ⏳ Gemini导入功能
- ⏳ 性能优化

### Phase 4: 数据分析 (第9-10周)
- ⏳ 发布数据追踪
- ⏳ 成本统计
- ⏳ 效果分析

## 💰 成本预算

### 运营成本 (每月)

**必需:**
- VPS主机: ¥35-70元
- 域名: ¥7-15元

**AI服务:**
- 文案生成: ¥70-350元
- 图片生成: ¥35-140元
- 视频生成: ¥150-450元

**平台:**
- 微信认证: ¥300元/年

**总计: ¥322-1,610元/月**

详细成本分析请查看 [PRD文档](./PRD.md#11-成本预算)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 👥 作者

**团队:**
- Claude Code & 用户协作

**资源支持:**
- GLM Lite Coding套餐
- ChatGPT Plus会员
- Gemini Pro会员
- OpenClaw v2026.2.2-3

## 📮 联系方式

- GitHub: [@timduncanwish](https://github.com/timduncanwish)
- Email: timduncanwish@gmail.com

## 🌟 致谢

感谢以下开源项目和服务：
- GLM (智谱AI)
- OpenAI
- Seedance 2.0 (字节跳动)
- Next.js
- OpenClaw

---

<div align="center">

**[⭐ Star](https://github.com/timduncanwish/conmebution)** this project if you find it helpful!

Made with ❤️ by Conmebution Team

</div>
