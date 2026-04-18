'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, StatCard } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { GeriatricEvaluation, Patient } from '@/lib/types';

export default function EvaluationDetailPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [evaluation, setEvaluation] = useState<GeriatricEvaluation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      const evalData = db.getGeriatricEvaluationById(params.id as string);
      if (evalData) {
        setEvaluation(evalData);
        setPatient(db.getPatientById(evalData.patientId) || null);
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

  if (!evaluation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500">Évaluation non trouvée</p>
        </div>
      </DashboardLayout>
    );
  }

  const sections = [
    { id: 'summary', label: 'Résumé' },
    { id: 'cognitif', label: 'Cognitif' },
    { id: 'humeur', label: 'Humeur' },
    { id: 'fonctionnel', label: 'Fonctionnel' },
    { id: 'mobilite', label: 'Mobilité' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'chute', label: 'Chute' },
    { id: 'social', label: 'Social' },
    { id: 'medicaments', label: 'Médicaments' },
    { id: 'medicaux', label: 'Médicaux' },
    { id: 'conclusion', label: 'Conclusion' },
  ];

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Évaluation gériatrique
              </h1>
              <Badge variant={evaluation.status === 'completed' ? 'success' : 'warning'}>
                {evaluation.status === 'completed' ? 'Terminée' : 'Brouillon'}
              </Badge>
            </div>
            <p className="text-zinc-500">
              {patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient'} ·{' '}
              {new Date(evaluation.evaluationDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              Imprimer
            </Button>
            {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
              <Button onClick={() => router.push(`/evaluations/${evaluation.id}/edit`)}>
                Modifier
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="MMS" value={`${evaluation.mmsTotal || '-'}/30`} />
          <StatCard title="GDS" value={`${evaluation.gdsTotal || '-'}/15`} />
          <StatCard title="ADL" value={`${evaluation.adlTotal || '-'}/12`} />
          <StatCard title="IADL" value={`${evaluation.iadlTotal || '-'}/16`} />
          <StatCard title="Morse" value={`${evaluation.morseTotal || '-'}/125`} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeSection === section.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === 'summary' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Résumé des scores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-1">Fonctions cognitives (MMS)</p>
                <p className={`text-3xl font-bold ${getScoreColor(evaluation.mmsTotal || 0, 30)}`}>
                  {evaluation.mmsTotal || 0}/30
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {(evaluation.mmsTotal || 0) >= 24 ? 'Normal' : (evaluation.mmsTotal || 0) >= 18 ? 'Modéré' : 'Altéré'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-1">Humeur (GDS)</p>
                <p className={`text-3xl font-bold ${getScoreColor(15 - (evaluation.gdsTotal || 0), 15)}`}>
                  {evaluation.gdsTotal || 0}/15
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {(evaluation.gdsTotal || 0) <= 5 ? 'Normal' : (evaluation.gdsTotal || 0) <= 10 ? 'Dépression légère' : 'Dépression établie'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-1">Autonomie (ADL)</p>
                <p className={`text-3xl font-bold ${getScoreColor(evaluation.adlTotal || 0, 12)}`}>
                  {evaluation.adlTotal || 0}/12
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {(evaluation.adlTotal || 0) >= 10 ? 'Autonome' : (evaluation.adlTotal || 0) >= 6 ? 'Dépendance légère' : 'Dépendance sévère'}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-1">Autonomie instrumentale (IADL)</p>
                <p className={`text-3xl font-bold ${getScoreColor(evaluation.iadlTotal || 0, 16)}`}>
                  {evaluation.iadlTotal || 0}/16
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-500 mb-1">Risque de chute (Morse)</p>
                <p className={`text-3xl font-bold ${(evaluation.morseTotal || 0) < 25 ? 'text-green-500' : (evaluation.morseTotal || 0) < 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {evaluation.morseTotal || 0}/125
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {(evaluation.morseTotal || 0) < 25 ? 'Risque faible' : (evaluation.morseTotal || 0) < 50 ? 'Risque moyen' : 'Risque élevé'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'conclusion' && evaluation.conclusion && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Conclusion
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{evaluation.conclusion.summary || 'Aucune conclusion enregistrée'}</p>
            </div>
          </Card>
        )}

        {activeSection !== 'summary' && activeSection !== 'conclusion' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-zinc-500">
              Détails de la section {activeSection} - données à afficher
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
