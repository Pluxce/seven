'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';

/* ── Intersection Observer hook ───────────────────────────────── */
function useInView(ref: React.RefObject<Element | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('in-view'); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}

function Section({ children, className = '', id = '' }: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useInView(ref as React.RefObject<Element>);
  return (
    <section id={id} ref={ref} className={`${className} transition-all duration-1000 opacity-0 translate-y-8 [&.in-view]:opacity-100 [&.in-view]:translate-y-0`}>
      {children}
    </section>
  );
}

/* ── Root page ────────────────────────────────────────────────── */
export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.push('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (user) return null;
  return <LandingPage />;
}

function LandingPage() {
  const [rdvOpen, setRdvOpen] = useState(false);
  return (
    <div className="landing min-h-screen bg-white text-zinc-900 antialiased selection:bg-emerald-100">
      <Navbar onRdv={() => setRdvOpen(true)} />
      <Hero onRdv={() => setRdvOpen(true)} />
      <Services />
      <Stats />
      <Team />
      <AppointmentBlock />
      <Testimonials />
      <Contact />
      <Footer />
      {rdvOpen && <RdvOverlay onClose={() => setRdvOpen(false)} />}
    </div>
  );
}

/* ── NAVBAR (Fix: Mobile menu restored) ───────────────────────── */
function Navbar({ onRdv }: { onRdv: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { href: '#services', label: 'Services' },
    { href: '#equipe', label: 'Équipe' },
    { href: '#rendez-vous', label: 'Rendez-vous' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 h-20 flex items-center
      ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-all ${scrolled ? 'bg-emerald-600 shadow-lg' : 'bg-white/10 backdrop-blur-md'}`}>
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div className="leading-tight">
            <span className={`block text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-zinc-900' : 'text-white'}`}>SEVEN</span>
            <span className={`block text-[10px] font-bold uppercase tracking-widest transition-colors ${scrolled ? 'text-emerald-600' : 'text-emerald-400'}`}>Médical</span>
          </div>
        </a>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-10">
          {links.map(l => (
            <a key={l.href} href={l.href} className={`text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 ${scrolled ? 'text-zinc-500 hover:text-emerald-600' : 'text-white/70 hover:text-white'}`}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/login" className={`hidden sm:block text-xs font-bold uppercase tracking-widest ${scrolled ? 'text-zinc-900' : 'text-white/90'}`}>Connexion</Link>
          <button onClick={onRdv} className="px-6 py-3 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
            Prendre RDV
          </button>
          {/* Mobile Toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-zinc-700' : 'text-white'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-zinc-100 shadow-2xl p-6 animate-fade-in">
          <div className="flex flex-col gap-4">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-emerald-600 p-2">
                {l.label}
              </a>
            ))}
            <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
              <Link href="/login" className="text-center py-4 text-xs font-bold uppercase tracking-widest text-zinc-900 bg-zinc-50 rounded-xl">Connexion</Link>
              <button onClick={() => { setMenuOpen(false); onRdv(); }} className="py-4 text-xs font-bold uppercase tracking-widest text-white bg-emerald-600 rounded-xl">Prendre RDV</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── 1. HERO (IMAGE) ─────────────────────────────────────────── */
function Hero({ onRdv }: { onRdv: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=85" alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-zinc-950/70" />
      </div>
      
      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <div className="inline-block px-4 py-1.5 bg-emerald-600/20 backdrop-blur-md border border-emerald-400/30 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">
          Spécialité Gériatrie · Abidjan
        </div>
        <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[0.9] mb-10">
          L'expertise médicale <br />
          <span className="text-emerald-500">au service de l'âge.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          Le Centre Médical SEVEN offre des soins spécialisés, une approche humaine et un suivi personnalisé pour garantir la meilleure qualité de vie de nos aînés.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button onClick={onRdv} className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95">
            Prendre rendez-vous
          </button>
          <a href="#services" className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all text-center">
            Nos services
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── 2. SERVICES (BLANC) ──────────────────────────────────────── */
function Services() {
  const items = [
    { icon: '🩺', title: 'Évaluation Gériatrique', desc: 'Bilan complet : cognitif (MMS), autonomie (ADL/IADL), risque de chute (Morse) et état nutritionnel.' },
    { icon: '🏠', title: 'Visites à Domicile', desc: 'Nos agents se déplacent chez vous pour le suivi médical, paramètres vitaux et soins infirmiers.' },
    { icon: '💊', title: 'Consultations Spécialisées', desc: 'Gériatres et neurologues spécialisés dans les pathologies du grand âge.' },
    { icon: '📊', title: 'Suivi & Monitoring', desc: 'Dossier numérique avec historique complet, paramètres vitaux et coordination pluridisciplinaire.' },
    { icon: '📝', title: 'Ordonnances', desc: 'Gestion des prescriptions, renouvellements et coordination avec les pharmacies partenaires.' },
    { icon: '👨‍👩‍👧', title: 'Accompagnement Familial', desc: 'Formation et soutien aux aidants familiaux, conseils pratiques et groupes d\'entraide.' },
  ];

  return (
    <Section id="services" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-24">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Départements Médicaux</span>
          <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-[0.95]">Une prise en charge<br /><span className="text-zinc-400">multidimensionnelle</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((s, i) => (
            <div key={i} className="group p-10 bg-white border border-zinc-100 rounded-3xl hover:border-emerald-100 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500">
              <div className="text-4xl mb-8 group-hover:scale-110 transition-transform">{s.icon}</div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">{s.title}</h3>
              <p className="text-zinc-500 leading-relaxed font-medium text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 3. STATS (VERT) ─────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: '500+', label: 'Patients accompagnés' },
    { value: '15 ans', label: "D'expérience en gériatrie" },
    { value: '98%', label: 'Taux de satisfaction' },
    { value: '2 000+', label: 'Évaluations réalisées' },
  ];

  return (
    <Section className="py-24 bg-emerald-600 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="group">
              <p className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-2 tabular-nums">{s.value}</p>
              <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 4. TEAM (BLANC) ─────────────────────────────────────────── */
function Team() {
  const members = [
    { name: 'Dr. Marie Martin', role: 'Gériatre — Chef de Service', exp: '18 ans', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80' },
    { name: 'Dr. Konan Yao', role: 'Neurologue Gériatrique', exp: '12 ans', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80' },
    { name: 'Jean Dupont', role: 'Directeur Médical', exp: '20 ans', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80' },
    { name: 'Ahmed Benali', role: 'Infirmier Terrain Senior', exp: '8 ans', img: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80' },
  ];

  return (
    <Section id="equipe" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="mb-24">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Experts Médicaux</span>
          <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-none">Dédiés à vos aînés</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {members.map((m, i) => (
            <div key={i} className="group">
              <div className="relative aspect-[4/5] mb-8 rounded-[40px] overflow-hidden bg-zinc-100 shadow-xl shadow-zinc-100/50">
                <img src={m.img} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute bottom-4 right-4 bg-white/90 text-zinc-700 text-[10px] font-bold px-3 py-1 rounded-full">{m.exp} exp.</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-1 tracking-tight">{m.name}</h3>
              <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 5. APPOINTMENT (NOIR) ───────────────────────────────────── */
function AppointmentBlock() {
  return (
    <Section id="rendez-vous" className="py-32 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <div className="text-left">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block">Prise de rendez-vous</span>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-[0.95] mb-10">Prenez rendez-vous <br /><span className="text-zinc-600 italic">en ligne.</span></h2>
            <p className="text-zinc-400 text-lg mb-12 font-medium leading-relaxed">Remplissez le formulaire — notre équipe vous confirme dans les 24 heures et crée votre espace patient.</p>
            
            <ul className="space-y-6 mb-12">
              {[
                'Confirmation par téléphone ou email sous 24h',
                'Choix du médecin et des créneaux disponibles',
                'Consultation au cabinet ou à domicile',
                'Compte patient créé automatiquement à la confirmation',
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">✓</div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>

            <div className="p-8 border border-zinc-800 rounded-3xl bg-white/5 space-y-4">
              <p className="text-zinc-400 text-sm flex items-center gap-3"><span className="text-white font-bold">📍 </span> Cocody Angré, Rue des Jardins, Abidjan</p>
              <p className="text-zinc-400 text-sm flex items-center gap-3"><span className="text-white font-bold">📞 </span> +225 27 22 40 00 00</p>
              <p className="text-zinc-400 text-sm flex items-center gap-3"><span className="text-white font-bold">🕐 </span> Lun–Sam : 8h00 – 18h00</p>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl">
            <InlineRdvForm />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── 6. TESTIMONIALS (BLANC) ─────────────────────────────────── */
function Testimonials() {
  const items = [
    { name: 'Adjoua K.', relation: "Fille d'un patient", text: "Grâce au Centre SEVEN, mon père de 82 ans est suivi régulièrement à domicile. L'équipe est professionnelle et toujours disponible." },
    { name: 'Kofi M.', relation: 'Patient, 76 ans', text: "L'évaluation gériatrique m'a permis de mieux comprendre mon état de santé. Les médecins prennent le temps d'écouter." },
    { name: 'Ama S.', relation: "Petite-fille d'une patiente", text: "Ma grand-mère a trouvé le soutien dont elle avait besoin après sa fracture. Les visites à domicile ont changé sa qualité de vie." },
  ];

  return (
    <Section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="mb-24">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Témoignages</span>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">Ils nous font confiance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {items.map((t, i) => (
            <div key={i} className="p-10 bg-zinc-50 rounded-[32px] hover:bg-white border border-transparent hover:border-zinc-100 hover:shadow-xl transition-all duration-500 group text-left">
              <div className="flex gap-1 mb-8">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-emerald-500 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-600 text-lg font-medium leading-relaxed italic mb-10">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center font-black text-zinc-400 text-xs">{t.name[0]}</div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm tracking-tight">{t.name}</p>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{t.relation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 7. CONTACT (FOND BLANC) ─────────────────────────────────── */
function Contact() {
  return (
    <Section id="contact" className="py-32 bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16 text-center">
          {[
            { icon: '📍', title: 'Siège Social', lines: ["Cocody Angré, Rue des Jardins", "Abidjan, Côte d'Ivoire"] },
            { icon: '📞', title: 'Ligne Directe', lines: ['+225 27 22 40 00 00', '+225 07 00 00 00 00'] },
            { icon: '🕐', title: 'Horaires', lines: ['Lun–Ven : 8h00 – 18h00', 'Sam : 9h00 – 14h00'] },
          ].map((c, i) => (
            <div key={i} className="bg-zinc-50 p-12 text-center rounded-[32px] shadow-sm border border-zinc-100 transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="text-4xl mb-6">{c.icon}</div>
              <h3 className="font-bold text-zinc-900 text-lg uppercase tracking-widest mb-4">{c.title}</h3>
              {c.lines.map((l, j) => <p key={j} className="text-zinc-500 font-medium text-sm leading-relaxed">{l}</p>)}
            </div>
          ))}
        </div>
        <div className="rounded-[40px] overflow-hidden border border-zinc-200 h-96 shadow-2xl">
          <iframe title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=-3.9744,5.3350,-3.9644,5.3450&layer=mapnik&marker=5.3400,-3.9694" width="100%" height="100%" style={{ border: 0 }} />
        </div>
      </div>
    </Section>
  );
}

/* ── RDV FORM (MULTI-STEPS) ──────────────────────────────────── */
function InlineRdvForm() {
  const medecins = db.getMedecins();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    reason: '', preferredDate: '', preferredTime: '', medecinId: '', message: '',
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (form.medecinId && form.preferredDate) {
      const s = db.getAvailableSlots(form.medecinId, form.preferredDate);
      setSlots(s);
      if (s.length > 0 && !s.includes(form.preferredTime)) setForm(f => ({ ...f, preferredTime: s[0] }));
    } else setSlots([]);
  }, [form.medecinId, form.preferredDate, form.preferredTime]);

  const isStepValid = () => {
    if (step === 1) return form.firstName && form.lastName && form.phone && form.email;
    if (step === 2) return form.reason && form.preferredDate && (slots.length > 0 ? form.preferredTime : true);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }
    setStatus('loading');
    await new Promise(r => setTimeout(r, 800));
    db.createAppointmentRequest({ ...form, preferredTime: form.preferredTime || undefined, medecinId: form.medecinId || undefined, message: form.message || undefined });
    setStatus('success');
  };

  if (status === 'success') return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
      <h3 className="text-2xl font-bold text-zinc-900 mb-3 text-center">Demande envoyée !</h3>
      <p className="text-zinc-500 leading-relaxed font-medium">Merci {form.firstName}. Nous vous contacterons sous 24h.</p>
      <button onClick={() => { setStatus('idle'); setStep(1); }} className="mt-8 px-6 py-2.5 text-emerald-600 font-bold hover:underline mx-auto block">Nouvelle demande</button>
    </div>
  );

  const field = 'w-full border border-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-zinc-50 focus:bg-white text-left';
  const labelStyle = 'block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest text-left';

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><span>Étape {step} sur 3</span><span>{Math.round((step / 3) * 100)}%</span></div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} /></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelStyle}>Prénom</label><input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className={field} placeholder="Jean" /></div>
              <div><label className={labelStyle}>Nom</label><input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className={field} placeholder="Dupont" /></div>
            </div>
            <div><label className={labelStyle}>Téléphone</label><input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={field} placeholder="+225 07..." /></div>
            <div><label className={labelStyle}>Email</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={field} placeholder="jean@exemple.com" /></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div><label className={labelStyle}>Motif</label><select required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className={field}><option value="">Sélectionner...</option><option>Évaluation gériatrique</option><option>Consultation de suivi</option><option>Visite à domicile</option></select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelStyle}>Date</label><input type="date" value={form.preferredDate} required onChange={e => setForm({...form, preferredDate: e.target.value})} min={new Date().toISOString().split('T')[0]} className={field} /></div>
              <div><label className={labelStyle}>Heure</label>{slots.length > 0 ? <select value={form.preferredTime} onChange={e => setForm({...form, preferredTime: e.target.value})} className={field}>{slots.map(s => <option key={s} value={s}>{s}</option>)}</select> : <input type="time" value={form.preferredTime} required onChange={e => setForm({...form, preferredTime: e.target.value})} className={field} />}</div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div><label className={labelStyle}>Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} className={`${field} resize-none`} placeholder="Précisions utiles..." /></div>
            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-left font-medium text-sm"><p className="text-zinc-900 font-bold">{form.firstName} {form.lastName} · {form.reason}</p><p className="text-zinc-500 mt-1">{form.preferredDate} à {form.preferredTime}</p></div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="px-8 py-4 font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Retour</button>}
          <button type="submit" disabled={!isStepValid() || status === 'loading'} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-40 shadow-lg active:scale-95 transition-all">
            {status === 'loading' ? 'Envoi...' : step === 3 ? 'Confirmer' : 'Continuer'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── FOOTER ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-zinc-950 text-white py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20 border-b border-zinc-900 pb-20 text-left">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center"><Image src="/logo.png" alt="Logo" width={32} height={32} className="brightness-0" /></div>
              <div><span className="block text-3xl font-bold tracking-tight">SEVEN</span><span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em]">Centre Gériatrique</span></div>
            </div>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm font-medium">L'expertise médicale alliée à un profond humanisme pour la dignité de nos aînés.</p>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.3em] mb-8">Navigation</h4>
            <ul className="space-y-4 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <li><a href="#services" className="hover:text-emerald-400 transition-colors">Services</a></li>
              <li><a href="#equipe" className="hover:text-emerald-400 transition-colors">L'Équipe</a></li>
              <li><a href="#rendez-vous" className="hover:text-emerald-400 transition-colors">RDV</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.3em] mb-8">Espaces</h4>
            <ul className="space-y-4 text-sm font-bold text-zinc-500 uppercase tracking-widest">
              <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Patient</Link></li>
              <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Médecin</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700">
          <p>© {new Date().getFullYear()} SEVEN CENTRE MÉDICAL. Tous droits réservés.</p>
          <div className="flex gap-10"><a href="#" className="hover:text-white transition-colors">Mentions</a><a href="#" className="hover:text-white transition-colors">Confidentialité</a></div>
        </div>
      </div>
    </footer>
  );
}

/* ── RDV OVERLAY ──────────────────────────────────────────────── */
function RdvOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-left">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-10 py-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Prendre rendez-vous</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-10"><InlineRdvForm /></div>
      </div>
    </div>
  );
}
