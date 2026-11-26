import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { auth } from "@/lib/auth/auth";
import { isGoogleAuthEnabled } from "@/lib/auth/google";
import { getPostLoginRoute } from "@/lib/auth/post-login";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect(getPostLoginRoute());
  }

  return <RegisterForm googleEnabled={isGoogleAuthEnabled()} />;
}
