"use client";

import { HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className}`}
      {...props}
    />
  );
}

export { Skeleton };