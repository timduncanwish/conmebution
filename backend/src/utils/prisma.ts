import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

// Singleton pattern for Prisma client
const prismaClientSingleton = () => {
  // Use absolute path to database
  const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');

  const adapter = new PrismaBetterSqlite3({
    url: dbPath,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error']
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
