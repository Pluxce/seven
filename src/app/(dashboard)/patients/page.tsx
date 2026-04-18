'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Avatar, Button, Input, Modal } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Patient } from '@/lib/types';

export default function PatientsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) setPatients(db.getPatients());
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = (data: any) => {
    const p = db.createPatient(data);
    setPatients(db.getPatients());
    setIsModalOpen(false);
    showToast(`Patient ${p.user.firstName} ${p.user.lastName} créé avec succès`);
  };

  const handleEdit = (data: Partial<Patient>) => {
    if (!editPatient) return;
    db.updatePatient(editPatient.id, data);
    const userUpdates = {
      firstName: (data as any).firstName || editPatient.user.firstName,
      lastName: (data as any).lastName || editPatient.user.lastName,
      phone: (data as any).phone || editPatient.user.phone,
      address: (data as any).address || editPatient.user.address,
    };
    db.updateUser(editPatient.userId, userUpdates);
    setPatients(db.getPatients());
    setEditPatient(null);
    showToast('Patient mis à jour');
  };

  const handleDelete = (patient: Patient) => {
    db.deletePatient(patient.id);
    setPatients(db.getPatients());
    setDeleteConfirm(null);
    showToast('Patient supprimé', 'error');
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase()) || p.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.user.isActive : !p.user.isActive);
    return matchSearch && matchStatus;
  });

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" /></div>;
  }

  if (!hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin'])) {
    return <DashboardLayout><div className="text-center py-12"><p className="text-zinc-500">Accès non autorisé</p></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Patients</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} · {filteredPatients.length} affiché{filteredPatients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>+ Nouveau patient</Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                icon={<svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-full border border-zinc-300 px-4 py-2.5 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-sm"
            >
              <option value="all">Tous les patients</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </Card>

        {/* Patient grid */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-zinc-500 font-medium">Aucun patient trouvé</p>
            <Button className="mt-4" size="sm" onClick={() => setIsModalOpen(true)}>+ Ajouter un patient</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => (
              <Card key={patient.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar name={`${patient.user.firstName} ${patient.user.lastName}`} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {patient.user.firstName} {patient.user.lastName}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{patient.user.email}</p>
                    {patient.user.dateOfBirth && (
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {new Date().getFullYear() - new Date(patient.user.dateOfBirth).getFullYear()} ans
                        {patient.user.gender === 'male' ? ' · M' : patient.user.gender === 'female' ? ' · F' : ''}
                      </p>
                    )}
                  </div>
                  <Badge variant={patient.user.isActive ? 'success' : 'default'}>
                    {patient.user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                {/* Medical info */}
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {patient.bloodType && <Badge variant="info">{patient.bloodType}</Badge>}
                    {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                      <Badge variant="warning">{patient.chronicConditions.length} pathologie{patient.chronicConditions.length !== 1 ? 's' : ''}</Badge>
                    )}
                    {patient.allergies && patient.allergies.length > 0 && (
                      <Badge variant="error">{patient.allergies.length} allergie{patient.allergies.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  {patient.user.phone && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {patient.user.phone}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/patients/${patient.id}`)}>
                    Dossier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/appointments/new?patient=${patient.id}`)}>
                    RDV
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditPatient(patient)}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteConfirm(patient)}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau patient" size="lg">
        <PatientForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editPatient} onClose={() => setEditPatient(null)} title="Modifier le patient" size="lg">
        {editPatient && (
          <PatientForm
            initialValues={{
              firstName: editPatient.user.firstName,
              lastName: editPatient.user.lastName,
              email: editPatient.user.email,
              phone: editPatient.user.phone || '',
              dateOfBirth: editPatient.user.dateOfBirth ? new Date(editPatient.user.dateOfBirth).toISOString().split('T')[0] : '',
              gender: editPatient.user.gender || '',
              bloodType: editPatient.bloodType || '',
              insuranceProvider: editPatient.insuranceProvider || '',
              insuranceNumber: editPatient.insuranceNumber || '',
              address: editPatient.address || '',
              familyContact: editPatient.familyContact || '',
              familyPhone: editPatient.familyPhone || '',
              allergies: editPatient.allergies?.join(', ') || '',
              chronicConditions: editPatient.chronicConditions?.join(', ') || '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditPatient(null)}
            isEdit
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmer la suppression" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Êtes-vous sûr de vouloir supprimer le patient <strong>{deleteConfirm.user.firstName} {deleteConfirm.user.lastName}</strong> ? Cette action est irréversible.
            </p>
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

interface PatientFormProps {
  initialValues?: Record<string, string>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function PatientForm({ initialValues, onSubmit, onCancel, isEdit }: PatientFormProps) {
  const [form, setForm] = useState({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || '',
    dateOfBirth: initialValues?.dateOfBirth || '',
    gender: initialValues?.gender || '',
    bloodType: initialValues?.bloodType || '',
    insuranceProvider: initialValues?.insuranceProvider || '',
    insuranceNumber: initialValues?.insuranceNumber || '',
    address: initialValues?.address || '',
    familyContact: initialValues?.familyContact || '',
    familyPhone: initialValues?.familyPhone || '',
    allergies: initialValues?.allergies || '',
    chronicConditions: initialValues?.chronicConditions || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
  };

  const f = (field: string) => form[field as keyof typeof form];
  const s = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Prénom *" value={f('firstName')} onChange={e => s('firstName', e.target.value)} required />
        <Input label="Nom *" value={f('lastName')} onChange={e => s('lastName', e.target.value)} required />
      </div>
      <Input label="Email *" type="email" value={f('email')} onChange={e => s('email', e.target.value)} required disabled={isEdit} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Téléphone" type="tel" value={f('phone')} onChange={e => s('phone', e.target.value)} placeholder="+225 07 00 00 000" />
        <Input label="Adresse" value={f('address')} onChange={e => s('address', e.target.value)} placeholder="Cocody Angré, Abidjan" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date de naissance" type="date" value={f('dateOfBirth')} onChange={e => s('dateOfBirth', e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Genre</label>
          <select value={f('gender')} onChange={e => s('gender', e.target.value)}
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
            <option value="">Sélectionner...</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Groupe sanguin</label>
          <select value={f('bloodType')} onChange={e => s('bloodType', e.target.value)}
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm">
            <option value="">Sélectionner...</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input label="Assurance" value={f('insuranceProvider')} onChange={e => s('insuranceProvider', e.target.value)} />
      </div>
      <Input label="N° assurance" value={f('insuranceNumber')} onChange={e => s('insuranceNumber', e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Contact urgence" value={f('familyContact')} onChange={e => s('familyContact', e.target.value)} placeholder="Nom (Relation)" />
        <Input label="Tél. urgence" type="tel" value={f('familyPhone')} onChange={e => s('familyPhone', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Allergies (séparées par virgule)</label>
        <input value={f('allergies')} onChange={e => s('allergies', e.target.value)}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
          placeholder="Pénicilline, Aspirine..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Pathologies chroniques (séparées par virgule)</label>
        <input value={f('chronicConditions')} onChange={e => s('chronicConditions', e.target.value)}
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-sm"
          placeholder="Diabète, Hypertension..." />
      </div>
      <div className="flex gap-4 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button type="submit" className="flex-1">{isEdit ? 'Enregistrer' : 'Créer le patient'}</Button>
      </div>
    </form>
  );
}
