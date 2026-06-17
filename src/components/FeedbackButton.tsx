import { useState } from 'react';
import { FeedbackForm } from './FeedbackForm';
import { MessageSquarePlus } from 'lucide-react';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-[90] flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full shadow-lg hover:bg-black/90 transition-all text-sm font-bold"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full">
            <FeedbackForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
