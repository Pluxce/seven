'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Modal } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { MedicalRecord } from '@/lib/types';

type TransmissionMode = 'espace_sante' | 'lifen_email' | 'courrier_postal' | null;

interface DocumentTransmission {
  record: MedicalRecord;
  mode: TransmissionMode;
  status: 'disponible' | 'en_transit' | 'recu';
  sentAt?: Date;
  receivedAt?: Date;
}

const modeLabels: Record<string, string> = {
  espace_sante: 'Mon Espace Santé',
  lifen_email: 'Email sécurisé (Lifen)',
  courrier_postal: 'Courrier postal',
};

const modeDelays: Record<string, string> = {
  espace_sante: 'Réception quasi-immédiate',
  lifen_email: 'Réception quasi-immédiate',
  courrier_postal: 'Réception sous 4 à 6 jours ouvrés',
};

export default function DocumentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [preferredMode, setPreferredMode] = useState<TransmissionMode>('espace_sante');
  const [transmissions, setTransmissions] = useState<DocumentTransmission[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'preferences' | 'aide'>('documents');
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const patient = user.role === 'patient' ? db.getPatientByUserId(user.id) : null;
      const recs = patient ? db.getMedicalRecords(patient.id) : db.getMedicalRecords();

      const modes: TransmissionMode[] = ['espace_sante', 'lifen_email', 'courrier_postal', 'espace_sante', 'lifen_email'];
      const statuses: DocumentTransmission['status'][] = ['disponible', 'disponible', 'en_transit', 'disponible', 'recu'];

      const trans: DocumentTransmission[] = recs.map((r, i) => ({
        record: r,
        mode: modes[i % modes.length],
        status: statuses[i % statuses.length],
        sentAt: new Date(r.createdAt),
        receivedAt: statuses[i % statuses.length] !== 'en_transit' ? new Date(r.createdAt) : undefined,
      }));

      setRecords(recs);
      setTransmissions(trans);

      const saved = localStorage.getItem('doc_transmission_pref') as TransmissionMode;
      if (saved) setPreferredMode(saved);
    }
  }, [user]);

  const savePreference = (mode: TransmissionMode) => {
    setPreferredMode(mode);
    localStorage.setItem('doc_transmission_pref', mode || 'espace_sante');
  };

  const typeLabels: Record<string, string> = {
    consultation_note: 'Consultation',
    prescription: 'Ordonnance',
    lab_result: 'Labo',
    imaging: 'Imagerie',
    report: 'Compte-rendu',
  };

  const typeColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    consultation_note: 'info',
    prescription: 'warning',
    lab_result: 'success',
    imaging: 'default',
    report: 'default',
  };

  const statusColors: Record<string, 'success' | 'warning' | 'info'> = {
    disponible: 'success',
    en_transit: 'warning',
    recu: 'info',
  };

  const statusLabels: Record<string, string> = {
    disponible: 'Disponible',
    en_transit: 'En transit',
    recu: 'Reçu',
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Mes Documents</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Accédez à vos documents médicaux et gérez leur mode de réception
            </p>
          </div>
          <Button onClick={() => setIsPrefsModalOpen(true)} variant="outline">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Préférences
          </Button>
        </div>

        {/* Mode de réception actuel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModeCard
            active={preferredMode === 'espace_sante'}
            icon={<EspaceSanteIcon />}
            title="Mon Espace Santé"
            description="Carnet de santé numérique via l'Assurance Maladie"
            delay="Réception quasi-immédiate"
            color="blue"
            onClick={() => savePreference('espace_sante')}
          />
          <ModeCard
            active={preferredMode === 'lifen_email'}
            icon={<LifenIcon />}
            title="Email sécurisé (Lifen)"
            description="Votre email et téléphone doivent être renseignés"
            delay="Réception quasi-immédiate"
            color="teal"
            onClick={() => savePreference('lifen_email')}
          />
          <ModeCard
            active={preferredMode === 'courrier_postal'}
            icon={<PostalIcon />}
            title="Courrier postal"
            description="Pensez à déclarer tout changement d'adresse"
            delay="4 à 6 jours ouvrés"
            color="orange"
            onClick={() => savePreference('courrier_postal')}
          />
        </div>

        {/* Onglets */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {[
            { value: 'documents', label: 'Mes documents', count: transmissions.length },
            { value: 'preferences', label: 'Préférences de réception' },
            { value: 'aide', label: 'Aide & information' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.value
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenu onglet Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            {transmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Aucun document disponible</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Vos documents médicaux apparaîtront ici dès qu'ils seront transmis</p>
              </div>
            ) : (
              transmissions.map((t) => (
                <Card
                  key={t.record.id}
                  className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedRecord(t.record)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={typeColors[t.record.recordType] || 'default'}>
                            {typeLabels[t.record.recordType] || t.record.recordType}
                          </Badge>
                          <Badge variant={statusColors[t.status]}>
                            {statusLabels[t.status]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{t.record.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <TransmissionIcon mode={t.mode} />
                            {t.mode ? modeLabels[t.mode] : 'Mode non défini'}
                          </span>
                          <span>·</span>
                          <span>{new Date(t.record.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Contenu onglet Préférences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Mode de réception préféré</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Choisissez comment le cabinet vous envoie vos documents médicaux. Ce choix peut être modifié à tout moment.
              </p>
              <div className="space-y-3">
                {([
                  { mode: 'espace_sante' as TransmissionMode, title: 'Mon Espace Santé', desc: 'Carnet de santé numérique personnel mis à disposition par l\'Assurance Maladie. Accès via monespacesante.fr ou le 3422.', delay: 'Réception quasi-immédiate après envoi par le secrétariat.' },
                  { mode: 'lifen_email' as TransmissionMode, title: 'Lien email sécurisé (Lifen)', desc: 'Votre email et numéro de téléphone portable doivent être renseignés lors de votre arrivée.', delay: 'Réception quasi-immédiate après envoi par le secrétariat.' },
                  { mode: 'courrier_postal' as TransmissionMode, title: 'Courrier postal', desc: 'Pensez à déclarer tout changement d\'adresse au secrétariat pour assurer la bonne réception.', delay: 'Réception entre 4 et 6 jours ouvrés.' },
                ] as { mode: TransmissionMode; title: string; desc: string; delay: string }[]).map(({ mode, title, desc, delay }) => (
                  <label
                    key={mode!}
                    className={`
                      flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${preferredMode === mode
                        ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="pref_mode"
                      value={mode!}
                      checked={preferredMode === mode}
                      onChange={() => savePreference(mode)}
                      className="mt-1 accent-zinc-900"
                    />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {delay}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Notifications</h2>
              <div className="space-y-3">
                {[
                  { label: 'Nouveau document disponible', desc: 'Recevoir une alerte quand un document est transmis' },
                  { label: 'Rappel de rendez-vous', desc: '24h avant chaque consultation ou visite' },
                  { label: 'Résultats d\'analyses', desc: 'Dès que vos résultats sont disponibles' },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{notif.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{notif.desc}</p>
                    </div>
                    <ToggleSwitch defaultChecked={i < 2} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Contenu onglet Aide */}
        {activeTab === 'aide' && (
          <div className="space-y-4">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <EspaceSanteIcon className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Mon Espace Santé</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Votre carnet de santé numérique personnel, mis à disposition par l'Assurance Maladie.
                    Tous vos documents médicaux y sont centralisés et accessibles en toute sécurité.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Contactez le <strong>3422</strong> pour plus d'informations ou rendez-vous sur <strong>monespacesante.fr</strong></span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-teal-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <LifenIcon className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Lien email sécurisé via Lifen</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Recevez vos documents via un lien sécurisé par email. Pour utiliser ce service,
                    votre adresse email <strong>et</strong> votre numéro de téléphone portable doivent être
                    enregistrés lors de chaque visite.
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                    Le lien reçu par email est valable 30 jours.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <PostalIcon className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Courrier postal</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    En l'absence d'autre mode de transmission, vos documents vous seront envoyés par courrier.
                    Réception estimée entre 4 et 6 jours ouvrés.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Pensez à signaler tout changement d'adresse au secrétariat
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal préférences rapides */}
      <Modal isOpen={isPrefsModalOpen} onClose={() => setIsPrefsModalOpen(false)} title="Mode de réception des documents">
        <div className="space-y-3 py-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sélectionnez votre mode de réception préféré :</p>
          {([
            { mode: 'espace_sante' as TransmissionMode, label: 'Mon Espace Santé', delay: 'Immédiat' },
            { mode: 'lifen_email' as TransmissionMode, label: 'Email sécurisé (Lifen)', delay: 'Immédiat' },
            { mode: 'courrier_postal' as TransmissionMode, label: 'Courrier postal', delay: '4-6 jours ouvrés' },
          ] as { mode: TransmissionMode; label: string; delay: string }[]).map(({ mode, label, delay }) => (
            <button
              key={mode!}
              onClick={() => { savePreference(mode); setIsPrefsModalOpen(false); }}
              className={`
                w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                ${preferredMode === mode
                  ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                }
              `}
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
              <span className="text-xs text-zinc-500">{delay}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Modal détail document */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.title || 'Document'}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={typeColors[selectedRecord.recordType] || 'default'}>
                {typeLabels[selectedRecord.recordType] || selectedRecord.recordType}
              </Badge>
              <span className="text-sm text-zinc-500">
                {new Date(selectedRecord.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {selectedRecord.content ? (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {selectedRecord.content}
              </div>
            ) : (
              <p className="text-zinc-400 italic text-sm">Aucun contenu texte disponible pour ce document.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedRecord(null)}>Fermer</Button>
              <Button className="flex-1">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Télécharger
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function ModeCard({
  active, icon, title, description, delay, color, onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
  color: 'blue' | 'teal' | 'orange';
  onClick: () => void;
}) {
  const borderColors = { blue: 'border-blue-500', teal: 'border-teal-500', orange: 'border-orange-500' };
  const bgColors = { blue: 'bg-blue-50 dark:bg-blue-900/20', teal: 'bg-teal-50 dark:bg-teal-900/20', orange: 'bg-orange-50 dark:bg-orange-900/20' };
  const textColors = { blue: 'text-blue-600 dark:text-blue-400', teal: 'text-teal-600 dark:text-teal-400', orange: 'text-orange-600 dark:text-orange-400' };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all
        ${active ? `${borderColors[color]} ${bgColors[color]}` : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? bgColors[color] : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          {icon}
        </div>
        {active && (
          <span className={`text-xs font-semibold uppercase tracking-wide ${textColors[color]}`}>Actif</span>
        )}
      </div>
      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
      <p className={`text-xs mt-1.5 flex items-center gap-1 ${active ? textColors[color] : 'text-zinc-400'}`}>
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {delay}
      </p>
    </button>
  );
}

function TransmissionIcon({ mode }: { mode: TransmissionMode }) {
  if (mode === 'espace_sante') return <EspaceSanteIcon />;
  if (mode === 'lifen_email') return <LifenIcon />;
  return <PostalIcon />;
}

function EspaceSanteIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className || 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function LifenIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className || 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PostalIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className || 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
    </svg>
  );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}
