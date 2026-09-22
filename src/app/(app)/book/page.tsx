import { getJournal, requireUser } from "@/lib/data";
import { BookReader } from "@/components/book/BookReader";

export const metadata = { title: "My book — LockedIn" };

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const user = await requireUser();
  const [journal, params] = await Promise.all([getJournal(user), searchParams]);
  const at = typeof params.at === "string" ? params.at : undefined;
  return <BookReader journal={journal} at={at} autoOpen={params.open === "today"} />;
}
