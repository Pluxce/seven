import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-zinc-900 dark:text-zinc-100">404</h1>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-4">
          Page non trouvée
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
