import { Order, Message } from '../../types';

export interface UseWorkstreamRevisionProps {
  selectedOrder?: Order | null;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook responsible for managing workstream revision requests, persistent backend storage,
 * and delivery version tracking.
 */
export function useWorkstreamRevision({
  selectedOrder,
  setOrders,
  setSelectedOrder,
  setMessages
}: UseWorkstreamRevisionProps) {

  const handleRequestRevision = async (reason: string) => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder.id}/revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.order || { ...selectedOrder, status: 'revision' };
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);

        if (setMessages) {
          const msgRes = await fetch(`/api/messages/${selectedOrder.id}`, {
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
          });
          if (msgRes.ok) {
            const freshMessages = await msgRes.json();
            if (Array.isArray(freshMessages)) {
              setMessages(prev => [...prev.filter(m => m.orderId !== selectedOrder.id), ...freshMessages]);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to submit persistent revision request:', err);
    }

    // Local state fallback
    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'revision' } : o));
    setSelectedOrder(prev => prev ? { ...prev, status: 'revision' } : null);

    if (setMessages) {
      const sysMsg: Message = {
        id: `msg_${Date.now()}`,
        orderId: selectedOrder.id,
        senderId: 'system',
        senderName: 'WorkSphere Quality Assurance',
        text: `🔄 Revision requested: "${reason}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
        metadata: {
          action: 'revision_requested',
          reason
        }
      };
      setMessages(prev => [...prev, sysMsg]);
    }
  };

  return {
    handleRequestRevision
  };
}
