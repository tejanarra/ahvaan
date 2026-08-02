import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getForm } from "@/lib/data/forms";
import { listSubmissions } from "@/lib/data/form-submissions";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportSubmissionsCsvButton } from "./export-submissions-csv-button";
import { DeleteSubmissionButton } from "./delete-submission-button";

export const dynamic = "force-dynamic";

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  if (value && typeof value === "object") {
    const addr = value as Record<string, string>;
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  }
  return typeof value === "string" && value ? value : "—";
}

export default async function FormDataPage({ params }: { params: Promise<{ eventId: string; formId: string }> }) {
  const { eventId, formId } = await params;
  const host = await requireHost();
  const form = await getForm(host.id, eventId, formId);
  if (!form) notFound();

  const submissions = await listSubmissions(host.id, formId);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Submissions</h2>
          <p className="mt-0.5 text-xs text-muted">
            {submissions.length} submission{submissions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex *:flex-1 sm:*:flex-none">
          <ExportSubmissionsCsvButton formName={form.name} schema={form.schema} submissions={submissions} />
        </div>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No submissions yet"
          description="Once this form is embedded on your invite page and a guest submits it, their response shows up here."
        />
      ) : form.schema.fields.length === 0 ? (
        <EmptyState className="mt-4" title="This form has no fields" description="Add a question in the Fields tab first." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Submitted</th>
                {form.schema.fields.map((field) => (
                  <th key={field.id} className="whitespace-nowrap px-3 py-2 font-medium">
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(s.submitted_at).toLocaleString()}</td>
                  {form.schema.fields.map((field) => (
                    <td key={field.id} className="px-3 py-2 text-foreground">
                      {formatValue(s.responses[field.id])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <DeleteSubmissionButton formId={formId} submissionId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
