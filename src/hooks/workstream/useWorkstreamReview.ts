import { useState } from 'react';
import { Order } from '../../types';

export interface UseWorkstreamReviewProps {
  selectedOrder?: Order | null;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
}

/**
 * Hook responsible for managing workstream review state and submission.
 */
export function useWorkstreamReview({
  selectedOrder,
  setOrders,
  setSelectedOrder
}: UseWorkstreamReviewProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleSubmitReview = async (review: { rating: number; comment: string; gigId?: string; projectId?: string }): Promise<boolean> => {
    if (!selectedOrder) return false;
    try {
      const token = localStorage.getItem('workperhour_token') || localStorage.getItem('token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          targetUserId: selectedOrder.sellerId,
          rating: review.rating,
          comment: review.comment,
          orderTitle: selectedOrder.title,
          gigId: review.gigId,
          projectId: review.projectId
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedOrder = { ...selectedOrder, review: data.review };
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn('Review submission warning:', err.error);
        alert(err.error || 'Failed to submit review.');
        return false;
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Network error submitting review.');
      return false;
    }
  };

  return {
    isReviewModalOpen,
    setIsReviewModalOpen,
    handleSubmitReview
  };
}
