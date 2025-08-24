"use client";
import React from "react";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
      <p className="mb-6">{error.message}</p>
    </div>
  );
}
