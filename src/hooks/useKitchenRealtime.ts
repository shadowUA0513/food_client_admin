import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef } from "react";
import { AUTH_COOKIE_KEY } from "../service/api/constant";
import { env } from "../service/api/env";

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

export function useKitchenRealtime(companyId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const invalidateKitchenOrders = useEffectEvent(() => {
    if (!companyId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: ["kitchen-orders", companyId],
    });
  });

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
