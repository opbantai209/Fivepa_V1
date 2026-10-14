import { Order, Message } from '../../types';

export interface UseWorkstreamEscrowProps {
  selectedOrder?: Order | null;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook responsible for managing authoritative workstream escrow release and review submission.
 */
export function useWorkstreamEscrow({
  selectedOrder,
  setOrders,
  setSelectedOrder,
  setMessages
}: UseWorkstreamEscrowProps) {

  const handleReleaseEscrow = async (review: { rating: number; comment: string }) => {
    if (!selectedOrder) return;

    const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // Call real backend escrow-release API first
    try {
      const releaseRes = await fetch('/api/payments/escrow/release', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ orderId: selectedOrder.id })
      });

      if (!releaseRes.ok) {
        const errData = await releaseRes.json().catch(() => ({}));
        console.warn('Backend escrow release failed:', errData.error);
        alert(errData.error || 'Failed to release escrow funds. Workstream status remains unchanged.');
        return;
      }

      const data = await releaseRes.json();
      const updatedOrder = data.order || { ...selectedOrder, status: 'completed' };
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);

      // Add completion system event
      const sysMsg: Message = {
        id: `msg_${Date.now()}`,
        orderId: selectedOrder.id,
        senderId: 'system',
        senderName: 'WorkSphere Escrow Vault',
        text: `🎉 Escrow funds ($${selectedOrder.amount.toLocaleString()}) released to seller! Workstream completed with ${review.rating}-star rating: "${review.comment}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
        metadata: {
          action: 'escrow_released',
          amount: selectedOrder.amount
        }
      };
      setMessages(prev => [...prev, sysMsg]);
    } catch (err) {
      console.error('Failed to call backend escrow release:', err);
      alert('Network error releasing escrow funds. Please try again.');
    }
  };

  return {
    handleReleaseEscrow
  };
}
