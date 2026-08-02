"use client";

import { buildSubmissionsCsv } from "@/lib/forms/submissions-csv";
import type { CustomFormSchema } from "@/lib/forms/types";
import type { FormSubmissionRecord } from "@/lib/data/form-submissions";
import { Button } from "@/components/ui/button";

export function ExportSubmissionsCsvButton({
  formName,
  schema,
  submissions,
}: {
  formName: string;
  schema: CustomFormSchema;
  submissions: FormSubmissionRecord[];
}) {
  const handleExport = () => {
    const csv = buildSubmissionsCsv(schema, submissions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-submissions.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleExport} disabled={submissions.length === 0}>
      Export CSV
    </Button>
  );
}
