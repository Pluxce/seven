'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Select } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';

interface ReportData {
  patientsCount: number;
  appointmentsCount: number;
  visitsCompleted: number;
  visitsScheduled: number;
  evaluationsCompleted: number;
  newPatients: number;
  cancelledAppointments: number;
  noShowAppointments: number;
}

export default function ReportsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [reportType, setReportType] = useState('weekly');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && !hasRole(['chef_cabinet', 'admin', 'super_admin', 'medecin'])) {
      router.push('/dashboard');
    }
  }, [user, hasRole, router]);

  const generateReport = () => {
    setIsGenerating(true);
    const patients = db.getPatients();
    const appointments = db.getAppointments();
    const visits = db.getHomeVisits();
    const evaluations = db.getGeriatricEvaluations();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setTimeout(() => {
      const newPatientsCount = patients.filter(p => {
        const created = new Date(p.createdAt);
        return dateRange === 'week' ? created >= weekAgo : created >= monthAgo;
      }).length;

      const appointmentsInRange = appointments.filter(a => {
        const date = new Date(a.appointmentDate);
        return dateRange === 'week' ? date >= weekAgo : date >= monthAgo;
      });

      const visitsInRange = visits.filter(v => {
        const date = new Date(v.scheduledDate);
        return dateRange === 'week' ? date >= weekAgo : date >= monthAgo;
      });

      const evaluationsInRange = evaluations.filter(e => {
        const date = new Date(e.evaluationDate);
        return dateRange === 'week' ? date >= weekAgo : date >= monthAgo;
      });

      setReportData({
        patientsCount: patients.length,
        appointmentsCount: appointmentsInRange.length,
        visitsCompleted: visitsInRange.filter(v => v.status === 'completed').length,
        visitsScheduled: visitsInRange.filter(v => v.status === 'scheduled').length,
        evaluationsCompleted: evaluationsInRange.filter(e => e.status === 'completed').length,
        newPatients: newPatientsCount,
        cancelledAppointments: appointmentsInRange.filter(a => a.status === 'cancelled').length,
        noShowAppointments: appointmentsInRange.filter(a => a.status === 'no_show').length,
      });
      setIsGenerating(false);
    }, 1000);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasRole(['chef_cabinet', 'admin', 'super_admin', 'medecin'])) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Rapports</h1>
          <p className="text-zinc-500">Générez des rapports d&apos;activité et de statistiques</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Type de rapport</h3>
            <select
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="weekly">Rapport hebdomadaire</option>
              <option value="monthly">Rapport mensuel</option>
              <option value="quarterly">Rapport trimestriel</option>
              <option value="patients">Statistiques patients</option>
              <option value="visits">Statistiques visites</option>
              <option value="evaluations">Évaluations gériatriques</option>
            </select>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Période</h3>
            <select
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </Card>

          <Card className="p-6 flex items-center justify-center">
            <Button 
              onClick={generateReport} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Génération...' : 'Générer le rapport'}
            </Button>
          </Card>
        </div>

        {reportData && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Rapport d&apos;activité
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Période: {dateRange === 'week' ? '7 derniers jours' : '30 derniers jours'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Exporter PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    Exporter Excel
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Total Patients</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{reportData.patientsCount}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Nouveaux patients</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.newPatients}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Rendez-vous</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{reportData.appointmentsCount}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Visites effectuées</p>
                  <p className="text-2xl font-bold text-green-600">{reportData.visitsCompleted}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Visites planned</p>
                  <p className="text-2xl font-bold text-yellow-600">{reportData.visitsScheduled}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Évaluations</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.evaluationsCompleted}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Annulés</p>
                  <p className="text-2xl font-bold text-red-500">{reportData.cancelledAppointments}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500">Absences</p>
                  <p className="text-2xl font-bold text-orange-500">{reportData.noShowAppointments}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Taux d&apos;occupation
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">Rendez-vous honorés</span>
                    <span className="font-medium">
                      {reportData.appointmentsCount > 0 
                        ? Math.round(((reportData.appointmentsCount - reportData.cancelledAppointments - reportData.noShowAppointments) / reportData.appointmentsCount) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ 
                        width: `${reportData.appointmentsCount > 0 
                          ? ((reportData.appointmentsCount - reportData.cancelledAppointments - reportData.noShowAppointments) / reportData.appointmentsCount) * 100
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">Visites réalisées</span>
                    <span className="font-medium">
                      {reportData.visitsScheduled + reportData.visitsCompleted > 0
                        ? Math.round((reportData.visitsCompleted / (reportData.visitsScheduled + reportData.visitsCompleted)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ 
                        width: `${reportData.visitsScheduled + reportData.visitsCompleted > 0
                          ? (reportData.visitsCompleted / (reportData.visitsScheduled + reportData.visitsCompleted)) * 100
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!reportData && (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-zinc-500">
              Sélectionnez un type de rapport et cliquez sur &quot;Générer le rapport&quot; pour voir les statistiques
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
