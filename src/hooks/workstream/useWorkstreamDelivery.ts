import { Order, Message } from '../../types';

export interface UseWorkstreamDeliveryProps {
  selectedOrder?: Order | null;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook responsible for managing workstream delivery state, persistent API submissions,
 * deliverable file tracking, and versioned delivery records.
 */
export function useWorkstreamDelivery({
  selectedOrder,
  setOrders,
  setSelectedOrder,
  setMessages
}: UseWorkstreamDeliveryProps) {

  const handleDeliverWork = async (delivery: { notes: string; files: Array<{ name: string; size: string; url: string }> }) => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder.id}/deliverable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          notes: delivery.notes,
          files: delivery.files
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.order || { ...selectedOrder, status: 'delivered', deliverableFiles: data.files || delivery.files };
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);

        // Fetch fresh thread messages
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
    } catch (err) {
      console.error('Failed to submit persistent deliverable:', err);
    }

    // Fallback local update if network is transiently offline
    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'delivered' } : o));
    setSelectedOrder(prev => prev ? { ...prev, status: 'delivered' } : null);

    const versionNum = ((selectedOrder as any).deliveries?.length || 0) + 1;
    const sysMsg: Message = {
      id: `msg_${Date.now()}`,
      orderId: selectedOrder.id,
      senderId: 'system',
      senderName: 'WorkSphere Deliveries',
      text: `📦 Deliverables v${versionNum} submitted: "${delivery.notes}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system',
      metadata: {
        action: 'deliverable_submitted',
        version: versionNum,
        notes: delivery.notes
      }
    };
    
    const fileMsgs: Message[] = delivery.files.map((file, i) => ({
      id: `msg_${Date.now()}_file_${i}`,
      orderId: selectedOrder.id,
      senderId: 'system',
      senderName: 'WorkSphere Deliveries',
      text: `File attached: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'file',
      fileInfo: {
        ...file,
        type: 'deliverable'
      }
    }));

    setMessages(prev => [...prev, sysMsg, ...fileMsgs]);
  };

  return {
    handleDeliverWork
  };
}
