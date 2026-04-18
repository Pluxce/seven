'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button, Modal } from '@/components/ui';
import { AppointmentRequest } from '@/lib/types';

const statusLabel: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  rejected: 'Rejetée',
};
const statusColor: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'error',
};

export default function DemandesPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  const [selected, setSelected] = useState<AppointmentRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<AppointmentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successModal, setSuccessModal] = useState<{ patient: any; password: string; request: AppointmentRequest } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && user && !hasRole(['chef_cabinet', 'admin', 'super_admin', 'medecin'])) router.push('/dashboard');
  }, [user, isLoading, router, hasRole]);

  const load = () => setRequests(db.getAppointmentRequests(filter === 'all' ? undefined : filter));
  useEffect(() => { load(); }, [filter]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirm = async (req: AppointmentRequest) => {
    setLoading(req.id);

    // 1. Confirm in local db (creates patient record, generates password)
    const result = db.confirmAppointmentRequest(req.id);
    if (!result) { showToast('Erreur lors de la confirmation', 'error'); setLoading(null); return; }

    const medecin = db.getMedecins().find(m => m.id === req.medecinId);
    const appointmentDate = req.preferredDate && req.preferredTime
      ? `${req.preferredDate}T${req.preferredTime}` : req.preferredDate;

    // 2. Create real account + send email via API route
    //    (creates Supabase auth user if configured, always sends email)
    try {
      await fetch('/api/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:           req.email,
          firstName:       req.firstName,
          lastName:        req.lastName,
          password:        result.password,
          appointmentDate: appointmentDate,
          doctorName:      medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : undefined,
        }),
      });
    } catch (e) {
      console.warn('confirm-appointment API call failed:', e);
    }

    setLoading(null);
    setSelected(null);
    setSuccessModal({ patient: result.patient, password: result.password, request: req });
    load();
  };

  const handleReject = () => {
    if (!rejectModal) return;
    db.rejectAppointmentRequest(rejectModal.id, rejectReason);
    setRejectModal(null);
    setRejectReason('');
    setSelected(null);
    showToast('Demande rejetée');
    load();
  };

  const medecins = db.getMedecins();
  const getMedecinName = (id?: string) => {
    if (!id) return 'Non précisé';
    const m = medecins.find(m => m.id === id);
    return m ? `Dr. ${m.firstName} ${m.lastName}` : id;
  };

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
    </div>
  );

  const pendingCount = db.getPendingRequestsCount();

  return (
    <DashboardLayout>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Demandes de rendez-vous</h1>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingCount}</span>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">Gérez les demandes en ligne et créez les comptes patients</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['pending', 'confirmed', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${filter === f ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
            >
              {f === 'all' ? 'Toutes' : statusLabel[f]}
              {f === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-zinc-500 font-medium">Aucune demande {filter !== 'all' ? statusLabel[filter].toLowerCase() : ''}</p>
            </div>
          ) : requests.map(req => (
            <Card key={req.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(req)}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-xl">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={statusColor[req.status]}>{statusLabel[req.status]}</Badge>
                    <span className="text-xs text-zinc-500">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {req.firstName} {req.lastName}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {req.reason} — {getMedecinName(req.medecinId)}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                    <span>📅 {req.preferredDate}{req.preferredTime ? ` à ${req.preferredTime}` : ''}</span>
                    <span>📞 {req.phone}</span>
                    <span>✉️ {req.email}</span>
                  </div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(req)}
                      disabled={loading === req.id}
                    >
                      {loading === req.id ? '...' : 'Confirmer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200"
                      onClick={() => { setRejectModal(req); setSelected(null); }}
                    >
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Détail de la demande" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Nom complet" value={`${selected.firstName} ${selected.lastName}`} />
              <InfoRow label="Téléphone" value={selected.phone} />
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Statut" value={statusLabel[selected.status]} />
              <InfoRow label="Date souhaitée" value={`${selected.preferredDate}${selected.preferredTime ? ' à ' + selected.preferredTime : ''}`} />
              <InfoRow label="Médecin" value={getMedecinName(selected.medecinId)} />
              <div className="col-span-2">
                <InfoRow label="Motif" value={selected.reason} />
              </div>
              {selected.message && (
                <div className="col-span-2">
                  <InfoRow label="Message" value={selected.message} />
                </div>
              )}
            </div>
            {selected.status === 'confirmed' && selected.generatedPassword && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Compte créé ✓</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Mot de passe généré : <code className="font-mono bg-emerald-100 dark:bg-emerald-800 px-2 py-0.5 rounded">{selected.generatedPassword}</code></p>
              </div>
            )}
            {selected.status === 'rejected' && selected.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">Motif de rejet</p>
                <p className="text-sm text-red-600">{selected.rejectionReason}</p>
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => handleConfirm(selected)}
                  disabled={loading === selected.id}
                >
                  {loading === selected.id ? 'Traitement...' : '✓ Confirmer et créer le compte'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-500 border-red-200"
                  onClick={() => { setRejectModal(selected); setSelected(null); }}
                >
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Rejeter la demande" size="sm">
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Rejeter la demande de <strong>{rejectModal.firstName} {rejectModal.lastName}</strong> ?
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Motif du rejet</label>
              <textarea
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none"
                rows={3}
                placeholder="Ex: Créneau indisponible, veuillez rappeler..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Annuler</Button>
              <Button variant="danger" className="flex-1" onClick={handleReject} disabled={!rejectReason.trim()}>
                Confirmer le rejet
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success modal after confirm */}
      <Modal isOpen={!!successModal} onClose={() => setSuccessModal(null)} title="Compte créé avec succès" size="md">
        {successModal && (
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {successModal.request.firstName} {successModal.request.lastName}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">Compte patient créé, email envoyé</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Email</span>
                <span className="font-medium">{successModal.request.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Mot de passe temporaire</span>
                <code className="font-mono bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-base">
                  {successModal.password}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">RDV</span>
                <span className="font-medium">
                  {successModal.request.preferredDate}{successModal.request.preferredTime ? ` à ${successModal.request.preferredTime}` : ''}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 text-center">Un email de bienvenue a été envoyé au patient avec ses identifiants.</p>
            <Button className="w-full" onClick={() => setSuccessModal(null)}>Fermer</Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
