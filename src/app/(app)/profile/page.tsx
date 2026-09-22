import { getBook, requireUser } from "@/lib/data";
import { Profile } from "./Profile";

export const metadata = { title: "Profile — LockedIn" };

export default async function ProfilePage() {
  const user = await requireUser();
  const book = await getBook(user.id);
  return <Profile user={user} book={book} />;
}
