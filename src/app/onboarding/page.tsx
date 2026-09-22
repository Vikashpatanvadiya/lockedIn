import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";
import { requireUserId } from "@/lib/session";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "Set up your book — LockedIn" };

export default async function OnboardingPage() {
  const user = await getUser(await requireUserId());
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/book");
  return <Onboarding name={user.name} />;
}
