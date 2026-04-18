'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Select, Tabs } from '@/components/ui';
import { UserRole } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as UserRole,
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    specialty: '',
    licenseNumber: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <h1 className="text-5xl font-bold text-white mb-6">
            Rejoignez<br />notre équipe
          </h1>
          <p className="text-xl text-zinc-400 max-w-md">
            Créez votre compte et commencez à gérer vos patients efficacement
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="SEVEN" className="h-10 max-w-[140px] w-full object-contain" />
            </Link>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Créer un compte
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Étape {step} sur 3
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`
                      h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm
                      ${s <= step
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }
                    `}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded ${s < step ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <Select
                    label="Je suis..."
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    options={[
                      { value: 'patient', label: 'Patient' },
                      { value: 'medecin', label: 'Médecin' },
                      { value: 'chef_cabinet', label: 'Chef de Cabinet' },
                    ]}
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="vous@exemple.fr"
                    required
                  />
                  
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="Jean"
                      required
                    />
                    <Input
                      label="Nom"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Dupont"
                      required
                    />
                  </div>
                  
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                  
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  />
                  
                  <Select
                    label="Genre"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    options={[
                      { value: '', label: 'Sélectionner...' },
                      { value: 'male', label: 'Homme' },
                      { value: 'female', label: 'Femme' },
                      { value: 'other', label: 'Autre' },
                    ]}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {(formData.role === 'medecin' || formData.role === 'chef_cabinet') && (
                    <>
                      <Input
                        label="Spécialité"
                        value={formData.specialty}
                        onChange={(e) => handleChange('specialty', e.target.value)}
                        placeholder="Gériatrie"
                        required
                      />
                      
                      <Input
                        label="Numéro de licence"
                        value={formData.licenseNumber}
                        onChange={(e) => handleChange('licenseNumber', e.target.value)}
                        placeholder="FR-123456"
                        required
                      />
                    </>
                  )}
                  
                  <Input
                    label="Adresse"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Rue de la Médecine, 75001 Paris"
                  />
                  
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      En créant un compte, vous acceptez nos{' '}
                      <a href="#" className="text-zinc-900 dark:text-zinc-100 underline">Conditions d'utilisation</a>
                      {' '}et notre{' '}
                      <a href="#" className="text-zinc-900 dark:text-zinc-100 underline">Politique de confidentialité</a>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading}
                >
                  {step < 3 ? 'Continuer' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
