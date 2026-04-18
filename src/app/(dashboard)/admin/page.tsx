'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, StatCard, Button, Avatar, Input, Modal, Select } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { User, UserRole } from '@/lib/types';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  isDefault: boolean;
}

interface Profile {
  id: string;
  name: string;
  description: string;
  role: UserRole;
  permissions: string[];
  color: string;
}

const defaultPermissions = [
  'Voir patients',
  'Créer patients',
  'Modifier patients',
  'Supprimer patients',
  'Voir dossiers médicaux',
  'Créer dossiers médicaux',
  'Voir rendez-vous',
  'Créer rendez-vous',
  'Modifier rendez-vous',
  'Annuler rendez-vous',
  'Voir évaluations',
  'Créer évaluations',
  'Modifier évaluations',
  'Voir visites',
  'Créer visites',
  'Modifier visites',
  'Compléter visites',
  'Voir utilisateurs',
  'Créer utilisateurs',
  'Modifier utilisateurs',
  'Supprimer utilisateurs',
  'Gestion rôles',
  'Gestion cabinets',
  'Paramètres système',
  'Voir statistiques',
  'Exporter données',
];

export default function AdminPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    {
      id: '1',
      name: 'Secrétaire',
      description: 'Responsable de la gestion des rendez-vous et accueil',
      permissions: ['Voir patients', 'Créer patients', 'Voir rendez-vous', 'Créer rendez-vous', 'Modifier rendez-vous'],
      color: 'purple',
      isDefault: false,
    },
    {
      id: '2',
      name: 'Infirmier/ère',
      description: 'Aide les médecins dans les évaluations et soins',
      permissions: ['Voir patients', 'Voir dossiers médicaux', 'Créer dossiers médicaux', 'Voir évaluations', 'Créer évaluations', 'Voir visites', 'Créer visites'],
      color: 'pink',
      isDefault: false,
    },
    {
      id: '3',
      name: 'Coordinateur',
      description: 'Coordonne les visites à domicile et le suivi des patients',
      permissions: ['Voir patients', 'Voir rendez-vous', 'Voir visites', 'Créer visites', 'Modifier visites', 'Voir statistiques'],
      color: 'orange',
      isDefault: false,
    },
  ]);
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'Médecin Chef',
      description: 'Responsable médical du cabinet',
      role: 'medecin',
      permissions: ['Voir patients', 'Créer patients', 'Modifier patients', 'Voir dossiers médicaux', 'Créer dossiers médicaux', 'Voir rendez-vous', 'Créer rendez-vous', 'Voir évaluations', 'Créer évaluations', 'Voir visites', 'Voir utilisateurs', 'Voir statistiques'],
      color: 'blue',
    },
    {
      id: '2',
      name: 'Agent de Terrain Senior',
      description: 'Agent expérimenté pour les visites à domicile',
      role: 'agent_terrain',
      permissions: ['Voir patients', 'Voir dossiers médicaux', 'Voir visites', 'Créer visites', 'Modifier visites', 'Compléter visites'],
      color: 'green',
    },
  ]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && hasRole(['chef_cabinet', 'admin', 'super_admin'])) {
      refreshUsers();
    }
  }, [user, hasRole]);

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  const handleSaveRole = (role: CustomRole) => {
    if (editingRole) {
      setCustomRoles(customRoles.map(r => r.id === role.id ? role : r));
    } else {
      setCustomRoles([...customRoles, { ...role, id: String(customRoles.length + 1) }]);
    }
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    setCustomRoles(customRoles.filter(r => r.id !== roleId));
  };

  const handleSaveProfile = (profile: Profile) => {
    if (editingProfile) {
      setProfiles(profiles.map(p => p.id === profile.id ? profile : p));
    } else {
      setProfiles([...profiles, { ...profile, id: String(profiles.length + 1) }]);
    }
    setIsProfileModalOpen(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(profiles.filter(p => p.id !== profileId));
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasRole(['chef_cabinet', 'admin', 'super_admin'])) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500">Vous n&apos;avez pas accès à cette page</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    patients: users.filter(u => u.role === 'patient').length,
    medecins: users.filter(u => u.role === 'medecin').length,
    agents: users.filter(u => u.role === 'agent_terrain').length,
    cabinets: db.getCabinets().length,
    visits: db.getHomeVisits().length,
    pendingVisits: db.getHomeVisits({ status: 'scheduled' }).length,
  };

  const roleLabels: Record<string, string> = {
    patient: 'Patient',
    medecin: 'Médecin',
    agent_terrain: 'Agent de terrain',
    chef_cabinet: 'Chef de Cabinet',
    admin: 'Administrateur',
    super_admin: 'Super Admin',
  };

  const roleColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    patient: 'default',
    medecin: 'info',
    agent_terrain: 'warning',
    chef_cabinet: 'warning',
    admin: 'success',
    super_admin: 'error',
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      db.deleteUser(id);
      refreshUsers();
    }
  };

  const handleToggleUserStatus = (u: User) => {
    db.updateUser(u.id, { isActive: !u.isActive });
    refreshUsers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Administration SEVEN
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestion des utilisateurs, rôles et configurations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total utilisateurs"
            value={stats.totalUsers}
            change={`${stats.activeUsers} actifs`}
            changeType="positive"
          />
          <StatCard
            title="Patients"
            value={stats.patients}
          />
          <StatCard
            title="Agents terrain"
            value={stats.agents}
          />
          <StatCard
            title="Visites en attente"
            value={stats.pendingVisits}
            changeType={stats.pendingVisits > 0 ? 'neutral' : 'positive'}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'overview', label: 'Aperçu' },
            { value: 'users', label: 'Utilisateurs' },
            { value: 'roles', label: 'Rôles & Permissions' },
            { value: 'profiles', label: 'Profils & Postes' },
            { value: 'cabinets', label: 'Cabinets' },
            { value: 'settings', label: 'Paramètres' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === tab.value
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
                Répartition par rôle
              </h2>
              <div className="space-y-4">
                {Object.entries(roleLabels).map(([role, label]) => {
                  const count = users.filter(u => u.role === role).length;
                  const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={role} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
                      <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-900 dark:bg-white rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-zinc-500 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Activité récente
              </h2>
              <div className="space-y-3">
                {[
                  { action: 'Nouvelle visite créée', time: 'Il y a 1h', type: 'success' },
                  { action: 'Patient ajouté', time: 'Il y a 2h', type: 'info' },
                  { action: 'Évaluation complétée', time: 'Il y a 4h', type: 'success' },
                  { action: 'Agent de terrain ajouté', time: 'Hier', type: 'info' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <span className="text-sm">{activity.action}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Gestion des utilisateurs
              </h2>
              <Button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>
                + Créer un utilisateur
              </Button>
            </div>
            
            <div className="grid gap-4">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Avatar name={`${u.firstName} ${u.lastName}`} size="md" />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-sm text-zinc-500">{u.email}</p>
                      {u.specialty && (
                        <p className="text-xs text-zinc-400">{u.specialty}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleColors[u.role]}>{roleLabels[u.role]}</Badge>
                    <Badge variant={u.isActive ? 'success' : 'error'}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                        Modifier
                      </Button>
                      {u.id !== user.id && (
                        <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(u)}>
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Rôles système
                </h2>
                <p className="text-sm text-zinc-500">Rôles prédéfinis par le système</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(roleLabels).map(([role, label]) => {
                const count = users.filter(u => u.role === role).length;
                const permissions = getRolePermissions(role);
                return (
                  <Card key={role} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${roleColors[role] === 'info' ? 'bg-blue-100 dark:bg-blue-900' : roleColors[role] === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : roleColors[role] === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                          {role === 'patient' && '👤'}
                          {role === 'medecin' && '⚕️'}
                          {role === 'agent_terrain' && '🏠'}
                          {role === 'chef_cabinet' && '👔'}
                          {role === 'admin' && '🔧'}
                          {role === 'super_admin' && '⭐'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
                          <p className="text-sm text-zinc-500">{count} utilisateur{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <Badge variant="default">Système</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500 uppercase">Permissions</p>
                      {permissions.map((perm, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-zinc-600 dark:text-zinc-400">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Rôles personnalisés
                </h2>
                <p className="text-sm text-zinc-500">Créez et configurez des rôles adaptés à vos besoins</p>
              </div>
              <Button onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}>
                + Nouveau rôle
              </Button>
            </div>
            {customRoles.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-zinc-500">Aucun rôle personnalisé. Cliquez sur "Nouveau rôle" pour en créer un.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customRoles.map((role) => (
                  <Card key={role.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${role.color}-100 dark:bg-${role.color}-900`}>
                          <span className="text-lg">⚙️</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{role.name}</h3>
                          <p className="text-sm text-zinc-500">{users.filter(u => u.role === role.id).length} utilisateur(s)</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }}>
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteRole(role.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{role.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500 uppercase">Permissions ({role.permissions.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 5).map((perm, i) => (
                          <Badge key={i} variant="default" className="text-xs">{perm}</Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge variant="default" className="text-xs">+{role.permissions.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Profils & Postes
                </h2>
                <p className="text-sm text-zinc-500">Gérez les profils d'emploi et leurs configurations</p>
              </div>
              <Button onClick={() => { setEditingProfile(null); setIsProfileModalOpen(true); }}>
                + Nouveau profil
              </Button>
            </div>
            {profiles.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-zinc-500">Aucun profil créé. Cliquez sur "Nouveau profil" pour en créer un.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${profile.color}-100 dark:bg-${profile.color}-900`}>
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{profile.name}</h3>
                          <p className="text-sm text-zinc-500">{users.filter(u => u.role === profile.role).length} utilisateur(s)</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProfile(profile); setIsProfileModalOpen(true); }}>
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteProfile(profile.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{profile.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500 uppercase">Rôle associé: {roleLabels[profile.role] || profile.role}</p>
                      <p className="text-xs font-medium text-zinc-500 uppercase">Permissions ({profile.permissions.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.permissions.slice(0, 5).map((perm, i) => (
                          <Badge key={i} variant="default" className="text-xs">{perm}</Badge>
                        ))}
                        {profile.permissions.length > 5 && (
                          <Badge variant="default" className="text-xs">+{profile.permissions.length - 5}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cabinets' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Gestion des cabinets
              </h2>
              <Button>+ Ajouter un cabinet</Button>
            </div>
            <div className="space-y-4">
              {db.getCabinets().map((cabinet) => (
                <div key={cabinet.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{cabinet.name}</h3>
                      <p className="text-sm text-zinc-500">{cabinet.address}</p>
                      <p className="text-sm text-zinc-500">{cabinet.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cabinet.isActive ? 'success' : 'error'}>
                        {cabinet.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Paramètres de la plateforme
            </h2>
            <div className="space-y-4">
              {[
                { title: 'Notifications email', desc: 'Envoyer des notifications par email', enabled: true },
                { title: 'Rapports automatiques', desc: 'Générer des rapports hebdomadaires', enabled: false },
                { title: 'Visites à domicile', desc: 'Autoriser les visites à domicile', enabled: true },
                { title: 'Évaluations gériatriques', desc: 'Activer les évaluations standardisées', enabled: true },
              ].map((setting, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{setting.title}</p>
                    <p className="text-sm text-zinc-500">{setting.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={setting.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-500 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
        size="lg"
      >
        <UserForm 
          user={editingUser} 
          onClose={() => { setIsUserModalOpen(false); setEditingUser(null); refreshUsers(); }} 
        />
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => { setIsRoleModalOpen(false); setEditingRole(null); }}
        title={editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
        size="lg"
      >
        <RoleForm 
          role={editingRole} 
          allPermissions={defaultPermissions}
          onSave={handleSaveRole}
          onClose={() => { setIsRoleModalOpen(false); setEditingRole(null); }} 
        />
      </Modal>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => { setIsProfileModalOpen(false); setEditingProfile(null); }}
        title={editingProfile ? 'Modifier le profil' : 'Créer un nouveau profil'}
        size="lg"
      >
        <ProfileForm 
          profile={editingProfile}
          allPermissions={defaultPermissions}
          roleOptions={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
          onSave={handleSaveProfile}
          onClose={() => { setIsProfileModalOpen(false); setEditingProfile(null); }} 
        />
      </Modal>
    </DashboardLayout>
  );
}

function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    patient: ['Voir son dossier médical', 'Voir ses rendez-vous', 'Voir ses visites à domicile'],
    medecin: ['Gérer les patients', 'Créer des évaluations', 'Voir les dossiers médicaux', 'Gérer les rendez-vous'],
    agent_terrain: ['Effectuer des visites à domicile', 'Rédiger des rapports', 'Voir les patients assignés'],
    chef_cabinet: ['Toutes les permissions médecin', 'Gérer les agents', 'Voir les statistiques', 'Administration'],
    admin: ['Gestion des utilisateurs', 'Gestion des cabinets', 'Paramètres système'],
    super_admin: ['Accès complet', 'Gestion multi-cabinets', 'Configuration avancée'],
  };
  return permissions[role] || [];
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    role: user?.role || 'patient',
    specialty: user?.specialty || '',
    licenseNumber: user?.licenseNumber || '',
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      db.updateUser(user.id, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role as UserRole,
        specialty: formData.specialty || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        isActive: formData.isActive,
      });
    } else {
      db.createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role as UserRole,
        specialty: formData.specialty || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        isActive: formData.isActive,
      });
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Prénom"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <Input
          label="Nom"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <Input
        label="Téléphone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Rôle</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          <option value="patient">Patient</option>
          <option value="medecin">Médecin</option>
          <option value="agent_terrain">Agent de terrain</option>
          <option value="chef_cabinet">Chef de Cabinet</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>

      {(formData.role === 'medecin' || formData.role === 'chef_cabinet') && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Spécialité"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            placeholder="Gériatrie"
          />
          <Input
            label="Numéro de licence"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="FR-123456"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm text-zinc-700 dark:text-zinc-300">
          Compte actif
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          {user ? 'Enregistrer' : 'Créer l\'utilisateur'}
        </Button>
      </div>
    </form>
  );
}

function RoleForm({ 
  role, 
  allPermissions, 
  onSave, 
  onClose 
}: { 
  role: CustomRole | null; 
  allPermissions: string[];
  onSave: (role: CustomRole) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [] as string[],
    color: role?.color || 'blue',
    isDefault: role?.isDefault || false,
  });

  const colors = [
    { value: 'blue', label: 'Bleu', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900' },
    { value: 'green', label: 'Vert', bg: 'bg-green-100', darkBg: 'dark:bg-green-900' },
    { value: 'purple', label: 'Violet', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900' },
    { value: 'pink', label: 'Rose', bg: 'bg-pink-100', darkBg: 'dark:bg-pink-900' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900' },
    { value: 'red', label: 'Rouge', bg: 'bg-red-100', darkBg: 'dark:bg-red-900' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: role?.id || '',
      ...formData,
    });
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({ ...prev, permissions: [...allPermissions] }));
  };

  const selectNone = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nom du rôle"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Coordinateur"
        required
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
        <textarea
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 min-h-[80px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez ce rôle..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Couleur</label>
        <div className="flex gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`w-8 h-8 rounded-full ${color.bg} ${color.darkBg} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-zinc-900' : ''}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permissions ({formData.permissions.length})
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:underline">
              Tout sélectionner
            </button>
            <button type="button" onClick={selectNone} className="text-xs text-zinc-500 hover:underline">
              Tout désélectionner
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2">
          {allPermissions.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 p-1 rounded">
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
                className="rounded"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{perm}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isDefault" className="text-sm text-zinc-700 dark:text-zinc-300">
          Rôle par défaut pour les nouveaux utilisateurs
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          {role ? 'Enregistrer' : 'Créer le rôle'}
        </Button>
      </div>
    </form>
  );
}

function ProfileForm({ 
  profile, 
  allPermissions,
  roleOptions,
  onSave, 
  onClose 
}: { 
  profile: Profile | null; 
  allPermissions: string[];
  roleOptions: { value: string; label: string }[];
  onSave: (profile: Profile) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    description: profile?.description || '',
    role: profile?.role || 'medecin',
    permissions: profile?.permissions || [] as string[],
    color: profile?.color || 'blue',
  });

  const colors = [
    { value: 'blue', label: 'Bleu', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900' },
    { value: 'green', label: 'Vert', bg: 'bg-green-100', darkBg: 'dark:bg-green-900' },
    { value: 'purple', label: 'Violet', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900' },
    { value: 'pink', label: 'Rose', bg: 'bg-pink-100', darkBg: 'dark:bg-pink-900' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900' },
    { value: 'red', label: 'Rouge', bg: 'bg-red-100', darkBg: 'dark:bg-red-900' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: profile?.id || '',
      ...formData,
    });
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({ ...prev, permissions: [...allPermissions] }));
  };

  const selectNone = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nom du profil"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Ex: Médecin Chef"
        required
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
        <textarea
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 min-h-[80px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez ce profil..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Rôle associé</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Couleur</label>
        <div className="flex gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`w-8 h-8 rounded-full ${color.bg} ${color.darkBg} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-zinc-900' : ''}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permissions ({formData.permissions.length})
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:underline">
              Tout sélectionner
            </button>
            <button type="button" onClick={selectNone} className="text-xs text-zinc-500 hover:underline">
              Tout désélectionner
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2">
          {allPermissions.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 p-1 rounded">
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
                className="rounded"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{perm}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          {profile ? 'Enregistrer' : 'Créer le profil'}
        </Button>
      </div>
    </form>
  );
}
