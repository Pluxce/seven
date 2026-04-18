'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Select, Tabs } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { GeriatricEvaluation, Patient } from '@/lib/types';

export default function EvaluationsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<GeriatricEvaluation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      let filtered: GeriatricEvaluation[];
      
      if (user.role === 'patient') {
        const patient = db.getPatientByUserId(user.id);
        filtered = patient ? db.getGeriatricEvaluations(patient.id) : [];
      } else {
        filtered = db.getGeriatricEvaluations();
      }
      
      if (filter !== 'all') {
        filtered = filtered.filter(e => e.status === filter);
      }
      
      setEvaluations(filtered);
      setPatients(db.getPatients());
    }
  }, [user, filter]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient';
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Évaluations gériatriques
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {evaluations.length} évaluation{evaluations.length !== 1 ? 's' : ''}
            </p>
          </div>
          {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
            <Button onClick={() => router.push('/evaluations/new')}>
              + Nouvelle évaluation
            </Button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'draft', label: 'Brouillons' },
            { value: 'in_progress', label: 'En cours' },
            { value: 'completed', label: 'Terminées' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {evaluations.length > 0 ? (
            evaluations.map((eval_) => (
              <Card
                key={eval_.id}
                hover
                className="p-6 cursor-pointer"
                onClick={() => router.push(`/evaluations/${eval_.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {getPatientName(eval_.patientId)}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(eval_.evaluationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant={eval_.status === 'completed' ? 'success' : eval_.status === 'in_progress' ? 'warning' : 'default'}>
                    {eval_.status === 'completed' ? 'Terminée' : eval_.status === 'in_progress' ? 'En cours' : 'Brouillon'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">MMS</p>
                    <p className={`text-lg font-bold ${getScoreColor(eval_.mmsTotal || 0, 30)}`}>
                      {eval_.mmsTotal || '-'}/30
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">GDS</p>
                    <p className={`text-lg font-bold ${getScoreColor(15 - (eval_.gdsTotal || 0), 15)}`}>
                      {eval_.gdsTotal || '-'}/15
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">ADL</p>
                    <p className={`text-lg font-bold ${getScoreColor(eval_.adlTotal || 0, 12)}`}>
                      {eval_.adlTotal || '-'}/12
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/evaluations/${eval_.id}`);
                    }}
                  >
                    Voir détails
                  </Button>
                  {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.print();
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">
                Aucune évaluation trouvée
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
