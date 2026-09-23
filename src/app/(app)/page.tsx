import { getGoals, getReviews, getTasks, requireUser } from "@/lib/data";
import { Feed } from "./Feed";

export const metadata = { title: "LockedIn" };

export default async function JournalPage() {
  const user = await requireUser();
  const [tasks, goals, reviews] = await Promise.all([getTasks(user.id), getGoals(user.id), getReviews(user.id)]);
  return <Feed user={user} tasks={tasks} goals={goals} reviews={reviews} />;
}
