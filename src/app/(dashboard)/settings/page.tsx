'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Button, Input, Avatar, Badge } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';

export default function SettingsPage() {
  const { user, isLoading, logout, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" /></div>;
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const roleLabel: Record<string, string> = {
    patient: 'Patient',
    medecin: 'Médecin',
    agent_terrain: 'Agent de terrain',
    chef_cabinet: 'Chef de Cabinet',
    admin: 'Administrateur',
    super_admin: 'Super Admin',
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'security', label: 'Sécurité', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Apparence', icon: '🎨' },
  ];

  return (
    <DashboardLayout>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Paramètres</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gérez votre compte et vos préférences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === tab.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <ProfileTab user={user} onSave={(updates) => {
            const updated = db.updateUser(user.id, updates);
            if (updated) {
              updateUser?.(updated);
              showToast('Profil mis à jour avec succès');
            }
          }} roleLabel={roleLabel} />
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <SecurityTab onSave={() => showToast('Mot de passe mis à jour')} onError={(msg) => showToast(msg, 'error')} />
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && <NotificationsTab />}

        {/* Appearance tab */}
        {activeTab === 'appearance' && <AppearanceTab />}

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="danger" onClick={() => { logout(); router.push('/'); }}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileTab({ user, onSave, roleLabel }: { user: any; onSave: (d: any) => void; roleLabel: Record<string, string> }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    address: user.address || '',
    specialty: user.specialty || '',
    licenseNumber: user.licenseNumber || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onSave(form);
    setSaving(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" />
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center shadow-md">
            <svg className="h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{user.firstName} {user.lastName}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{user.email}</p>
          <Badge variant="info" className="mt-2">{roleLabel[user.role] || user.role}</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Prénom" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
          <Input label="Nom" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
        </div>
        <Input label="Email" type="email" defaultValue={user.email} disabled />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Téléphone" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+225 07 00 00 000" />
          <Input label="Adresse" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Cocody, Abidjan" />
        </div>
        {user.role === 'medecin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Spécialité" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} />
            <Input label="Numéro de licence" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} />
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>Enregistrer les modifications</Button>
        </div>
      </form>
    </Card>
  );
}

function SecurityTab({ onSave, onError }: { onSave: () => void; onError: (msg: string) => void }) {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPwd !== form.confirm) { onError('Les mots de passe ne correspondent pas'); return; }
    if (form.newPwd.length < 6) { onError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setForm({ current: '', newPwd: '', confirm: '' });
    onSave();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Changer le mot de passe</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mot de passe actuel" type="password" value={form.current} onChange={e => setForm({...form, current: e.target.value})} placeholder="••••••••" required />
          <Input label="Nouveau mot de passe" type="password" value={form.newPwd} onChange={e => setForm({...form, newPwd: e.target.value})} placeholder="••••••••" required />
          <Input label="Confirmer le nouveau mot de passe" type="password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} placeholder="••••••••" required />
          <Button type="submit" isLoading={saving}>Mettre à jour</Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Sessions actives</h2>
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
              <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Session actuelle</p>
              <p className="text-sm text-zinc-500">Abidjan, Côte d'Ivoire · Chrome</p>
            </div>
          </div>
          <Badge variant="success">Actif</Badge>
        </div>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    email: true, rdv: true, messages: true, rapports: false, visites: true,
  });
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: 'email', label: 'Notifications par email', desc: 'Recevoir les notifications par email' },
    { key: 'rdv', label: 'Rappels de rendez-vous', desc: 'Notification 24h avant chaque RDV' },
    { key: 'messages', label: 'Nouveaux documents', desc: 'Alerte quand un document est disponible' },
    { key: 'rapports', label: 'Rapports disponibles', desc: 'Notification à chaque rapport généré' },
    { key: 'visites', label: 'Visites à domicile', desc: 'Rappel des visites planifiées' },
  ] as { key: keyof typeof prefs; label: string; desc: string }[];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Préférences de notifications</h2>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[item.key] ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState('system');
  const [fontSize, setFontSize] = useState('medium');

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Apparence</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Thème</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Clair', icon: '☀️', desc: 'Interface lumineuse' },
              { value: 'dark', label: 'Sombre', icon: '🌙', desc: 'Interface sombre' },
              { value: 'system', label: 'Système', icon: '💻', desc: 'Suit l\'OS' },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`p-4 border-2 rounded-2xl text-center transition-all ${theme === t.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'}`}
              >
                <span className="text-3xl">{t.icon}</span>
                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Taille de police</label>
          <div className="flex gap-3">
            {['small', 'medium', 'large'].map(s => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${fontSize === s ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
              >
                {s === 'small' ? 'Petite' : s === 'medium' ? 'Moyenne' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button>Enregistrer les préférences</Button>
        </div>
      </div>
    </Card>
  );
}
