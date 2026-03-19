'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * 页面过渡组件 - 提供流畅的页面切换动画
 *
 * 功能：
 * - 淡入淡出效果
 * - 从底部轻微滑入
 * - 300ms 过渡时间
 * - 支持所有页面路由
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pageVariants: Variants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/**
 * 内容卡片过渡组件 - 用于内容元素的交错动画
 */
export function CardTransition({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const cardVariants: Variants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="enter"
      variants={cardVariants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/**
 * 列表项过渡组件 - 用于列表项的交错动画
 */
export function ListItemTransition({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const itemVariants: Variants = {
    initial: {
      opacity: 0,
      x: -20,
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="enter"
      variants={itemVariants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
