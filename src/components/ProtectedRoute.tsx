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

    // PERSISTENT LOGIN: once a user has been seen on this device, NEVER show onboarding again.
    const seenKey = `f1_seen_${user.id}`;
    if (localStorage.getItem(seenKey) === "1") {
      setOnboardingDone(true);
      setCheckingOnboarding(false);
      lastUserId.current = user.id;
      return;
    }

    // Avoid re-fetching if we already checked this user in the current session
    if (lastUserId.current === user.id && onboardingDone !== null) {
      setCheckingOnboarding(false);
      return;
    }

    let cancelled = false;
    const checkProfile = async () => {
      setCheckingOnboarding(true);

      // Hard rule: onboarding ONLY shows on the user's very first access.
      // Once we've seen this user complete it (or any successful load), never show again.
      const seenKey = `f1_seen_${user.id}`;
      if (localStorage.getItem(seenKey) === "1") {
        if (!cancelled) {
          setOnboardingDone(true);
          lastUserId.current = user.id;
          setCheckingOnboarding(false);
        }
        return;
      }

      // Also consider: account created more than 1h ago = old user, never onboard.
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isFreshAccount = createdAt && Date.now() - createdAt < 60 * 60 * 1000;

      let finalDecision: boolean | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completo, nome, cpf, tipo")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          finalDecision = true; // transient error → never kick existing user
          break;
        }

        if (!data) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          // No profile + brand new account = first access → onboarding
          // No profile + old account = treat as done (don't kick out)
          finalDecision = !isFreshAccount;
          break;
        }

        const hasData = !!data.nome && data.nome.trim() !== "" && !!data.cpf && data.cpf.trim() !== "";
        // Only consider "not done" if account is brand new AND no data filled yet
        const done = data.onboarding_completo === true || hasData || !isFreshAccount;

        if (done && !data.onboarding_completo && hasData) {
          supabase.from("profiles").update({ onboarding_completo: true }).eq("id", user.id).then();
        }

        finalDecision = done;
        break;
      }

      if (!cancelled) {
        const result = finalDecision ?? true;
        if (result) localStorage.setItem(seenKey, "1");
        setOnboardingDone(result);
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
