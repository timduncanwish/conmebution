#!/bin/bash

# 页面过渡动画测试脚本
# 自动测试所有页面的可访问性

echo "🧪 Conmebution 页面过渡动画测试"
echo "================================"
echo ""

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 基础 URL
BASE_URL="http://localhost:3000"

# 测试页面列表
declare -a pages=(
  "/zh"
  "/zh/create"
  "/zh/publish"
  "/zh/content"
  "/zh/analytics"
  "/zh/templates"
  "/zh/settings"
)

# 页面名称
declare -a page_names=(
  "首页"
  "创建页面"
  "发布页面"
  "内容库"
  "分析页面"
  "模板页面"
  "设置页面"
)

echo "📋 开始测试页面可访问性..."
echo ""

# 测试计数器
total=0
passed=0
failed=0

# 遍历所有页面
for i in "${!pages[@]}"; do
  page="${pages[$i]}"
  name="${page_names[$i]}"

  total=$((total + 1))

  echo -n "测试 $total. $name ($page)... "

  # 使用 curl 测试页面
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")

  if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✅ 通过 (200 OK)${NC}"
    passed=$((passed + 1))
  else
    echo -e "${RED}❌ 失败 ($status_code)${NC}"
    failed=$((failed + 1))
  fi
done

echo ""
echo "📊 测试结果汇总"
echo "================================"
echo "总计: $total 个页面"
echo -e "${GREEN}通过: $passed${NC}"
echo -e "${RED}失败: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}🎉 所有页面测试通过！${NC}"
  echo ""
  echo "📝 下一步："
  echo "1. 在浏览器中打开: $BASE_URL/zh"
  echo "2. 手动测试页面过渡动画效果"
  echo "3. 验证导航菜单的悬停和点击动画"
  echo "4. 检查移动端响应式效果"
  exit 0
else
  echo -e "${RED}⚠️  有 $failed 个页面测试失败${NC}"
  echo "请检查前端服务器是否正常运行"
  exit 1
fi
