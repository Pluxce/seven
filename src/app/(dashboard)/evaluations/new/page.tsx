'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Button, Card, Input, Select, Tabs } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Patient } from '@/lib/types';

const sections = [
  { id: 'informations', label: 'Informations' },
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

export default function NewEvaluationPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('informations');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [evaluationData, setEvaluationData] = useState({
    informationsPatient: {},
    cognitif: {},
    humeur: {},
    fonctionnel: {},
    mobilite: {},
    nutrition: {},
    chute: {},
    social: {},
    medicaments: {},
    medicaux: {},
    conclusion: {},
    mmsTotal: 0,
    gdsTotal: 0,
    adlTotal: 0,
    iadlTotal: 0,
    morseTotal: 0,
  });

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

  const updateData = (section: string, field: string, value: any) => {
    setEvaluationData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as object || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = (status: 'draft' | 'completed') => {
    if (!selectedPatient) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    db.createGeriatricEvaluation({
      patientId: selectedPatient,
      cabinetId: '1',
      medecinId: user?.id || '3',
      evaluationDate: new Date(),
      status,
      ...evaluationData,
    } as any);

    router.push('/evaluations');
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Nouvelle évaluation
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Évaluation gériatrique standardisée
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleSave('draft')}>
              Sauvegarder
            </Button>
            <Button onClick={() => handleSave('completed')}>
              Terminer
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Patient à évaluer
              </label>
              <select
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Sélectionner un patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.firstName} {p.user.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                className="rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </Card>

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

        <Card className="p-6">
          {activeSection === 'informations' && (
            <InformationsSection data={evaluationData.informationsPatient} update={(f, v) => updateData('informations', f, v)} />
          )}
          {activeSection === 'cognitif' && (
            <CognitifSection data={evaluationData.cognitif} update={(f, v) => updateData('cognitif', f, v)} onTotalChange={(v) => setEvaluationData(prev => ({ ...prev, mmsTotal: v }))} />
          )}
          {activeSection === 'humeur' && (
            <HumeurSection data={evaluationData.humeur} update={(f, v) => updateData('humeur', f, v)} onTotalChange={(v) => setEvaluationData(prev => ({ ...prev, gdsTotal: v }))} />
          )}
          {activeSection === 'fonctionnel' && (
            <FonctionnelSection data={evaluationData.fonctionnel} update={(f, v) => updateData('fonctionnel', f, v)} onAdlChange={(v) => setEvaluationData(prev => ({ ...prev, adlTotal: v }))} onIadlChange={(v) => setEvaluationData(prev => ({ ...prev, iadlTotal: v }))} />
          )}
          {activeSection === 'mobilite' && (
            <MobiliteSection data={evaluationData.mobilite} update={(f, v) => updateData('mobilite', f, v)} />
          )}
          {activeSection === 'nutrition' && (
            <NutritionSection data={evaluationData.nutrition} update={(f, v) => updateData('nutrition', f, v)} />
          )}
          {activeSection === 'chute' && (
            <ChuteSection data={evaluationData.chute} update={(f, v) => updateData('chute', f, v)} onTotalChange={(v) => setEvaluationData(prev => ({ ...prev, morseTotal: v }))} />
          )}
          {activeSection === 'social' && (
            <SocialSection data={evaluationData.social} update={(f, v) => updateData('social', f, v)} />
          )}
          {activeSection === 'medicaments' && (
            <MedicamentsSection data={evaluationData.medicaments} update={(f, v) => updateData('medicaments', f, v)} />
          )}
          {activeSection === 'medicaux' && (
            <MedicauxSection data={evaluationData.medicaux} update={(f, v) => updateData('medicaux', f, v)} />
          )}
          {activeSection === 'conclusion' && (
            <ConclusionSection data={evaluationData.conclusion} update={(f, v) => updateData('conclusion', f, v)} />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">{children}</h2>;
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-medium text-zinc-800 dark:text-zinc-200 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InformationsSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Informations Patient</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Date" type="date" defaultValue={data.date} onChange={(e) => update('date', e.target.value)} />
        <Input label="Médecin évaluateur" defaultValue={data.medecin} onChange={(e) => update('medecin', e.target.value)} />
        <Input label="Nom du patient" defaultValue={data.nom} onChange={(e) => update('nom', e.target.value)} />
        <Input label="Prénom du patient" defaultValue={data.prenom} onChange={(e) => update('prenom', e.target.value)} />
        <Input label="Age" type="number" defaultValue={data.age} onChange={(e) => update('age', e.target.value)} />
        <Select label="Sexe" options={['Masculin', 'Féminin']} value={data.sexe} onChange={(e) => update('sexe', e.target.value)} />
        <Input label="Date de naissance" type="date" defaultValue={data.ddn} onChange={(e) => update('ddn', e.target.value)} />
        <Input label="Langue" defaultValue={data.langue} onChange={(e) => update('langue', e.target.value)} />
        <Input label="N° AVS" defaultValue={data.avs} onChange={(e) => update('avs', e.target.value)} />
        <Input label="N° Dossier" defaultValue={data.dossier} onChange={(e) => update('dossier', e.target.value)} />
      </div>
    </div>
  );
}

function CognitifSection({ data, update, onTotalChange }: { data: any; update: (f: string, v: any) => void; onTotalChange: (v: number) => void }) {
  return (
    <div>
      <SectionTitle>Fonctions Cognitives</SectionTitle>
      
      <FieldGroup title="MMS (Mini-Mental State)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Orientation Date (sur 5)" type="number" defaultValue={data.mmsOrientationDate} onChange={(e) => { update('mmsOrientationDate', e.target.value); calculateMMS(e); }} />
          <Input label="Orientation Lieu (sur 5)" type="number" defaultValue={data.mmsOrientationLieu} onChange={(e) => { update('mmsOrientationLieu', e.target.value); calculateMMS(e); }} />
          <Input label="Registration (sur 3)" type="number" defaultValue={data.mmsRegistration} onChange={(e) => { update('mmsRegistration', e.target.value); calculateMMS(e); }} />
          <Input label="Attention (sur 5)" type="number" defaultValue={data.mmsAttention} onChange={(e) => { update('mmsAttention', e.target.value); calculateMMS(e); }} />
          <Input label="Rappel (sur 3)" type="number" defaultValue={data.mmsRappel} onChange={(e) => { update('mmsRappel', e.target.value); calculateMMS(e); }} />
          <Input label="Langage (sur 8)" type="number" defaultValue={data.mmsLangage} onChange={(e) => { update('mmsLangage', e.target.value); calculateMMS(e); }} />
          <Input label="Visuospatial (sur 1)" type="number" defaultValue={data.mmsVisuospatial} onChange={(e) => { update('mmsVisuospatial', e.target.value); calculateMMS(e); }} />
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">Total MMS</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.mmsTotal || 0}/30</p>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Test de l'Horloge">
        <Select label="Score (sur 4)" options={['0', '1', '2', '3', '4']} value={data.clock} onChange={(e) => update('clock', e.target.value)} />
      </FieldGroup>

      <FieldGroup title="Fluences Verbales">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Catégorie (en 1 min)" type="number" defaultValue={data.fluenceCategorie} onChange={(e) => update('fluenceCategorie', e.target.value)} />
          <Input label="Lettre P (en 1 min)" type="number" defaultValue={data.fluenceLettre} onChange={(e) => update('fluenceLettre', e.target.value)} />
        </div>
      </FieldGroup>
    </div>
  );

  function calculateMMS(e: any) {
    const values = [
      parseInt(data.mmsOrientationDate || e.target.name === 'mmsOrientationDate' ? e.target.value : 0),
      parseInt(data.mmsOrientationLieu || 0),
      parseInt(data.mmsRegistration || 0),
      parseInt(data.mmsAttention || 0),
      parseInt(data.mmsRappel || 0),
      parseInt(data.mmsLangage || 0),
      parseInt(data.mmsVisuospatial || 0),
    ];
    onTotalChange(values.reduce((a: number, b: number) => a + b, 0));
  }
}

function HumeurSection({ data, update, onTotalChange }: { data: any; update: (f: string, v: any) => void; onTotalChange: (v: number) => void }) {
  const questions = [
    "Êtes-vous satisfait(e) de votre vie ?",
    "Avez-vous abandonné vos activités ?",
    "Vous sentez-vous seul(e) ?",
    "Vous sentez-vous ennuyé(e) ?",
    "Vous sentez-vous nerveux(se) ?",
    "Avez-vous peur ?",
    "Vous sentez-vous triste ?",
    "Vous sentez-vous désespéré(e) ?",
    "Vous sentez-vous sans valeur ?",
    "Êtes-vous fatigué(e) ?",
    "Difficultés à surmonter vos difficultés ?",
    "Préférez-vous rester seul(e) ?",
    "Difficultés à vous concentrer ?",
    "Difficultés à vous lever le matin ?",
    "Situation désespérée ?",
  ];

  return (
    <div>
      <SectionTitle>Humeur - GDS (Geriatric Depression Scale)</SectionTitle>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{q}</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`gds-${i}`} checked={data[`gds-${i}`] === 'yes'} onChange={() => { update(`gds-${i}`, 'yes'); calculateGDS('yes', i); }} />
                <span className="text-sm">Oui</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`gds-${i}`} checked={data[`gds-${i}`] === 'no'} onChange={() => { update(`gds-${i}`, 'no'); calculateGDS('no', i); }} />
                <span className="text-sm">Non</span>
              </label>
            </div>
          </div>
        ))}
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500">Score total GDS</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.gdsTotal || 0}/15</p>
        </div>
      </div>
    </div>
  );

  function calculateGDS(value: string, index: number) {
    let total = data.gdsTotal || 0;
    const positiveAnswers = [0, 2, 4, 6, 8, 9, 11, 12, 13, 14];
    if (positiveAnswers.includes(index) && value === 'yes') total++;
    else if (!positiveAnswers.includes(index) && value === 'no') total++;
    else if (data[`gds-${index}`] === 'yes' && value === 'no') total--;
    else if (data[`gds-${index}`] === 'no' && value === 'yes') total++;
    onTotalChange(Math.max(0, total));
  }
}

function FonctionnelSection({ data, update, onAdlChange, onIadlChange }: { data: any; update: (f: string, v: any) => void; onAdlChange: (v: number) => void; onIadlChange: (v: number) => void }) {
  const adlItems = ['Toilette', 'Habillage', 'Alimentation', 'Toilettes', 'Transfert', 'Continence'];
  const iadlItems = ['Téléphone', 'Courses', 'Repas', 'Ménage', 'Linge', 'Transports', 'Médicaments', 'Finance'];

  return (
    <div>
      <SectionTitle>État Fonctionnel</SectionTitle>
      
      <FieldGroup title="ADL (Activities of Daily Living)">
        <div className="space-y-3">
          {adlItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
              <select className="rounded-lg border border-zinc-300 px-3 py-1.5 bg-white dark:bg-zinc-800" value={data[`adl-${i}`]} onChange={(e) => { update(`adl-${i}`, e.target.value); calculateADL(); }}>
                <option value="0">Dépendant</option>
                <option value="1">Aide partielle</option>
                <option value="2">Indépendant</option>
              </select>
            </div>
          ))}
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">Total ADL</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.adlTotal || 0}/12</p>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="IADL (Instrumental Activities of Daily Living)">
        <div className="space-y-3">
          {iadlItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
              <select className="rounded-lg border border-zinc-300 px-3 py-1.5 bg-white dark:bg-zinc-800" value={data[`iadl-${i}`]} onChange={(e) => { update(`iadl-${i}`, e.target.value); calculateIADL(); }}>
                <option value="0">Dépendant</option>
                <option value="1">Aide partielle</option>
                <option value="2">Indépendant</option>
              </select>
            </div>
          ))}
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">Total IADL</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.iadlTotal || 0}/16</p>
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  function calculateADL() {
    let total = 0;
    for (let i = 0; i < 6; i++) {
      total += parseInt(data[`adl-${i}`] || 0);
    }
    onAdlChange(total);
  }

  function calculateIADL() {
    let total = 0;
    for (let i = 0; i < 8; i++) {
      total += parseInt(data[`iadl-${i}`] || 0);
    }
    onIadlChange(total);
  }
}

function MobiliteSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Mobilité / Équilibre</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldGroup title="Get Up and Go">
          <Select label="Résultat" options={['Normal', 'Très léger', 'Léger', 'Modéré', 'Sévère']} value={data.getUpGo} onChange={(e) => update('getUpGo', e.target.value)} />
        </FieldGroup>
        <FieldGroup title="Timed Up and Go">
          <Input label="Temps (secondes)" type="number" defaultValue={data.tug} onChange={(e) => update('tug', e.target.value)} />
        </FieldGroup>
        <FieldGroup title="Station Unipodale">
          <Input label="Durée (secondes)" type="number" defaultValue={data.unipodal} onChange={(e) => update('unipodal', e.target.value)} />
        </FieldGroup>
        <FieldGroup title="Test de marche 10m">
          <Input label="Temps (secondes)" type="number" defaultValue={data.marche10m} onChange={(e) => update('marche10m', e.target.value)} />
          <Input label="Nombre de pas" type="number" defaultValue={data.pas} onChange={(e) => update('pas', e.target.value)} className="mt-2" />
        </FieldGroup>
      </div>
    </div>
  );
}

function NutritionSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Nutrition</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldGroup title="MNA (Mini Nutritional Assessment)">
          <Input label="Score MNA" type="number" defaultValue={data.mna} onChange={(e) => update('mna', e.target.value)} />
        </FieldGroup>
        <FieldGroup title="Paramètres anthropométriques">
          <Input label="Poids (kg)" type="number" defaultValue={data.poids} onChange={(e) => update('poids', e.target.value)} />
          <Input label="Taille (cm)" type="number" defaultValue={data.taille} onChange={(e) => update('taille', e.target.value)} className="mt-2" />
          <Input label="IMC (kg/m²)" type="number" defaultValue={data.imc} onChange={(e) => update('imc', e.target.value)} className="mt-2" />
        </FieldGroup>
      </div>
    </div>
  );
}

function ChuteSection({ data, update, onTotalChange }: { data: any; update: (f: string, v: any) => void; onTotalChange: (v: number) => void }) {
  const items = [
    { label: 'Antécédents de chutes', options: ['Non', 'Oui (25)'] },
    { label: 'Diagnostic secondaire', options: ['Non', 'Oui (15)'] },
    { label: 'Aide à la marche', options: ['Aucune', 'Canne (15)', 'Fauteuil (30)'] },
    { label: 'Chimiothérapie', options: ['Non', 'Oui (20)'] },
    { label: 'Trouble démarche', options: ['Normal', 'Léger (10)', 'Sévère (20)'] },
    { label: 'État mental', options: ['Normal', 'Altéré (15)'] },
  ];

  return (
    <div>
      <SectionTitle>Risque de Chute - Échelle de Morse</SectionTitle>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
            <select className="rounded-lg border border-zinc-300 px-3 py-1.5 bg-white dark:bg-zinc-800" value={data[`morse-${i}`]} onChange={(e) => { update(`morse-${i}`, e.target.value); calculateMorse(); }}>
              {item.options.map((opt, j) => (
                <option key={j} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500">Score total Morse</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{data.morseTotal || 0}/125</p>
        </div>
      </div>
    </div>
  );

  function calculateMorse() {
    const scores = [25, 15, 30, 20, 20, 15];
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const val = data[`morse-${i}`];
      if (val && val.includes('(')) {
        total += parseInt(val.match(/\((\d+)\)/)?.[1] || 0);
      }
    }
    onTotalChange(total);
  }
}

function SocialSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Situation Sociale</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Mode de vie" options={['Solo', 'Conjoint', 'Enfant(s)', 'Famille', 'EMS']} value={data.modeDeVie} onChange={(e) => update('modeDeVie', e.target.value)} />
        <Select label="Type d'habitation" options={['Maison', 'Appartement', 'Appartement protégé', 'EMS']} value={data.habitation} onChange={(e) => update('habitation', e.target.value)} />
        <Select label="Aidant principal" options={['Conjoint', 'Enfant', 'Autre famille', 'Aucun']} value={data.aidant} onChange={(e) => update('aidant', e.target.value)} />
        <Input label="Fréquence des visites" defaultValue={data.visites} onChange={(e) => update('visites', e.target.value)} />
      </div>
    </div>
  );
}

function MedicamentsSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Médicaments</SectionTitle>
      <div className="space-y-4">
        <Input label="Nombre de médicaments" type="number" defaultValue={data.nombre} onChange={(e) => update('nombre', e.target.value)} />
        <Select label="Polymédication (>5)" options={['Non', 'Oui']} value={data.poly} onChange={(e) => update('poly', e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Liste des médicaments</label>
          <textarea className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" rows={4} defaultValue={data.liste} onChange={(e) => update('liste', e.target.value)} placeholder="Saisissez les médicaments..." />
        </div>
      </div>
    </div>
  );
}

function MedicauxSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Problèmes Médicaux</SectionTitle>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Diagnostics</label>
          <textarea className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" rows={4} defaultValue={data.diagnostics} onChange={(e) => update('diagnostics', e.target.value)} placeholder="Saisissez les diagnostics..." />
        </div>
        <Input label="Allergies" defaultValue={data.allergies} onChange={(e) => update('allergies', e.target.value)} />
      </div>
    </div>
  );
}

function ConclusionSection({ data, update }: { data: any; update: (f: string, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Conclusion et Recommandations</SectionTitle>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Résumé clinique</label>
          <textarea className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" rows={6} defaultValue={data.resume} onChange={(e) => update('resume', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Recommandations</label>
          <textarea className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800" rows={6} defaultValue={data.recommandations} onChange={(e) => update('recommandations', e.target.value)} />
        </div>
        <Input label="Date du prochain suivi" type="date" defaultValue={data.suivi} onChange={(e) => update('suivi', e.target.value)} />
      </div>
    </div>
  );
}
