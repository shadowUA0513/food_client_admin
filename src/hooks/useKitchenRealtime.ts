import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef } from "react";
import { AUTH_COOKIE_KEY } from "../service/api/constant";
import { env } from "../service/api/env";
import { showSuccessNotification } from "../utils/notifications";

function getCookie(name: string) {
  const escapedName = name.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function buildKitchenSocketUrl(companyId: string) {
  const token = getCookie(AUTH_COOKIE_KEY);
  const apiUrl = new URL(env.baseUrl);
  const socketOrigin = `${apiUrl.protocol === "https:" ? "wss:" : "ws:"}//${apiUrl.host}`;
  const socketUrl = new URL(
    `/api/v1/company/${companyId}/kitchen/ws`,
    socketOrigin,
  );

  if (token) {
    socketUrl.searchParams.set("token", token);
    socketUrl.searchParams.set("access_token", token);
  }

  return socketUrl.toString();
}

function playKitchenAlertSound() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  void audioContext.resume().catch(() => undefined);

  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(1, audioContext.currentTime);
  masterGain.connect(audioContext.destination);

  const createBeep = (
    startTime: number,
    duration: number,
    startFrequency: number,
    endFrequency: number,
  ) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(startFrequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(
      endFrequency,
      startTime + duration,
    );

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.45, startTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  createBeep(audioContext.currentTime, 0.28, 880, 1040);
  createBeep(audioContext.currentTime + 0.18, 0.32, 988, 1244);
  createBeep(audioContext.currentTime + 0.52, 0.28, 880, 1040);
  createBeep(audioContext.currentTime + 0.7, 0.42, 988, 1396);

  window.setTimeout(() => {
    void audioContext.close().catch(() => undefined);
  }, 1600);
}

function speakKitchenAlert(message: string) {

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "ru-RU";
  utterance.volume = 1;
  utterance.rate = 0.82;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title, {
    body,
    tag: "kitchen-live-order",
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function useKitchenRealtime(companyId?: string) {
  
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const notifyKitchenUpdate = useEffectEvent(() => {
    const title = "Новый заказ";
    const message = "На кухню поступил новый заказ.";

    showSuccessNotification({
      title,
      message,
    });
    showBrowserNotification(title, message);
    playKitchenAlertSound();
    speakKitchenAlert(message);
  });

  const invalidateKitchenOrders = useEffectEvent(() => {
    if (!companyId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: ["kitchen-orders", companyId],
    });
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let isDisposed = false;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const connect = () => {
      clearReconnectTimeout();

      const nextSocket = new WebSocket(buildKitchenSocketUrl(companyId));
      socketRef.current = nextSocket;

      nextSocket.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      nextSocket.onmessage = () => {
        notifyKitchenUpdate();
        invalidateKitchenOrders();
      };

      nextSocket.onerror = () => {
        nextSocket.close();
      };

      nextSocket.onclose = () => {
        if (socketRef.current === nextSocket) {
          socketRef.current = null;
        }

        if (isDisposed) {
          return;
        }

        const delay = Math.min(
          30000,
          1000 * 2 ** reconnectAttemptsRef.current,
        );
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      isDisposed = true;
      clearReconnectTimeout();

      const activeSocket = socketRef.current;
      socketRef.current = null;
      activeSocket?.close();
    };
  }, [companyId]);
}
