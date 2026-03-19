# Conmebution Quick Start Guide

## 🚀 System is Running!

Your Conmebution MVP is now fully operational. Here's how to use it:

---

## 📍 Access URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3001 | ✅ Running |
| **Backend API** | http://localhost:4000 | ✅ Running |
| **Health Check** | http://localhost:4000/api/health | ✅ Working |

---

## 🎯 What You Can Do Now

### 1. **Explore the Frontend Interface**

Open your browser to: **http://localhost:3001**

You'll see:
- ✨ **首页** (Homepage) - Dashboard with system overview
- 📝 **创建内容** (Create Content) - AI content generation interface
- 🚀 **发布内容** (Publish Content) - Multi-platform publishing
- 📚 **内容库** (Content Library) - Content management
- ⚙️ **设置** (Settings) - Configuration panel

### 2. **Test the Core Feature: Cost Estimation**

This is the **key MVP feature** that works without any API keys!

**Option A: Using the Browser**
1. Go to: http://localhost:3001/zh/create
2. Enter a prompt (e.g., "hello world" or "测试")
3. The system will show estimated costs for different AI providers

**Option B: Using the Command Line**

```bash
# English text
curl "http://localhost:4000/api/generate/cost?prompt=hello world"

# Chinese text (URL-encoded)
curl "http://localhost:4000/api/generate/cost?prompt=%E6%B5%8B%E8%AF%95"

# Compare providers
curl "http://localhost:4000/api/generate/cost?prompt=test&provider=gpt-4"
curl "http://localhost:4000/api/generate/cost?prompt=test&provider=glm-4"
```

**What this tells you:**
- 📊 Token count estimation
- 💰 Cost comparison across providers
- 🎯 Best value recommendation (GLM-4 is cheapest!)

### 3. **Test Batch Platform APIs**

```bash
# Check batch publishing statistics
curl http://localhost:4000/api/platforms/batch/statistics

# View publishing history
curl http://localhost:4000/api/platforms/batch/history

# Check active tasks
curl http://localhost:4000/api/platforms/batch/active
```

---

## ⚙️ Enable Full Features (Optional)

### Step 1: Configure AI Service Keys

To enable actual content generation (not just cost estimation):

1. **Copy the environment file:**
   ```bash
   cd /e/conmebution/backend
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   ```env
   # GLM-4 (智谱AI) - Recommended for Chinese
   GLM_API_KEY=your_glm_api_key_here

   # OpenAI (GPT-4, DALL-E)
   OPENAI_API_KEY=your_openai_api_key_here

   # Gemini Pro (Google)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Restart the backend:**
   ```bash
   cd /e/conmebution/backend
   # Stop the current process (Ctrl+C)
   PORT=4000 npm run dev
   ```

### Step 2: Configure Platform Credentials

To enable actual publishing to platforms:

1. **Register for platform developer accounts:**
   - B站开放平台: https://openhome.bilibili.com/
   - 抖音开放平台: https://developer.open-douyin.com/
   - 微信公众平台: https://mp.weixin.qq.com/

2. **Add credentials via the Settings page** (http://localhost:3001/zh/settings)

### Step 3: Optional - Install Redis

Redis enhances queue functionality for background tasks:

1. **Install Redis:**
   ```bash
   # Windows (using WSL)
   sudo apt-get install redis-server

   # Or use Docker
   docker run -d -p 6379:6379 redis
   ```

2. **Configure Redis connection in `.env`:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

---

## 🎨 Full Feature Walkthrough

### Feature 1: Intelligent Cost Estimation 🌟

**Why it's amazing:**
- No API keys required
- Compare costs across AI providers
- Supports English and Chinese
- Real-time token counting
- Shows breakdown (input vs output tokens)

**How to use:**
```bash
# Simple test
curl "http://localhost:4000/api/generate/cost?prompt=Your text here"

# With specific provider
curl "http://localhost:4000/api/generate/cost?prompt=Your text here&provider=gpt-4"

# Chinese text
curl "http://localhost:4000/api/generate/cost?prompt=%E4%BD%A0%E5%A5%BD"
```

**Response example:**
```json
{
  "success": true,
  "data": {
    "estimatedTokens": 6,
    "estimatedCost": 0.00027,
    "currency": "USD",
    "breakdown": {
      "input": 0.00009,
      "output": 0.00018
    }
  }
}
```

### Feature 2: Content Generation (requires API keys)

**Once configured**, you can generate:

1. **Text Content**
   ```bash
   curl -X POST http://localhost:4000/api/generate/text/sync \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Write a product description","provider":"glm-4"}'
   ```

2. **Images**
   ```bash
   curl -X POST http://localhost:4000/api/generate/image \
     -H "Content-Type: application/json" \
     -d '{"prompt":"A beautiful sunset","style":"realistic"}'
   ```

3. **Videos**
   ```bash
   curl -X POST http://localhost:4000/api/generate/video \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Product showcase","duration":15}'
   ```

### Feature 3: Multi-Platform Publishing (requires credentials)

**Batch publish to 5 platforms at once:**

```bash
curl -X POST http://localhost:4000/api/platforms/batch/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "title": "My Amazing Content",
      "description": "This is AI-generated content",
      "mediaUrls": ["https://example.com/image.jpg"]
    },
    "platforms": ["bilibili", "douyin", "wechat_mp", "wechat_video", "xiaohongshu"],
    "credentials": {
      "bilibili": {"access_token": "your_token"},
      "douyin": {"access_token": "your_token"}
    }
  }'
```

**Track publishing progress:**
```bash
# Check task status
curl http://localhost:4000/api/platforms/batch/status/{taskId}

# View all active tasks
curl http://localhost:4000/api/platforms/batch/active
```

---

## 📊 Platform Support

### Domestic Platforms (5) ✅

| Platform | Status | Content Type | Authentication |
|----------|--------|--------------|----------------|
| **B站** | ✅ Ready | Video | OAuth 2.0 |
| **抖音** | ✅ Ready | Video | OAuth 2.0 |
| **微信公众号** | ✅ Ready | Images | OAuth 2.0 |
| **微信视频号** | ✅ Ready | Video | OAuth 2.0 |
| **小红书** | ✅ Ready | Images/Video | Session ID |

### International Platforms (Phase 3) ⏳

| Platform | Status | Planned |
|----------|--------|---------|
| **YouTube** | ⏳ Phase 3 | Q2 2026 |
| **Medium** | ⏳ Phase 3 | Q2 2026 |
| **Twitter/X** | ⏳ Phase 3 | Q2 2026 |

---

## 🛠️ Server Management

### Check if servers are running

```bash
# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3001
```

### Start servers (if stopped)

```bash
# Backend (terminal 1)
cd /e/conmebution/backend
PORT=4000 npm run dev

# Frontend (terminal 2)
cd /e/conmebution/frontend
npm run dev
```

### View logs

**Backend logs:**
```bash
tail -f /e/conmebution/backend/logs/*.log
```

**Frontend logs:**
- View in browser console (F12)
- Check terminal output

---

## 📚 Additional Resources

### Documentation Files
- **PRD**: `/e/conmebution/PRD.md` - Complete product requirements
- **MVP Report**: `/e/conmebution/MVP_COMPLETION_REPORT.md` - Detailed completion status
- **API Docs**: `/e/conmebution/docs/api.md` - API reference

### Configuration Files
- **Backend**: `/e/conmebution/backend/.env`
- **Frontend**: `/e/conmebution/frontend/.env.local`
- **Database**: `/e/conmebution/backend/dev.db`

### Key Code Locations
- **Backend Routes**: `/e/conmebution/backend/src/api/routes/`
- **Platform Adapters**: `/e/conmebution/backend/src/services/platforms/adapters/`
- **Frontend Pages**: `/e/conmebution/frontend/app/[locale]/`

---

## 🎉 What's Been Accomplished

✅ **Complete Backend API** (15 endpoints)
✅ **Intelligent Cost Estimation** (core MVP feature)
✅ **5 Platform Adapters** (B站, 抖音, 微信公众号, 微信视频号, 小红书)
✅ **Batch Publishing System** (parallel multi-platform publishing)
✅ **Beautiful Frontend** (Chinese/English bilingual)
✅ **Database Integration** (Prisma + SQLite)
✅ **TypeScript Throughout** (type-safe codebase)
✅ **Modern Architecture** (Next.js 16, React 19)

---

## 🆘 Troubleshooting

### Frontend shows errors
1. Check if backend is running: `curl http://localhost:4000/api/health`
2. Check browser console (F12) for errors
3. Clear browser cache and reload

### Backend not responding
1. Check if port 4000 is in use: `lsof -i :4000`
2. Restart backend server
3. Check backend logs for errors

### Cost estimation returns errors
1. Make sure prompt is URL-encoded for Chinese characters
2. Check provider name is valid (glm-4, gpt-4, gemini)

---

## 🎯 Recommended Next Steps

1. **Explore the UI** - Browse all pages at http://localhost:3001
2. **Test Cost Estimation** - Try different prompts and providers
3. **Read the PRD** - Understand the full vision
4. **Configure API Keys** - Enable actual content generation
5. **Test Publishing** - After configuring platform credentials

---

**Congratulations! 🎉 Your Conmebution MVP is fully operational!**

For detailed technical information, see: `MVP_COMPLETION_REPORT.md`

---

*Last Updated: 2026-03-12*
*Version: 1.0.0*
*Status: ✅ MVP Complete*
