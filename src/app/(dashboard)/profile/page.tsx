import { notFound } from "next/navigation";
import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default async function ProfilePage() {
  const result = await getProfile();

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProfileForm profile={result.data} />;
}
