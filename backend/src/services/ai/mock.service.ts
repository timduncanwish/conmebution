/**
 * Mock AI Service
 * 用于演示和测试的模拟AI服务
 */

import {
  TextGenerationRequest,
  TextGenerationResult,
  CostEstimate,
  GenerateTextOptions,
  AIProvider,
  AIModel
} from '../../types/ai.types';

/**
 * 简化的Mock AI服务实现
 * 直接实现所需接口，不继承BaseAIService
 */
export class MockAIService {
  private apiKey: string;

  constructor(apiKey: string = 'mock-api-key') {
    this.apiKey = apiKey;
  }

  /**
   * 生成模拟文本内容
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    const prompt = request.prompt.toLowerCase();
    const options = request.options || {};
    let generatedText = '';

    // 根据提示词生成相关内容
    if (prompt.includes('iphone') || prompt.includes('手机')) {
      generatedText = this.generatePhoneContent(prompt);
    } else if (prompt.includes('护肤') || prompt.includes('美妆')) {
      generatedText = this.generateBeautyContent(prompt);
    } else if (prompt.includes('教程') || prompt.includes('如何')) {
      generatedText = this.generateTutorialContent(prompt);
    } else if (prompt.includes('美食') || prompt.includes('菜谱')) {
      generatedText = this.generateFoodContent(prompt);
    } else {
      generatedText = this.generateGenericContent(prompt);
    }

    // 模拟API延迟
    await this.delay(500 + Math.random() * 1000);

    return {
      content: generatedText,
      provider: request.provider || AIProvider.GLM_4,
      model: AIModel.GLM_4,
      tokensUsed: {
        input: Math.ceil(request.prompt.length / 2),
        output: Math.ceil(generatedText.length / 2),
        total: Math.ceil((request.prompt.length + generatedText.length) / 2)
      },
      cost: 0.00001,
      timestamp: new Date()
    };
  }

  /**
   * 估算成本（返回模拟数据）
   */
  async estimateCost(prompt: string, options?: GenerateTextOptions): Promise<CostEstimate> {
    const inputTokens = Math.ceil(prompt.length / 2);
    const outputTokens = Math.ceil(prompt.length * 2);

    // 模拟定价 (GLM-4最便宜)
    const pricePerToken = 0.000001;

    const inputCost = inputTokens * pricePerToken;
    const outputCost = outputTokens * pricePerToken * 2;
    const totalCost = inputCost + outputCost;

    return {
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost: totalCost,
      currency: 'USD',
      breakdown: {
        input: inputCost,
        output: outputCost
      }
    };
  }

  // ========== 私有辅助方法 ==========

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generatePhoneContent(prompt: string): string {
    return `# iPhone 16 Pro Max 深度评测

## 设计与工艺
iPhone 16 Pro Max 延续了苹果一贯的精湛工艺，采用钛金属边框设计，手感更加轻盈舒适。6.9英寸Super Retina XDR显示屏带来震撼的视觉体验。

## 核心性能
搭载全新的A18仿生芯片，性能提升20%，能效比优化30。无论是游戏、视频编辑还是日常使用，都能流畅运行。

## 影像系统
升级后的三摄系统支持8K视频录制，夜景模式表现更加出色。智能HDR算法让每一张照片都栩栩如生。

## 续航与充电
全天候电池续航，配合快充和MagSafe无线充电，让电量焦虑成为过去。

适合追求极致体验的用户首选。`;
  }

  private generateBeautyContent(prompt: string): string {
    return `# 春季护肤新品推荐 🌸

春天来了，肌肤也需要焕新！今天为大家推荐几款超好用的春季护肤新品：

## 🏆 明星产品推荐

### 1. 舒缓保湿喷雾
- 含天然温泉水成分
- 快速补水，舒缓敏感
- 适合所有肤质

### 2. 维C亮肤精华
- 20%高浓度维C
- 淡化痘印，提亮肤色
- 春季美白必备

### 3. 轻透防晒乳
- SPF50+ PA++++
- 质地轻薄，不油腻
- 防护同时养肤

## 💡 使用小贴士
1. 喷雾随时补，水润一整天
2. 精华早晚用，坚持见效果
3. 防晒不能忘，防晒最重要

记住：护肤要耐心，适合自己的才是最好的！`;
  }

  private generateTutorialContent(prompt: string): string {
    return `# 如何使用AI内容创作平台

## 第一步：登录注册
访问平台官网，使用手机号或邮箱注册账号。

## 第二步：创建内容
1. 点击"创建内容"按钮
2. 输入您的内容想法（至少10个字符）
3. 选择内容类型（文本/图片/视频）
4. 点击"预估成本"查看费用
5. 点击"开始创作"生成内容

## 第三步：编辑调整
- 生成的内容可以手动编辑
- 支持多个版本对比选择
- 可保存为模板重复使用

## 第四步：发布分发
1. 选择目标平台
2. 系统自动适配格式
3. 一键发布到多个平台
4. 实时查看发布状态

就这么简单！快去试试吧～`;
  }

  private generateFoodContent(prompt: string): string {
    return `# 美味家常菜：红烧肉 🍖

今天教大家做一道超好吃的红烧肉，简单易学，新手也能成功！

## 📝 食材准备
- 五花肉 500g
- 冰糖 30g
- 生抽 3勺
- 老抽 1勺
- 料酒 2勺
- 葱姜蒜 适量

## 👩‍🍳 制作步骤

### 1. 处理五花肉
五花肉切成3cm见方的块，冷水下锅焯水，撇去浮沫后捞出。

### 2. 炒糖色
热锅凉油，放入冰糖小火慢慢融化至琥珀色。

### 3. 煸炒肉块
放入肉块翻炒上色，加入葱姜蒜爆香。

### 4. 调味炖煮
加入料酒、生抽、老抽，加开水没过肉块。大火烧开转小火炖45分钟。

### 5. 收汁出锅
大火收汁至浓稠，撒上葱花即可。

## 💡 小贴士
- 炒糖色要用小火，避免糊掉
- 炖煮时间要足，肉质才软烂
- 最后收汁要不断翻炒

这道红烧肉肥而不腻，入口即化，配米饭简直绝了！快试试吧～`;
  }

  private generateGenericContent(prompt: string): string {
    return `# 关于"${prompt}"

感谢您的提问！这是一个很有趣的话题。

## 主要观点

基于您的需求，我认为以下几点值得关注：

1. **深入了解主题**: 建议先从基础概念开始，逐步深入
2. **实践出真知**: 理论结合实践是最好的学习方式
3. **保持好奇心**: 持续探索和提问会让学习更有趣

## 建议

如果您想了解更多，可以：
- 查阅相关资料
- 咨询专业人士
- 加入相关社区讨论

希望这些建议对您有帮助！如有其他问题，欢迎继续提问。`;
  }
}
