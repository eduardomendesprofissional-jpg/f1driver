import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completo, nome, cpf, tipo")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        // Consider onboarding done if flag is true OR user already has name+cpf filled
        const done = data?.onboarding_completo === true || 
          (!!data?.nome && data.nome.trim() !== "" && !!data?.cpf && data.cpf.trim() !== "");
        
        // If user has data but flag is false, update the flag silently
        if (done && !data?.onboarding_completo) {
          supabase.from("profiles").update({ onboarding_completo: true }).eq("id", user.id).then();
        }
        
        setOnboardingDone(done);
        setCheckingOnboarding(false);
      });
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
