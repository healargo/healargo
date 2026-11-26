import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { AUTH_COPY } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { isGoogleAuthEnabled } from "@/lib/auth/google";
import { getPostLoginRoute } from "@/lib/auth/post-login";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    // Already signed in: go home, not to callbackUrl. A customer bounced here
    // from /admin would otherwise loop between /admin and /login.
    redirect(getPostLoginRoute());
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted">{AUTH_COPY.loading}</div>
      }
    >
      <LoginForm googleEnabled={isGoogleAuthEnabled()} />
    </Suspense>
  );
}
