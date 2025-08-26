import { redirect } from "next/navigation";

export default function Home() {
  // Redirect users to the polls dashboard
  redirect("/polls");
}
