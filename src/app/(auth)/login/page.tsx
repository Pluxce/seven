'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error ?? 'Email ou mot de passe incorrect');
    }

    setIsLoading(false);
  };

  const demoAccounts = [
    { email: 'admin@cabinet-geriatrie.fr', password: 'admin123', role: 'Super Admin' },
    { email: 'chef@cabinet-geriatrie.fr', password: 'chef123', role: 'Chef de Cabinet' },
    { email: 'medecin@cabinet-geriatrie.fr', password: 'medecin123', role: 'Médecin' },
    { email: 'agent@cabinet-geriatrie.fr', password: 'agent123', role: 'Agent de terrain' },
    { email: 'patient@cabinet-geriatrie.fr', password: 'patient123', role: 'Patient' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_40%)]" />
          <div className="relative z-10 flex flex-col justify-center px-12">
            <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">
              SEVEN
            </h1>
            <p className="text-lg text-blue-400 font-medium mb-4">
              Cabinet de Gériatrie
            </p>
            <p className="text-xl text-zinc-400 max-w-md">
              Plateforme de gestion des évaluations gériatriques et du suivi des patients
            </p>
          </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="SEVEN" className="h-10 max-w-[140px] w-full object-contain" />
            </Link>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Bon retour
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Connectez-vous à votre compte
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                required
              />
              
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Se connecter
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-4">
                Comptes de démonstration
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className="text-xs p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">{account.role}</span>
                    <span className="block text-zinc-500 dark:text-zinc-400 truncate">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Vous n&apos;avez pas de compte ?{' '}
            <Link href="/register" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
