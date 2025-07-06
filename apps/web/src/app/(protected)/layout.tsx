import React from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add auth check here
  return <>{children}</>;
} 