"use client";

import { use } from "react";
import { TeamDetailsPageContent } from "./TeamDetailsPageContent";

export default function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TeamDetailsPageContent id={id} />;
}
