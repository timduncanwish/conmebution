// Root layout - minimal setup
// This layout is used for the root path and will redirect to locale

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export const metadata = {
  title: "Conmebution - AI内容自动化创作与分发",
  description: "从提示词到多平台分发的一站式AI内容自动化系统",
};
