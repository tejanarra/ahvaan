"use client";

import { useRouter } from "next/navigation";
import { deleteSubmissionAction } from "../../actions";
import { ConfirmIconButton } from "@/components/confirm-icon-button";

export function DeleteSubmissionButton({ formId, submissionId }: { formId: string; submissionId: string }) {
  const router = useRouter();
  return (
    <ConfirmIconButton
      label="Delete submission"
      confirmText="Delete this submission? This can't be undone."
      onConfirm={async () => {
        await deleteSubmissionAction(formId, submissionId);
        router.refresh();
      }}
    />
  );
}
