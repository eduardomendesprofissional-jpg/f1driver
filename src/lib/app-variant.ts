// Variante do app — define qual app é gerado no build.
// Use `vite build --mode admin|driver|passenger` para gerar cada APK.
// Sem variante (preview Lovable / web), todos os módulos ficam disponíveis.

export type AppVariant = "admin" | "driver" | "passenger" | "all";

export const APP_VARIANT: AppVariant =
  (import.meta.env.VITE_APP_VARIANT as AppVariant) || "all";

export const IS_ADMIN_APP = APP_VARIANT === "admin";
export const IS_DRIVER_APP = APP_VARIANT === "driver";
export const IS_PASSENGER_APP = APP_VARIANT === "passenger";
export const IS_FULL_APP = APP_VARIANT === "all";

/** Rota inicial após splash, conforme variante. */
export const VARIANT_HOME: Record<AppVariant, string> = {
  admin: "/admin/login",
  driver: "/login/motorista",
  passenger: "/login",
  all: "/home",
};

export const getVariantHome = () => VARIANT_HOME[APP_VARIANT];
