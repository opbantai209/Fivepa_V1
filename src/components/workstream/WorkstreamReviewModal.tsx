import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { WorkstreamItem } from './types';

interface WorkstreamReviewModalProps {
  isOpen: boolean;
  order: WorkstreamItem;
  onClose: () => void;
  onSubmitReview: (review: { rating: number; comment: string; gigId?: string; projectId?: string }) => Promise<boolean>;
}

export const WorkstreamReviewModal: React.FC<WorkstreamReviewModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmitReview
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('Excellent delivery! Fast turnaround and high quality.');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmitReview({
      rating,
      comment: comment.trim(),
      gigId: order.gigId,
      projectId: order.projectId
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fiverr-dark">Write Review & Feedback</h3>
              <p className="text-[11px] text-slate-400">Order #{order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-fiverr-dark font-bold uppercase tracking-wider text-[10px] mb-2">
              Rate Freelancer's Work
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono font-bold text-slate-600 text-sm">
                {hoverRating || rating}.0
              </span>
            </div>
          </div>

          <div>
            <label className="block text-fiverr-dark font-bold uppercase tracking-wider text-[10px] mb-1.5">
              Public Review & Feedback Note
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this freelancer..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fiverr-dark placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-fiverr-dark font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
