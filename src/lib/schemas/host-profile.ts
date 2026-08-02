import { z } from "zod";

const MAX_NAME_LENGTH = 80;
const MAX_BIO_LENGTH = 500;

// Both fields are optional — a host who never visits Profile still gets a
// public page with no "Hosted by" block at all (see getHostProfilePublic).
export const hostProfileInputSchema = z.object({
  displayName: z.string().trim().max(MAX_NAME_LENGTH).optional().default(""),
  bio: z.string().trim().max(MAX_BIO_LENGTH).optional().default(""),
});

export type HostProfileFormInput = z.infer<typeof hostProfileInputSchema>;

export function readHostProfileFormInput(formData: FormData) {
  return hostProfileInputSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });
}
