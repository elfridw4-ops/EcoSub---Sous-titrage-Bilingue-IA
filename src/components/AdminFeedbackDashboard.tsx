import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Feedback, FeedbackStatus } from '../types';

export function AdminFeedbackDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)));
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    await updateDoc(doc(db, 'feedbacks', id), { status });
  };

  return (
    <div className="p-6 bg-white rounded-3xl mt-6">
      <h2 className="text-2xl font-bold mb-6">Tableau de bord Feedback</h2>
      <div className="space-y-4">
        {feedbacks.map(f => (
          <div key={f.id} className="p-4 border rounded-xl flex justify-between items-center">
            <div>
              <p className="font-bold">{f.type.toUpperCase()} - {f.status}</p>
              <p className="text-sm text-gray-600">{f.message}</p>
              <p className="text-xs">{new Date(f.createdAt?.toDate()).toLocaleString()}</p>
            </div>
            <select value={f.status} onChange={(e) => updateStatus(f.id, e.target.value as FeedbackStatus)} className="p-2 border rounded">
              <option value="new">Nouveau</option>
              <option value="in_progress">En cours</option>
              <option value="planned">Planifié</option>
              <option value="resolved">Résolu</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
