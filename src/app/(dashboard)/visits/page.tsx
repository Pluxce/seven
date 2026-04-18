'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Modal, Avatar } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { HomeVisit, Patient } from '@/lib/types';

const statusLabels: Record<string, string> = {
  scheduled: 'Programmée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  report_pending: 'Rapport en attente',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  report_pending: 'warning',
};

export default function VisitsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      let filtered: HomeVisit[];
      
      if (user.role === 'agent_terrain') {
        filtered = db.getHomeVisits({ agentId: user.id });
      } else if (user.role === 'patient') {
        const patient = db.getPatientByUserId(user.id);
        filtered = patient ? db.getHomeVisits({ patientId: patient.id }) : [];
      } else {
        filtered = db.getHomeVisits();
      }
      
      if (filter !== 'all') {
        filtered = filtered.filter(v => v.status === filter);
      }
      
      setVisits(filtered);
      setPatients(db.getPatients());
    }
  }, [user, filter]);

  const getTodayVisits = () => {
    const today = new Date().toDateString();
    return visits.filter(v => new Date(v.scheduledDate).toDateString() === today);
  };

  const getUpcomingVisits = () => {
    const today = new Date();
    return visits.filter(v => new Date(v.scheduledDate) >= today && v.status === 'scheduled');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const canManageVisits = hasRole(['agent_terrain', 'medecin', 'chef_cabinet', 'admin', 'super_admin']);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Visites à domicile
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {visits.length} visite{visits.length !== 1 ? 's' : ''} · {getTodayVisits().length} aujourd&apos;hui
            </p>
          </div>
          {canManageVisits && (
            <Button onClick={() => setIsModalOpen(true)}>
              + Planifier une visite
            </Button>
          )}
        </div>

        {user.role === 'agent_terrain' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-zinc-500">Aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{getTodayVisits().length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-zinc-500">Cette semaine</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{getUpcomingVisits().length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-zinc-500">Rapports en attente</p>
              <p className="text-2xl font-bold text-yellow-500">
                {visits.filter(v => v.status === 'report_pending').length}
              </p>
            </Card>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'scheduled', label: 'Programmées' },
            { value: 'in_progress', label: 'En cours' },
            { value: 'completed', label: 'Terminées' },
            { value: 'report_pending', label: 'Rapport en attente' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filter === f.value
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {visits.length > 0 ? (
            visits.map((visit) => (
              <Card 
                key={visit.id} 
                hover 
                className="p-6 cursor-pointer"
                onClick={() => router.push(`/visits/${visit.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={statusColors[visit.status]}>
                        {statusLabels[visit.status]}
                      </Badge>
                      {user.role !== 'patient' && visit.agent && (
                        <span className="text-sm text-zinc-500">
                          Agent: {visit.agent.firstName} {visit.agent.lastName}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {visit.patient?.user?.firstName} {visit.patient?.user?.lastName}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(visit.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' à '}
                        {visit.scheduledTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {visit.address}
                      </span>
                    </div>
                    
                    <p className="text-sm text-zinc-500 mt-2">{visit.reason}</p>
                  </div>
                  
                  <div className="text-right">
                    {visit.status === 'scheduled' && canManageVisits && (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/visits/${visit.id}/report`);
                        }}
                      >
                        Commencer
                      </Button>
                    )}
                    {visit.status === 'in_progress' && canManageVisits && (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/visits/${visit.id}/report`);
                        }}
                      >
                        Finaliser
                      </Button>
                    )}
                    {visit.status === 'report_pending' && canManageVisits && (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/visits/${visit.id}/report`);
                        }}
                      >
                        Rédiger rapport
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">
                Aucune visite à domicile trouvée
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Planifier une visite à domicile"
        size="lg"
      >
        <NewVisitForm
          patients={patients}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </DashboardLayout>
  );
}

function NewVisitForm({ patients, onClose }: { patients: Patient[]; onClose: () => void }) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '09:00',
    duration: '45',
    address: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating visit:', formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Patient</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          value={formData.patientId}
          onChange={(e) => {
            const patient = patients.find(p => p.id === e.target.value);
            setFormData({ 
              ...formData, 
              patientId: e.target.value,
              address: patient?.address || ''
            });
          }}
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

      <Input
        label="Adresse"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="Adresse du patient"
        required
      />

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
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1h</option>
            <option value="90">1h30</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Motif de la visite</label>
        <textarea
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          rows={3}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Raison de la visite à domicile..."
          required
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          Planifier la visite
        </Button>
      </div>
    </form>
  );
}
