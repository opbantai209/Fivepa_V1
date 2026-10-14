import { useEffect, useRef } from 'react';
import { Message, Order } from '../../types';

export interface UseWorkstreamRealtimeProps {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentUser?: { id: string } | null;
  impersonatedUser?: { id: string } | null;
}

/**
 * Hook responsible for establishing and maintaining the WebSocket connection
 * for real-time workstream message synchronization and order updates.
 */
export function useWorkstreamRealtime({
  setMessages,
  setOrders,
  currentUser,
  impersonatedUser
}: UseWorkstreamRealtimeProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const activeUser = impersonatedUser || currentUser;
    const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token') || activeUser?.id || 'admin_user';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?token=${encodeURIComponent(token)}`;

    let reconnectTimeout: any = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('Real-time Workstream WebSocket connected successfully');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MESSAGE_RECEIVED' && data.message) {
            const incomingMsg = data.message;
            setMessages(prev => {
              const alreadyExists = prev.some(m => m.id === incomingMsg.id);
              if (alreadyExists) return prev;
              const next = [...prev, incomingMsg];
              return next.sort((a, b) => (a.id > b.id ? 1 : -1));
            });
            setOrders(prev => prev.map(o => {
              if (o.id === incomingMsg.orderId) {
                return {
                  ...o,
                  lastMessage: incomingMsg.text,
                  lastMessageTime: incomingMsg.timestamp
                };
              }
              return o;
            }));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error encountered:', err);
      };

      socket.onclose = () => {
        console.log('Workstream WebSocket disconnected, scheduling reconnect...');
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [currentUser, impersonatedUser, setMessages, setOrders]);

  return {
    wsRef
  };
}
