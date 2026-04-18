'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, StatCard, Avatar, Button } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    evaluations: 0,
    pendingAppointments: 0,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      let appointments: any[] = [];
      let patientsCount = 0;
      let evaluations: any[] = [];

      if (user.role === 'patient') {
        const patient = db.getPatientByUserId(user.id);
        appointments = patient ? db.getAppointments({ patientId: patient.id }) : [];
        patientsCount = 1;
        evaluations = patient ? db.getGeriatricEvaluations(patient.id) : [];
      } else {
        appointments = db.getAppointments();
        patientsCount = db.getPatients().length;
        evaluations = db.getGeriatricEvaluations();
      }

      setStats({
        patients: patientsCount,
        appointments: appointments.length,
        evaluations: evaluations.length,
        pendingAppointments: appointments.filter((a) => a.status === 'scheduled').length,
      });
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      patient: 'Patient',
      medecin: 'Médecin',
      agent_terrain: 'Agent de terrain',
      chef_cabinet: 'Chef de Cabinet',
      admin: 'Administrateur',
      super_admin: 'Super Admin',
    };
    return labels[role] || role;
  };

  const upcomingAppointments = db.getAppointments().slice(0, 5);
  const recentPatients = db.getPatients().slice(0, 5);

  const appointmentData = [
    { day: 'Lun', value: 12 },
    { day: 'Mar', value: 19 },
    { day: 'Mer', value: 8 },
    { day: 'Jeu', value: 15 },
    { day: 'Ven', value: 22 },
    { day: 'Sam', value: 6 },
    { day: 'Dim', value: 3 },
  ];

  const patientAgeData = [
    { range: '60-70', count: 8 },
    { range: '70-80', count: 15 },
    { range: '80-90', count: 12 },
    { range: '90+', count: 5 },
  ];

  const maxApptValue = Math.max(...appointmentData.map((d) => d.value));
  const maxPatientAge = Math.max(...patientAgeData.map((d) => d.count));

  if (user.role === 'patient') {
    return <PatientDashboard user={user} stats={stats} upcomingAppointments={upcomingAppointments} router={router} />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Modernized Greeting Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {getGreeting()}, <span className="text-zinc-500">{user.firstName}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {getRoleLabel(user.role)} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/settings')}>
              Mon profil
            </Button>
            <Button onClick={() => router.push('/appointments/new')}>
              Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Stat Cards with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Patients" 
            value={stats.patients} 
            changeType="positive"
            icon={<UsersIcon className="h-6 w-6" />}
          />
          <StatCard 
            title="Rendez-vous" 
            value={stats.appointments} 
            changeType="positive"
            icon={<CalendarIcon className="h-6 w-6" />}
          />
          <StatCard 
            title="Demandes en attente" 
            value={stats.pendingAppointments} 
            changeType={stats.pendingAppointments > 0 ? 'neutral' : 'positive'}
            icon={<ClockIcon className="h-6 w-6" />}
          />
          <StatCard 
            title="Évaluations" 
            value={stats.evaluations} 
            changeType="positive"
            icon={<FileIcon className="h-6 w-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <ChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Fréquentation hebdomadaire
              </h2>
            </div>
            <div className="flex items-end justify-between h-56 gap-3">
              {appointmentData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                  <div
                    className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl relative overflow-hidden h-full flex flex-col justify-end"
                  >
                    <div
                      className="w-full bg-zinc-900 dark:bg-white rounded-xl transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${(data.value / maxApptValue) * 100}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{data.day}</span>
                    <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">{data.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                Démographie patients
              </h2>
            </div>
            <div className="space-y-6">
              {patientAgeData.map((data, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-zinc-500 group-hover:text-zinc-900 transition-colors">{data.range} ans</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{data.count} patients</span>
                  </div>
                  <div className="h-3 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-200 dark:to-zinc-100 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(data.count / maxPatientAge) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Patients récents
              </h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/patients')}>Voir tout</Button>
            </div>
            <div className="space-y-2">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                  >
                    <Avatar name={`${patient.user.firstName} ${patient.user.lastName}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 transition-colors">
                        {patient.user.firstName} {patient.user.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{patient.address || 'Abidjan, Côte d\'Ivoire'}</p>
                    </div>
                    <Badge variant="success">Actif</Badge>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UsersIcon className="h-8 w-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 font-medium">Aucun patient récent</p>
                  <p className="text-xs text-zinc-400 mt-1">Les nouveaux patients apparaîtront ici.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Prochains rendez-vous
              </h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>Voir tout</Button>
            </div>
            <div className="space-y-2">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group"
                  >
                    <div className="text-center min-w-[56px] py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors border border-transparent group-hover:border-zinc-100 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {new Date(apt.appointmentDate).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </p>
                      <p className="font-black text-lg text-zinc-900 dark:text-zinc-100 leading-none my-1">
                        {new Date(apt.appointmentDate).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 font-medium">
                        {new Date(apt.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {apt.reason}
                      </p>
                    </div>
                    <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                      {apt.status === 'confirmed' ? 'Confirmé' : 'Attente'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 font-medium">Aucun rendez-vous planifié</p>
                  <p className="text-xs text-zinc-400 mt-1">Prenez un rendez-vous pour commencer.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function PatientDashboard({
  user,
  stats,
  upcomingAppointments,
  router,
}: {
  user: any;
  stats: any;
  upcomingAppointments: any[];
  router: any;
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const patient = db.getPatientByUserId(user.id);
  const records = patient ? db.getMedicalRecords(patient.id) : [];
  const recentDocs = records.slice(0, 2);

  const quickActions = [
    { label: 'Prendre RDV', icon: '📅', href: '/appointments', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { label: 'Mes documents', icon: '📄', href: '/documents', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { label: 'Mes factures', icon: '💳', href: '/invoices', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { label: 'Mon dossier', icon: '🗂️', href: '/records', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  ];

  const healthItems = [
    { label: 'Groupe sanguin', value: patient?.bloodType || 'Non renseigné' },
    { label: 'Allergies', value: patient?.allergies?.length ? patient.allergies.join(', ') : 'Aucune connue' },
    { label: 'Conditions chroniques', value: patient?.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'Aucune' },
    { label: 'Mutuelle', value: patient?.insuranceProvider || 'Non renseignée' },
  ];

  const docModes = [
    { label: 'Mon Espace Santé', icon: '❤️', color: 'text-blue-600', desc: 'monespacesante.fr — 3422' },
    { label: 'Email sécurisé (Lifen)', icon: '✉️', color: 'text-teal-600', desc: 'Immédiat · Email + tél. requis' },
    { label: 'Courrier postal', icon: '📬', color: 'text-orange-600', desc: '4 à 6 jours ouvrés' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Bannière de bienvenue */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {user.firstName} 👋
              </h1>
              <p className="text-zinc-300 mt-1 text-sm">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-zinc-400 text-xs mt-3">
                Votre espace de santé personnel · Cabinet Gériatrie SEVEN
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-xs text-zinc-300">Prochain RDV</span>
              </div>
              {upcomingAppointments[0] ? (
                <div className="text-right">
                  <p className="font-semibold">{upcomingAppointments[0].reason}</p>
                  <p className="text-zinc-300 text-sm">
                    {new Date(upcomingAppointments[0].appointmentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' à '}
                    {new Date(upcomingAppointments[0].appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <p className="text-zinc-400 text-sm">Aucun rendez-vous planifié</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques patient */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Mes RDV" value={stats.appointments} changeType="positive" />
          <StatCard title="En attente" value={stats.pendingAppointments} changeType={stats.pendingAppointments > 0 ? 'neutral' : 'positive'} />
          <StatCard title="Évaluations" value={stats.evaluations} changeType="positive" />
          <StatCard title="Documents" value={records.length} changeType="positive" />
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 active:scale-95
                  ${action.color}
                `}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prochains rendez-vous */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Mes prochains rendez-vous</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
                Voir tout →
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).length > 0 ? (
                upcomingAppointments.slice(0, 3).map((apt) => (
                  <Card key={apt.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[52px] p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-500 uppercase">
                          {new Date(apt.appointmentDate).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </p>
                        <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                          {new Date(apt.appointmentDate).getDate()}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(apt.appointmentDate).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{apt.reason || 'Consultation'}</p>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          {new Date(apt.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {apt.medecin && ` · Dr. ${apt.medecin.lastName}`}
                        </p>
                      </div>
                      <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                        {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-zinc-400 dark:text-zinc-500">Aucun rendez-vous à venir</p>
                  <Button className="mt-4" size="sm" onClick={() => router.push('/appointments/new')}>
                    Prendre un rendez-vous
                  </Button>
                </Card>
              )}
            </div>

            {/* Derniers documents reçus */}
            <div className="flex items-center justify-between mt-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Derniers documents reçus</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
                Voir tout →
              </Button>
            </div>
            <div className="space-y-3">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{doc.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                          {' · '}
                          <span className="text-emerald-600 dark:text-emerald-400">Disponible</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push('/documents')}>
                        Ouvrir
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">Aucun document disponible</p>
                </Card>
              )}
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4">
            {/* Résumé santé */}
            <Card className="p-5">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <span className="text-lg">🩺</span> Résumé santé
              </h3>
              <div className="space-y-3">
                {healthItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push('/settings')}>
                Modifier mes infos
              </Button>
            </Card>

            {/* Modes de réception de documents */}
            <Card className="p-5">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                <span className="text-lg">📬</span> Réception de documents
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Modes disponibles pour recevoir vos comptes-rendus</p>
              <div className="space-y-2">
                {docModes.map((m) => (
                  <div key={m.label} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <span className="text-base mt-0.5">{m.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{m.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push('/documents')}>
                Gérer mes préférences
              </Button>
            </Card>

            {/* Contact cabinet */}
            <Card className="p-5 bg-zinc-900 dark:bg-zinc-800 text-white">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📞</span> Besoin d'aide ?
              </h3>
              <p className="text-sm text-zinc-300 mb-3">Notre secrétariat est disponible pour vous accompagner</p>
              <div className="space-y-1.5 text-sm text-zinc-300">
                <p>🕐 Lun–Ven : 8h–18h</p>
                <p>📞 <span className="text-white font-medium">01 23 45 67 89</span></p>
                <p>📧 contact@cabinet-geriatrie.fr</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
