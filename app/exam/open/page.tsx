import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ExamOpenPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const id = first(params.id).trim();

  if (!id || Number.isNaN(Number(id))) {
    redirect("/exam");
  }

  redirect(`/exam/${id}`);
}
