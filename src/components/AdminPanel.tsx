import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Activity, 
  Settings, 
  ShieldAlert, 
  ArrowLeft, 
  BarChart3, 
  Database,
  Search,
  MoreVertical,
  LogOut,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { AdminFeedbackDashboard } from './AdminFeedbackDashboard';

interface AdminPanelProps {
  onClose: () => void;
  allUsers: any[];
  globalStats: any;
}

export function AdminPanel({ onClose, allUsers, globalStats }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'feedback'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGenerations = (allUsers.reduce((acc, u) => acc + (u.history?.length || 0), 0)) + (globalStats?.anonymousGenerations || 0);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#141414] font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center">
            <ShieldAlert className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight leading-tight">Admin Center</h2>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Workspace</p>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium text-sm">Vue d'ensemble</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Utilisateurs</span>
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'system' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium text-sm">Système</span>
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'feedback' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium text-sm">Feedback</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button 
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Quitter l'Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeTab === 'overview' && 'Vue d\'ensemble'}
              {activeTab === 'users' && 'Gestion des utilisateurs'}
              {activeTab === 'system' && 'État du système'}
              {activeTab === 'feedback' && 'Gestion des feedbacks'}
            </h1>
            <p className="text-sm text-black/50">Mise à jour en temps réel sécurisée.</p>
          </div>
          <button className="p-2 border border-black/10 text-black/50 hover:bg-black/5 rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-black/40">
                      <Users className="w-5 h-5" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Utilisateurs Google</h3>
                    </div>
                    <p className="text-4xl font-bold">{allUsers.length}</p>
                    <p className="text-xs text-black/40 mt-2">Comptes authentifiés existants</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-black/40">
                      <Activity className="w-5 h-5" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Générations Anonymes</h3>
                    </div>
                    <p className="text-4xl font-bold">{globalStats?.anonymousGenerations || 0}</p>
                    <p className="text-xs text-black/40 mt-2">Via clés d'API (BYOK)</p>
                  </div>
                  <div className="bg-black p-6 rounded-3xl border border-black shadow-sm text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF4D00] rounded-full blur-3xl opacity-20" />
                    <div className="flex items-center gap-3 mb-4 text-white/60 relative z-10">
                      <BarChart3 className="w-5 h-5" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">Total Générations</h3>
                    </div>
                    <p className="text-4xl font-bold relative z-10">{totalGenerations}</p>
                    <p className="text-xs text-white/60 mt-2 relative z-10">Toutes méthodes confondues</p>
                  </div>
                </div>

                {/* Recent Users preview */}
                <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Inscriptions récentes</h3>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-[#FF4D00] hover:text-[#E64500] uppercase tracking-widest"
                    >
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-4">
                    {allUsers.slice(0, 5).map((u, i) => (
                       <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">
                            {u.email?.[0].toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.email}</p>
                            <p className="text-xs text-black/50">{u.history?.length || 0} générations à son actif</p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-black/50">Activité récente</p>
                          <p className="text-sm font-medium">
                            {u.generations?.length > 0 ? new Date(u.generations[u.generations.length - 1]).toLocaleDateString() : '--'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex bg-white border border-black/5 rounded-2xl p-2 items-center shadow-sm">
                  <Search className="w-5 h-5 text-black/40 ml-3" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par adresse email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm px-4 py-2"
                  />
                </div>

                <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-black/5">
                        <tr>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-black/50">Utilisateur</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-black/50">Générations</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-black/50">Dernière activité</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-black/50">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-black/40">
                              Aucun utilisateur trouvé.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center font-bold text-xs">
                                    {u.email?.[0].toUpperCase() || '?'}
                                  </div>
                                  <span className="font-medium">{u.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-black/60 font-mono">
                                {u.history?.length || 0}
                              </td>
                              <td className="px-6 py-4 text-black/60">
                                {u.generations?.length > 0 ? new Date(u.generations[u.generations.length - 1]).toLocaleString() : 'Jamais'}
                              </td>
                              <td className="px-6 py-4">
                                <button className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Sécurité et Accès</h3>
                  <p className="text-sm text-black/60 mb-8 leading-relaxed">
                    Le Dashboard administrateur est un environnement protégé. Vous y accédez grâce à vos droits élevés liés à votre adresse email Google.
                  </p>
                  <button 
                    onClick={onClose}
                    className="flex justify-center items-center gap-3 w-full px-6 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-bold transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Quitter l'espace administrateur
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'feedback' && <AdminFeedbackDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
