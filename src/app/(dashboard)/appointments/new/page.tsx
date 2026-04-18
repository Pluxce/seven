'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Patient } from '@/lib/types';

function NewAppointmentForm() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    type: 'consultation',
    reason: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin'])) {
      setPatients(db.getPatients());
    }
  }, [user, hasRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);
    db.createAppointment({
      patientId: selectedPatientId,
      medecinId: user?.id || '3',
      cabinetId: '1',
      appointmentDate,
      durationMinutes: parseInt(formData.duration),
      status: 'scheduled',
      type: formData.type,
      reason: formData.reason,
    });
    router.push('/appointments');
  };

  const handleClose = () => {
    router.push('/patients');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin'])) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500">Vous n&apos;avez pas accès à cette page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Nouveau rendez-vous"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Patient</label>
            <select
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.firstName} {p.user.lastName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Heure"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Durée</label>
              <select
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1h</option>
                <option value="90">1h30</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
              <select
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="consultation">Consultation</option>
                <option value="follow_up">Suivi</option>
                <option value="evaluation">Évaluation</option>
                <option value="emergency">Urgence</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Motif"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Raison de la consultation"
          />

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Créer le RDV
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    }>
      <NewAppointmentForm />
    </Suspense>
  );
}
