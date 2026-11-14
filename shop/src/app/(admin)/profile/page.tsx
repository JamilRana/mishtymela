import React from "react";
import { getProfileUserAction } from "@/actions/profile";
import { UserProfileView } from "@/components/profile/UserProfileView";
import { PageHeader } from "@/components/shared/PageHeader";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfileUserAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile & Security"
        description="Manage your staff profile details, update login credentials, and change your account password"
      />
      <UserProfileView user={user} />
    </div>
  );
}
