import type { Metadata } from "next";
import { siteBaseUrl } from "@/lib/site";
import { PollsDashboard } from "@/components/polls/PollsDashboard";

export function generateMetadata(): Metadata {
  return {
    title: "Your Polls Dashboard - ALX Polly",
    description: "View and manage all your created polls with detailed analytics and metrics",
    alternates: {
      canonical: new URL("/polls", siteBaseUrl).toString(),
    },
  };
}

export default function PollsListPage() {
  return <PollsDashboard />;
}
