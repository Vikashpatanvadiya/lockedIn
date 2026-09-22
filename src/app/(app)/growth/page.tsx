import { getJournal, requireUser } from "@/lib/data";
import { Growth } from "./Growth";

export const metadata = { title: "Growth — LockedIn" };

export default async function GrowthPage() {
  const user = await requireUser();
  const { chapters, tasks, days } = await getJournal(user);
  return <Growth chapters={chapters} tasks={tasks} days={days} />;
}
