import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FeedbackType } from '../types';
import { Star, CheckCircle2 } from 'lucide-react';

export function FeedbackForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const feedbackRef = collection(db, 'feedbacks');
      await addDoc(feedbackRef, {
        type,
        message,
        rating,
        status: 'new',
        createdAt: serverTimestamp(),
        page: window.location.pathname,
        version: 'v1.1.0',
        browser: navigator.userAgent,
        device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userEmail: auth.currentUser?.email,
        userId: auth.currentUser?.uid,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Erreur détaillée envoi feedback:", error);
      alert("Une erreur est survenue lors de l'envoi de votre retour. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-black mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Feedback envoyé</h2>
        <p className="text-black/60 mb-8">Merci de nous aider à améliorer EcoSub AI.</p>
        <button onClick={onClose} className="w-full py-3 bg-black text-white rounded-xl font-medium">Fermer</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Votre avis nous intéresse</h2>
        <p className="text-sm text-black/60 mt-1">Aidez-nous à améliorer cette fonctionnalité.</p>
      </div>
      
      <div className="space-y-4">
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value as FeedbackType)} 
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
        >
          <option value="general">Avis général</option>
          <option value="bug">Signaler un bug</option>
          <option value="suggestion">Suggestion</option>
          <option value="feature">Demande de fonctionnalité</option>
        </select>
        
        <div className="flex gap-1 items-center">
          {[1,2,3,4,5].map(n => (
            <button 
              key={n} 
              type="button" 
              onClick={() => setRating(n)} 
              className={`p-1 transition-colors ${rating >= n ? 'text-black' : 'text-black/20 hover:text-black/50'}`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>

        <textarea 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Dites-nous tout..."
          className="w-full p-4 h-32 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-black/10 font-medium hover:bg-black/5 transition-colors">Annuler</button>
        <button 
          type="submit" 
          disabled={loading} 
          className="flex-1 py-3 rounded-xl bg-black text-white font-medium hover:bg-black/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </form>
  );
}
