'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Avatar } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { HomeVisit } from '@/lib/types';

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

export default function VisitDetailPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [visit, setVisit] = useState<HomeVisit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reportData, setReportData] = useState({
    report: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    oxygenSaturation: '',
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      const visitData = db.getHomeVisitById(params.id as string);
      if (visitData) {
        setVisit(visitData);
        if (visitData.vitalSigns) {
          setReportData({
            report: visitData.report || '',
            bloodPressure: visitData.vitalSigns.bloodPressure || '',
            heartRate: String(visitData.vitalSigns.heartRate || ''),
            temperature: String(visitData.vitalSigns.temperature || ''),
            weight: String(visitData.vitalSigns.weight || ''),
            oxygenSaturation: String(visitData.vitalSigns.oxygenSaturation || ''),
            notes: visitData.notes || '',
          });
        }
      }
    }
  }, [user, params.id]);

  const handleStatusChange = (newStatus: string) => {
    if (!visit) return;
    
    const updates: Partial<HomeVisit> = { status: newStatus as any };
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date();
    }
    
    if (newStatus === 'in_progress') {
      updates.status = 'in_progress';
    }
    
    const updated = db.updateHomeVisit(visit.id, updates);
    if (updated) {
      setVisit(updated);
    }
  };

  const handleSaveReport = () => {
    if (!visit) return;
    
    const updated = db.updateHomeVisit(visit.id, {
      report: reportData.report,
      notes: reportData.notes,
      vitalSigns: {
        bloodPressure: reportData.bloodPressure || undefined,
        heartRate: reportData.heartRate ? parseInt(reportData.heartRate) : undefined,
        temperature: reportData.temperature ? parseFloat(reportData.temperature) : undefined,
        weight: reportData.weight ? parseFloat(reportData.weight) : undefined,
        oxygenSaturation: reportData.oxygenSaturation ? parseInt(reportData.oxygenSaturation) : undefined,
      },
      status: 'completed',
      completedAt: new Date(),
    });
    
    if (updated) {
      setVisit(updated);
      setIsEditing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!visit) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500">Visite non trouvée</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Visite à domicile
              </h1>
              <Badge variant={statusColors[visit.status]}>
                {statusLabels[visit.status]}
              </Badge>
            </div>
            <p className="text-zinc-500">
              {visit.patient ? `${visit.patient.user.firstName} ${visit.patient.user.lastName}` : 'Patient'} ·{' '}
              {new Date(visit.scheduledDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} à {visit.scheduledTime}
            </p>
          </div>
          <div className="flex gap-2">
            {visit.status === 'scheduled' && hasRole(['agent_terrain', 'medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
              <Button onClick={() => handleStatusChange('in_progress')}>
                Commencer la visite
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Informations de la visite
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Patient</p>
                  <p className="font-medium">{visit.patient?.user.firstName} {visit.patient?.user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Agent</p>
                  <p className="font-medium">{visit.agent?.firstName} {visit.agent?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Date prévue</p>
                  <p className="font-medium">{new Date(visit.scheduledDate).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Heure</p>
                  <p className="font-medium">{visit.scheduledTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-zinc-500">Adresse</p>
                  <p className="font-medium">{visit.address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-zinc-500">Motif</p>
                  <p className="font-medium">{visit.reason}</p>
                </div>
              </div>
            </Card>

            {(visit.status === 'in_progress' || visit.status === 'report_pending' || visit.status === 'completed') && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Rapport de visite
                  </h2>
                  {!isEditing && visit.status !== 'completed' && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Modifier
                    </Button>
                  )}
                </div>

                {(isEditing || visit.status === 'in_progress' || visit.status === 'report_pending') ? (
                  <div className="space-y-4">
                    <h3 className="font-medium text-zinc-800 dark:text-zinc-200">Signes vitaux</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Input
                        label="Tension"
                        placeholder="120/80"
                        value={reportData.bloodPressure}
                        onChange={(e) => setReportData({ ...reportData, bloodPressure: e.target.value })}
                      />
                      <Input
                        label="Pouls (bpm)"
                        type="number"
                        placeholder="72"
                        value={reportData.heartRate}
                        onChange={(e) => setReportData({ ...reportData, heartRate: e.target.value })}
                      />
                      <Input
                        label="Température (°C)"
                        type="number"
                        step="0.1"
                        placeholder="36.8"
                        value={reportData.temperature}
                        onChange={(e) => setReportData({ ...reportData, temperature: e.target.value })}
                      />
                      <Input
                        label="Poids (kg)"
                        type="number"
                        step="0.1"
                        placeholder="70"
                        value={reportData.weight}
                        onChange={(e) => setReportData({ ...reportData, weight: e.target.value })}
                      />
                      <Input
                        label="Saturation O2 (%)"
                        type="number"
                        placeholder="98"
                        value={reportData.oxygenSaturation}
                        onChange={(e) => setReportData({ ...reportData, oxygenSaturation: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Notes
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                        rows={3}
                        value={reportData.notes}
                        onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                        placeholder="Notes sur la visite..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Rapport
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                        rows={6}
                        value={reportData.report}
                        onChange={(e) => setReportData({ ...reportData, report: e.target.value })}
                        placeholder="Rapport détaillé de la visite..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveReport}>
                        Sauvegarder et terminer
                      </Button>
                      {isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visit.vitalSigns && (
                      <div className="grid grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-500">Tension</p>
                          <p className="font-semibold">{visit.vitalSigns.bloodPressure || '-'}</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-500">Pouls</p>
                          <p className="font-semibold">{visit.vitalSigns.heartRate || '-'}</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-500">Temp</p>
                          <p className="font-semibold">{visit.vitalSigns.temperature || '-'}</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-500">Poids</p>
                          <p className="font-semibold">{visit.vitalSigns.weight || '-'}</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-500">Sat O2</p>
                          <p className="font-semibold">{visit.vitalSigns.oxygenSaturation || '-'}</p>
                        </div>
                      </div>
                    )}
                    {visit.report && (
                      <div>
                        <p className="text-sm text-zinc-500 mb-1">Rapport</p>
                        <p className="whitespace-pre-wrap">{visit.report}</p>
                      </div>
                    )}
                    {visit.notes && (
                      <div>
                        <p className="text-sm text-zinc-500 mb-1">Notes</p>
                        <p className="whitespace-pre-wrap">{visit.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Contact d&apos;urgence
              </h2>
              {visit.patient && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-500">Nom</p>
                    <p className="font-medium">{visit.patient.familyContact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Téléphone</p>
                    <p className="font-medium">{visit.patient.familyPhone || '-'}</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Actions
              </h2>
              <div className="space-y-2">
                {visit.status === 'scheduled' && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    Annuler la visite
                  </Button>
                )}
                <Button 
                  className="w-full" 
                  variant="ghost"
                  onClick={() => router.push(`/patients/${visit.patientId}`)}
                >
                  Voir dossier patient
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
