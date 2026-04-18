'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { MedicalRecord, Patient } from '@/lib/types';

const typeLabels: Record<string, string> = {
  consultation_note: 'Consultation',
  prescription: 'Ordonnance',
  lab_result: 'Résultat Labo',
  imaging: 'Imagerie',
  report: 'Rapport',
};

const typeColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  consultation_note: 'info',
  prescription: 'warning',
  lab_result: 'success',
  imaging: 'default',
  report: 'default',
};

const typeIcons: Record<string, string> = {
  consultation_note: '🩺',
  prescription: '💊',
  lab_result: '🔬',
  imaging: '🩻',
  report: '📋',
};

export default function RecordsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MedicalRecord | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const loadRecords = () => {
    if (!user) return;
    let recs: MedicalRecord[];
    if (user.role === 'patient') {
      const patient = db.getPatientByUserId(user.id);
      recs = patient ? db.getMedicalRecords(patient.id) : [];
    } else {
      recs = db.getMedicalRecords();
    }
    setRecords(recs);
    setPatients(db.getPatients());
  };

  useEffect(() => { if (user) loadRecords(); }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = (data: any) => {
    db.createMedicalRecord({ ...data, cabinetId: '1', createdBy: user!.id });
    loadRecords();
    setIsModalOpen(false);
    showToast('Document créé avec succès');
  };

  const handleEdit = (data: any) => {
    if (!editRecord) return;
    db.updateMedicalRecord(editRecord.id, data);
    loadRecords();
    setEditRecord(null);
    showToast('Document mis à jour');
  };

  const handleDelete = (record: MedicalRecord) => {
    db.deleteMedicalRecord(record.id);
    loadRecords();
    setDeleteConfirm(null);
    showToast('Document supprimé', 'error');
  };

  const getPatientName = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    return p ? `${p.user.firstName} ${p.user.lastName}` : 'Patient';
  };

  const filtered = records.filter(r => {
    const matchType = filter === 'all' || r.recordType === filter;
    const matchSearch = searchQuery === '' || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || (r.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" /></div>;
  }

  return (
    <DashboardLayout>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dossiers médicaux</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{records.length} document{records.length !== 1 ? 's' : ''}</p>
          </div>
          {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
            <Button onClick={() => setIsModalOpen(true)}>+ Nouveau document</Button>
          )}
        </div>

        {/* Search + type filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Rechercher dans les documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              icon={<svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'consultation_note', label: '🩺 Consultations' },
              { value: 'prescription', label: '💊 Ordonnances' },
              { value: 'lab_result', label: '🔬 Labo' },
              { value: 'imaging', label: '🩻 Imagerie' },
              { value: 'report', label: '📋 Rapports' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${filter === f.value ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📂</div>
              <p className="text-zinc-500 font-medium">Aucun document trouvé</p>
            </div>
          ) : (
            filtered.map(record => (
              <Card key={record.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-2xl">
                    {typeIcons[record.recordType] || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={typeColors[record.recordType] || 'default'}>
                        {typeLabels[record.recordType] || record.recordType}
                      </Badge>
                      {user.role !== 'patient' && (
                        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {getPatientName(record.patientId)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{record.title}</h3>
                    {record.content && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{record.content}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2">
                      {new Date(record.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(record)}>
                      Voir
                    </Button>
                    {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditRecord(record)}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteConfirm(record)}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau document médical" size="lg">
        <RecordForm patients={patients} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editRecord} onClose={() => setEditRecord(null)} title="Modifier le document" size="lg">
        {editRecord && (
          <RecordForm
            patients={patients}
            initial={editRecord}
            onSubmit={handleEdit}
            onCancel={() => setEditRecord(null)}
            isEdit
          />
        )}
      </Modal>

      {/* View modal */}
      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title={viewRecord?.title || 'Document'} size="lg">
        {viewRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeColors[viewRecord.recordType] || 'default'}>
                {typeLabels[viewRecord.recordType] || viewRecord.recordType}
              </Badge>
              <span className="text-sm text-zinc-500">
                {new Date(viewRecord.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-5 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
              {viewRecord.content || 'Aucun contenu texte.'}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setViewRecord(null)}>Fermer</Button>
              <Button className="flex-1" onClick={() => {
                const blob = new Blob([viewRecord.content || ''], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${viewRecord.title}.txt`;
                a.click();
              }}>
                Télécharger
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer le document" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">Supprimer <strong>"{deleteConfirm.title}"</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function RecordForm({ patients, initial, onSubmit, onCancel, isEdit }: {
  patients: Patient[];
  initial?: MedicalRecord;
  onSubmit: (d: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    patientId: initial?.patientId || '',
    title: initial?.title || '',
    recordType: initial?.recordType || 'consultation_note',
    content: initial?.content || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Patient *</label>
          <select
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
            value={form.patientId}
            onChange={e => setForm({...form, patientId: e.target.value})}
            required
          >
            <option value="">Sélectionner un patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>
            ))}
          </select>
        </div>
      )}
      <Input label="Titre *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Compte-rendu de consultation" required />
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type de document</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
          value={form.recordType}
          onChange={e => setForm({...form, recordType: e.target.value})}
        >
          <option value="consultation_note">🩺 Note de consultation</option>
          <option value="prescription">💊 Ordonnance</option>
          <option value="lab_result">🔬 Résultat laboratoire</option>
          <option value="imaging">🩻 Imagerie</option>
          <option value="report">📋 Rapport médical</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Contenu</label>
        <textarea
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800 text-sm resize-none"
          rows={8}
          value={form.content}
          onChange={e => setForm({...form, content: e.target.value})}
          placeholder="Contenu du document médical..."
        />
      </div>
      <div className="flex gap-4 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button type="submit" className="flex-1">{isEdit ? 'Enregistrer' : 'Créer le document'}</Button>
      </div>
    </form>
  );
}
