// Root layout - minimal setup
// This layout is used for the root path and will redirect to locale

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// Fallback for non-locale routes (redirects, API). [locale]/layout.tsx
// overrides with locale-specific title via generateMetadata.
export const metadata = {
  title: "Conmebution - AI Content Automation System",
  description: "AI-powered content automation for creating and distributing to multiple platforms",
};
