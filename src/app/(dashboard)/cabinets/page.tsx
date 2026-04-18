'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Cabinet } from '@/lib/types';

export default function CabinetsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && hasRole(['super_admin'])) {
      setCabinets(db.getCabinets());
    }
  }, [user, hasRole]);

  const handleSave = (cabinet: Partial<Cabinet>) => {
    if (editingCabinet) {
      db.updateCabinet?.(editingCabinet.id, cabinet);
    }
    setCabinets(db.getCabinets());
    setIsModalOpen(false);
    setEditingCabinet(null);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasRole(['super_admin'])) {
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
              Cabinets
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Gestion des cabinets médicaux
            </p>
          </div>
          <Button onClick={() => { setEditingCabinet(null); setIsModalOpen(true); }}>
            + Nouveau cabinet
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabinets.map((cabinet) => (
            <Card key={cabinet.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <Badge variant={cabinet.isActive ? 'success' : 'error'}>
                  {cabinet.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-2">
                {cabinet.name}
              </h3>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                {cabinet.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {cabinet.address}
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {cabinet.phone}
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {cabinet.email}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => { setEditingCabinet(cabinet); setIsModalOpen(true); }}
                >
                  Modifier
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {cabinets.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-zinc-500">Aucun cabinet trouvé</p>
            <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
              Ajouter un cabinet
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCabinet(null); }}
        title={editingCabinet ? 'Modifier le cabinet' : 'Nouveau cabinet'}
        size="lg"
      >
        <CabinetForm 
          cabinet={editingCabinet}
          onSave={handleSave}
          onClose={() => { setIsModalOpen(false); setEditingCabinet(null); }}
        />
      </Modal>
    </DashboardLayout>
  );
}

function CabinetForm({ cabinet, onSave, onClose }: { cabinet: Cabinet | null; onSave: (data: Partial<Cabinet>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: cabinet?.name || '',
    address: cabinet?.address || '',
    phone: cabinet?.phone || '',
    email: cabinet?.email || '',
    website: cabinet?.website || '',
    description: cabinet?.description || '',
    isActive: cabinet?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nom du cabinet"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <Input
        label="Adresse"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Téléphone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      
      <Input
        label="Site web"
        value={formData.website}
        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        placeholder="https://..."
      />
      
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
        <textarea
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm text-zinc-700 dark:text-zinc-300">
          Cabinet actif
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          {cabinet ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
