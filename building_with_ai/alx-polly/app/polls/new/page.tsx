import type { Metadata } from "next";
import { siteBaseUrl } from "@/lib/site";
import { NewPollClient } from "./NewPollClient";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: new URL("/polls/new", siteBaseUrl).toString(),
    },
  };
}

export default function NewPollPage() {
  return <NewPollClient />;
}
