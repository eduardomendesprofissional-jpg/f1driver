# 3 Apps a partir de 1 codebase (Capacitor)

Este projeto gera **3 APKs / AABs independentes** para o Google Play, todos compartilhando o mesmo código e o mesmo backend (Lovable Cloud):

| Variante   | App Play Store         | App ID                       | Rota inicial         |
|------------|------------------------|------------------------------|----------------------|
| `admin`    | F1 Driver Admin        | `com.f1driver.admin`         | `/admin/login`       |
| `driver`   | F1 Driver Motorista    | `com.f1driver.motorista`     | `/login/motorista`   |
| `passenger`| F1 Driver Passageiro   | `com.f1driver.passageiro`    | `/login`             |

> No preview do Lovable e no domínio web (`f1driveroficial.com`) **todas as rotas continuam ativas** (variante `all`). A separação só acontece nos builds mobile.

---

## Como funciona

- `src/lib/app-variant.ts` lê `VITE_APP_VARIANT` (`admin` | `driver` | `passenger` | `all`).
- `src/App.tsx` filtra as rotas registradas conforme a variante.
- `SplashScreen` redireciona para a rota inicial correta da variante.
- Arquivos `.env.admin`, `.env.driver`, `.env.passenger` definem o valor da variante.
- Arquivos `capacitor.config.<variante>.json` definem `appId` + `appName` de cada APK.

---

## Pré-requisitos (uma única vez, na sua máquina)

```bash
git clone <seu-repo>
cd <seu-repo>
npm install
npx cap add android
```

---

## Gerando os 3 APKs

Faça uma vez para cada variante (`admin`, `driver`, `passenger`):

### 1. Buildar o site na variante desejada

```bash
# Admin
npx vite build --mode admin

# Motorista
npx vite build --mode driver

# Passageiro
npx vite build --mode passenger
```

### 2. Copiar a config do Capacitor da variante

```bash
# Admin
cp capacitor.config.admin.json capacitor.config.json

# Motorista
cp capacitor.config.driver.json capacitor.config.json

# Passageiro
cp capacitor.config.passenger.json capacitor.config.json
```

### 3. Sync + abrir no Android Studio

```bash
npx cap sync android
npx cap open android
```

No Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)** e faça upload no Google Play Console como **3 apps separados** (um por `appId`).

---

## Dicas

- **Ícones por variante:** substitua os ícones em `android/app/src/main/res/` antes do `Generate Signed Bundle` de cada uma. Use 3 conjuntos diferentes (admin azul, motorista laranja, passageiro azul claro, por exemplo).
- **Mesmo backend:** todos os 3 apps usam o mesmo Lovable Cloud → motorista cadastrado num app aparece no painel admin do outro automaticamente.
- **Atualizações:** mudou o código? Basta repetir os passos 1-3 para cada variante e subir a nova versão no Play Console.
- **Não toque** em `capacitor.config.json` manualmente — ele é sobrescrito pelo passo 2.

---

## Script único (opcional)

Para automatizar tudo:

```bash
# build-all.sh
for v in admin driver passenger; do
  npx vite build --mode $v
  cp capacitor.config.$v.json capacitor.config.json
  npx cap sync android
  echo "✅ $v pronto — abra Android Studio e gere o AAB"
  read -p "Pressione ENTER quando terminar o $v..."
done
```
