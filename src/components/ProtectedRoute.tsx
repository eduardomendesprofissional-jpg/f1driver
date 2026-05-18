import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      setOnboardingDone(null);
      lastUserId.current = null;
      return;
    }

    // Avoid re-fetching if we already checked this user
    if (lastUserId.current === user.id && onboardingDone !== null) {
      setCheckingOnboarding(false);
      return;
    }

    let cancelled = false;
    const checkProfile = async () => {
      setCheckingOnboarding(true);

      let finalDecision: boolean | null = null;

      // Retry up to 3 times with delay to handle profile trigger race
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completo, nome, cpf, tipo")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          // Transient error (RLS/network/etc.) — wait and retry
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          // After 3 failed attempts: assume existing user, DO NOT kick to onboarding.
          finalDecision = true;
          break;
        }

        if (!data) {
          // Profile row really not there yet — wait once, then on final attempt treat as new
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          finalDecision = false;
          break;
        }

        const done = data.onboarding_completo === true ||
          (!!data.nome && data.nome.trim() !== "" && !!data.cpf && data.cpf.trim() !== "");

        if (done && !data.onboarding_completo) {
          supabase.from("profiles").update({ onboarding_completo: true }).eq("id", user.id).then();
        }

        finalDecision = done;
        break;
      }

      if (!cancelled) {
        setOnboardingDone(finalDecision ?? true);
        lastUserId.current = user.id;
        setCheckingOnboarding(false);
      }
    };

    checkProfile();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
