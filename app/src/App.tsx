import { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroCourt } from './components/landing/HeroCourt';
import { ProblemSection } from './components/landing/ProblemSection';
import { WhatsAppMockup } from './components/landing/WhatsAppMockup';
import { MatchmakingShowcase } from './components/landing/MatchmakingShowcase';
import { ValleyHoursSection } from './components/landing/ValleyHoursSection';
import { DashboardPreview } from './components/landing/DashboardPreview';
import { HowItWorks } from './components/landing/HowItWorks';
import { NoAppSection } from './components/landing/NoAppSection';
import { ValueCalculator } from './components/landing/ValueCalculator';
import { PricingSection } from './components/landing/PricingSection';
import { FAQSection } from './components/landing/FAQSection';
import { FinalCTA } from './components/landing/FinalCTA';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClubMicrosite } from './components/public/ClubMicrosite';
import Demo from './components/demo/Demo';
import { api } from './services/api';
import { User } from './types';

export const API_BASE_URL = '/api'; // hardcodeado para MSYS2

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(
    window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : 'landing',
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (currentRoute === 'dashboard') {
        const user = await api.auth.getCurrentUser();
        if (!user) {
          setCurrentRoute('landing');
          setIsAuthModalOpen(true);
        } else {
          setCurrentUser(user);
        }
      }
    };
    checkSession();
  }, []);

  // Navegación simple con hash (SPA sin react-router para no acoplar el componente del agente)
  const handleNavigate = (route: string) => {
    if (route === '/login') { setIsAuthModalOpen(true); return; }
    if (route === '/dashboard' || route === '/admin') {
      if (currentUser) setCurrentRoute('dashboard');
      else setIsAuthModalOpen(true);
      return;
    }
    if (route.startsWith('/club/')) { setCurrentRoute('club_microsite'); return; }
    if (route === '/' || route === 'landing') { setCurrentRoute('landing'); return; }
    setCurrentRoute(route);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setCurrentRoute('dashboard');
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setCurrentRoute('landing');
  };

  if (currentRoute === 'dashboard' && currentUser) {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} onNavigateHome={() => setCurrentRoute('landing')} />;
  }

  if (currentRoute === 'club_microsite') {
    return <ClubMicrosite slug="club-piloto" onNavigateHome={() => setCurrentRoute('landing')} onOpenAuth={() => setIsAuthModalOpen(true)} />;
  }

  if (currentRoute === 'demo') {
    return <Demo onNavigateHome={() => setCurrentRoute('landing')} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#101014] flex flex-col font-sans">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} onNavigate={handleNavigate} user={currentUser} />
      <main className="flex-1">
        <HeroCourt onNavigate={handleNavigate} />
        <ProblemSection />
        <WhatsAppMockup />
        <MatchmakingShowcase />
        <ValleyHoursSection />
        <DashboardPreview onNavigate={handleNavigate} />
        <HowItWorks />
        <NoAppSection />
        <ValueCalculator onNavigate={handleNavigate} />
        <PricingSection onNavigate={handleNavigate} />
        <FAQSection />
        <FinalCTA onNavigate={handleNavigate} />
      </main>
      <Footer onNavigate={handleNavigate} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  );
}
