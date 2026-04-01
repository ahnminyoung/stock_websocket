import { useEffect } from 'react';
import { createMarketSocket } from '../services/marketSocket.js';
import { useMarketStore } from '../stores/marketStore.js';

export const useMarketSocket = () => {
  const applySocketMessage = useMarketStore((state) => state.applySocketMessage);
  const setConnectionStatus = useMarketStore((state) => state.setConnectionStatus);

  useEffect(() => {
    let socketClient = null;
    let reconnectTimer = null;
    let keepAliveTimer = null;
    let isUnmounted = false;
    let retryCount = 0;

    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    };

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      setConnectionStatus('connecting');

      socketClient = createMarketSocket({
        onOpen: () => {
          retryCount = 0;
          setConnectionStatus('connected');
          socketClient.subscribe(['home-dashboard', 'domestic', 'overseas', 'watchlist']);

          keepAliveTimer = setInterval(() => {
            socketClient?.ping();
          }, 20000);
        },
        onClose: () => {
          if (isUnmounted) {
            return;
          }

          setConnectionStatus('disconnected');
          clearTimers();

          const delay = Math.min(1200 * 2 ** retryCount, 10000);
          retryCount += 1;
          reconnectTimer = setTimeout(connect, delay);
        },
        onError: () => {
          setConnectionStatus('error');
        },
        onMessage: (message) => {
          applySocketMessage(message);
        },
      });
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimers();
      socketClient?.close();
    };
  }, [applySocketMessage, setConnectionStatus]);
};
