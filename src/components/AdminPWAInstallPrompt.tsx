import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "admin-pwa-install-dismissed";

const AdminPWAInstallPrompt = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isPreview =
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com");

    if (isInIframe || isPreview) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Troca o manifest para o do admin
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (link) {
      link.href = "/manifest-admin.json";
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Força reavaliação do manifest
    if ((navigator as any).standalone === false) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      // Restaura manifest original ao sair
      if (link) link.href = "/manifest.json";
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Se o evento não foi capturado (iOS ou já expirado), mostra instrução
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("Toque no botão Compartilhar e depois em 'Adicionar à Tela de Início' para salvar o PAINEL AMD.");
      } else {
        alert("Use o menu do navegador (⋮) e selecione 'Adicionar à tela inicial' ou 'Instalar app'.");
      }
      setShowPrompt(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Admin PWA install:", outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!showPrompt) return null;

  return (
    <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
        <div className="bg-primary rounded-xl p-2.5 shrink-0">
          <Monitor className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">Salvar PAINEL AMD na Tela Inicial</p>
          <p className="text-muted-foreground text-xs">Acesse o painel administrativo em um toque, sem digitar URL.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" onClick={handleInstall} className="h-8 text-xs px-3 font-bold">
            <Download className="h-3.5 w-3.5 mr-1" />
            Salvar
          </Button>
          <button onClick={handleDismiss} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPWAInstallPrompt;
