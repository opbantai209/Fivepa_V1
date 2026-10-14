import { useState, useCallback, useRef } from 'react';
import { Message } from '../../types';

/**
 * Hook responsible for managing workstream messages state, per-workstream cache isolation,
 * race-condition prevention during workstream switching, and message ordering.
 */
export function useWorkstreamMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  
  // Guard against out-of-order responses when user rapidly switches workstreams
  const activeFetchOrderIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (orderId: string) => {
    if (!orderId) return;
    activeFetchOrderIdRef.current = orderId;

    try {
      const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
      const res = await fetch(`/api/messages/${orderId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.status === 401) {
        console.error('Authentication required for messages');
        return;
      }

      // Check race condition: if user switched to another workstream while fetch was in flight, ignore
      if (activeFetchOrderIdRef.current !== orderId) {
        return;
      }

      const data = res.ok ? await res.json() : [];
      const newOrderMessages: Message[] = Array.isArray(data) ? data : [];

      // Isolated cache merge: preserve all messages for other workstreams, update this order's messages
      setMessages(prev => {
        const otherMessages = prev.filter(m => m.orderId !== orderId);
        const combined = [...otherMessages, ...newOrderMessages];
        return combined;
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  return {
    messages,
    setMessages,
    newMessageText,
    setNewMessageText,
    fetchMessages
  };
}
