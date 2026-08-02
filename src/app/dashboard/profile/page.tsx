import { requireHost } from "@/lib/supabase/auth-server";
import { getHostProfile } from "@/lib/data/host-profile";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const host = await requireHost();
  const profile = await getHostProfile(host.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="How you appear to guests on your event pages." />
      <ProfileForm profile={profile} />
    </div>
  );
}
