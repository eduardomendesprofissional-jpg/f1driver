import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDczQrPs9fl_We92z9Qc2vMwF_IJsGDHWY",
  authDomain: "f1-driver-6506b.firebaseapp.com",
  projectId: "f1-driver-6506b",
  storageBucket: "f1-driver-6506b.firebasestorage.app",
  messagingSenderId: "73621681482",
  appId: "1:73621681482:web:b57e1ef2572bd131bcbdb3",
  measurementId: "G-EQFVN02D07",
};

const app = initializeApp(firebaseConfig);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export const getFirebaseMessaging = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) {
    console.warn("Firebase Messaging não suportado neste navegador");
    return null;
  }
  messagingInstance = getMessaging(app);
  return messagingInstance;
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permissão de notificação negada");
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: "", // Will be set by user if needed; FCM works without for testing
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
    });

    return token;
  } catch (error) {
    console.error("Erro ao obter token FCM:", error);
    return null;
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  onMessage(messaging, callback);
};
