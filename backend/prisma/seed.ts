import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

// Use absolute path to database
const dbPath = path.join(__dirname, 'dev.db');

const adapter = new PrismaBetterSqlite3({
  url: dbPath,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@conmebution.com' },
    update: {},
    create: {
      email: 'demo@conmebution.com',
      password: hashedPassword,
      name: 'Demo User',
      language: 'zh'
    }
  });

  console.log('Created demo user:', user);

  // Create sample template
  const template = await prisma.contentTemplate.create({
    data: {
      userId: user.id,
      name: '产品介绍模板',
      description: '用于生成产品介绍文案的模板',
      type: 'text',
      promptTemplate: '请为以下产品写一段吸引人的介绍文案：{产品名称}\n主要特点：{特点}\n目标受众：{受众}',
      aiProvider: 'glm-4',
      style: 'professional',
      platforms: JSON.stringify(['douyin', 'bilibili'])
    }
  });

  console.log('Created sample template:', template);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
