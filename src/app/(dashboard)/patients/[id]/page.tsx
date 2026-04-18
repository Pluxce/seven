'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Avatar, Tabs } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Patient, Appointment, GeriatricEvaluation } from '@/lib/types';

export default function PatientDetailPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [evaluations, setEvaluations] = useState<GeriatricEvaluation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      const patientData = db.getPatientById(params.id as string);
      if (patientData) {
        setPatient(patientData);
        setAppointments(db.getAppointments({ patientId: patientData.id }));
        setEvaluations(db.getGeriatricEvaluations(patientData.id));
      }
    }
  }, [user, params.id]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500">Patient non trouvé</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'appointments', label: 'Rendez-vous' },
    { id: 'evaluations', label: 'Évaluations' },
    { id: 'medical', label: 'Dossier médical' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <Avatar name={`${patient.user.firstName} ${patient.user.lastName}`} size="xl" />
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {patient.user.firstName} {patient.user.lastName}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                {patient.user.dateOfBirth 
                  ? `${new Date().getFullYear() - new Date(patient.user.dateOfBirth).getFullYear()} ans`
                  : 'Age non spécifié'}
                {' · '}
                {patient.user.gender === 'male' ? 'Homme' : patient.user.gender === 'female' ? 'Femme' : 'Autre'}
              </p>
              <div className="flex gap-2 mt-3">
                {patient.bloodType && <Badge variant="error">{patient.bloodType}</Badge>}
                {patient.insuranceProvider && <Badge variant="info">{patient.insuranceProvider}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/appointments/new?patient=${patient.id}`)}>
              + RDV
            </Button>
            <Button onClick={() => router.push(`/evaluations/new?patient=${patient.id}`)}>
              + Évaluation
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Informations personnelles
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="font-medium">{patient.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Téléphone</p>
                  <p className="font-medium">{patient.user.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Adresse</p>
                  <p className="font-medium">{patient.user.address || '-'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Contact d&apos;urgence
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Nom</p>
                  <p className="font-medium">{patient.familyContact || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Téléphone</p>
                  <p className="font-medium">{patient.familyPhone || '-'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Informations médicales
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Groupe sanguin</p>
                  <p className="font-medium">{patient.bloodType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Allergies</p>
                  <div className="flex gap-1 flex-wrap">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((allergy, i) => (
                        <Badge key={i} variant="error">{allergy}</Badge>
                      ))
                    ) : (
                      <span className="text-zinc-400">Aucune</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Assurance
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Assurance</p>
                  <p className="font-medium">{patient.insuranceProvider || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Numéro</p>
                  <p className="font-medium">{patient.insuranceNumber || '-'}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <Card key={apt.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {new Date(apt.appointmentDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {' à '}
                        {new Date(apt.appointmentDate).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-zinc-500">{apt.reason}</p>
                    </div>
                    <Badge variant={apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'error' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500">Aucun rendez-vous</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            {evaluations.length > 0 ? (
              evaluations.map((eval_) => (
                <Card 
                  key={eval_.id} 
                  className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => router.push(`/evaluations/${eval_.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        Évaluation du {new Date(eval_.evaluationDate).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-sm text-zinc-500">MMS: {eval_.mmsTotal || '-'}/30</span>
                        <span className="text-sm text-zinc-500">GDS: {eval_.gdsTotal || '-'}/15</span>
                        <span className="text-sm text-zinc-500">ADL: {eval_.adlTotal || '-'}/12</span>
                      </div>
                    </div>
                    <Badge variant={eval_.status === 'completed' ? 'success' : 'warning'}>
                      {eval_.status === 'completed' ? 'Terminée' : 'Brouillon'}
                    </Badge>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500">Aucune évaluation</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medical' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Historique médical
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-500">Pathologies chroniques</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                    patient.chronicConditions.map((condition, i) => (
                      <Badge key={i} variant="warning">{condition}</Badge>
                    ))
                  ) : (
                    <span className="text-zinc-400">Aucune</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Histoire médicale</p>
                <p className="mt-1">{patient.medicalHistory || 'Aucune histoire médicale enregistrée'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
