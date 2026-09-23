import { requireUser } from "@/lib/data";
import { Profile } from "./Profile";

export const metadata = { title: "Profile — LockedIn" };

export default async function ProfilePage() {
  const user = await requireUser();
  return <Profile user={user} />;
}
