import { redirect } from "next/navigation";

export default async function FormIndexPage({ params }: { params: Promise<{ eventId: string; formId: string }> }) {
  const { eventId, formId } = await params;
  redirect(`/dashboard/events/${eventId}/forms/${formId}/fields`);
}
