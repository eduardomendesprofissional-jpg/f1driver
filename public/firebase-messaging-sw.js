/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDczQrPs9fl_We92z9Qc2vMwF_IJsGDHWY",
  authDomain: "f1-driver-6506b.firebaseapp.com",
  projectId: "f1-driver-6506b",
  storageBucket: "f1-driver-6506b.firebasestorage.app",
  messagingSenderId: "73621681482",
  appId: "1:73621681482:web:b57e1ef2572bd131bcbdb3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nova corrida disponível!";
  const options = {
    body: payload.notification?.body || "Abra o app para ver os detalhes.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: "open", title: "Abrir" },
    ],
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
        return;
      }
      clients.openWindow("/driver");
    })
  );
});
