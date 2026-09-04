import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { PadelBall } from './PadelBall';
import { User } from '../../types';

interface NavbarProps {
  onNavigate?: (route: string) => void;
  onOpenAuth?: () => void;
  user?: User | null;
  currentRoute?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onOpenAuth,
  user,
  currentRoute = '/',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href.startsWith('#')) {
      if (currentRoute !== '/') {
        onNavigate?.('/');
        setTimeout(() => {
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate?.(href);
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FFFFFF]/92 backdrop-blur-md shadow-xs border-b border-[#D9D9D2]/80 py-2.5'
          : 'bg-[#F7F7F4]/80 backdrop-blur-sm border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <a
            href="/"
            onClick={(e) => handleNavClick('/', e)}
            className="flex items-center gap-2.5 group cursor-pointer"
            id="brand-logo-link"
          >
            {/* Custom Padel Brand Geometric Emblem */}
            <div className="relative w-10 h-10 rounded-xl bg-[#101014] flex items-center justify-center overflow-hidden border border-[#D9D9D2] group-hover:border-[#7C3AED] transition-colors shadow-xs">
              {/* Mini court lines */}
              <div className="absolute inset-1 border border-white/25 rounded-sm"></div>
              <div className="absolute top-1/2 left-1 right-1 h-px bg-white/20"></div>
              <div className="absolute top-1 bottom-1 left-1/2 w-px bg-[#C7F000]/60"></div>
              {/* Ball */}
              <PadelBall size={14} glow={false} />
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#101014] flex items-center gap-1">
                Cancha<span className="text-[#7C3AED]">Llena</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#C7F000] animate-pulse"></span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#62626A] -mt-1">
                SaaS Pádel B2B
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <a
              href="#como-funciona"
              onClick={(e) => handleNavClick('#como-funciona', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              Cómo funciona
            </a>
            <a
              href="#matchmaking"
              onClick={(e) => handleNavClick('#matchmaking', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors flex items-center gap-1.5"
            >
              Matchmaking
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#7C3AED]/10 text-[#7C3AED]">
                4/4
              </span>
            </a>
            <a
              href="#horarios-valle"
              onClick={(e) => handleNavClick('#horarios-valle', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              Horarios Valle
            </a>
            <a
              href="#calculadora"
              onClick={(e) => handleNavClick('#calculadora', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              Calculadora ROI
            </a>
            <a
              href="#precios"
              onClick={(e) => handleNavClick('#precios', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              Precios
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick('#faq', e)}
              className="text-sm font-medium text-[#62626A] hover:text-[#101014] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              FAQ
            </a>
            <button
              onClick={() => onNavigate?.('/club/padel-club-vitacura')}
              className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] px-2.5 py-1.5 rounded-lg bg-[#7C3AED]/8 hover:bg-[#7C3AED]/15 transition-colors flex items-center gap-1 cursor-pointer"
              title="Ver micrositio público para jugadores"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Micrositio Club
            </button>
          </nav>

          {/* Desktop Right CTA Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => onNavigate?.('/dashboard')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D9D2] hover:border-[#7C3AED] text-xs font-bold text-[#101014] shadow-2xs transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px]">
                  {user.name.slice(0, 1)}
                </div>
                <span>Ir al Panel</span>
              </button>
            ) : (
              <>
                <button
                  id="nav-login-button"
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth();
                    else onNavigate?.('/login');
                  }}
                  className="text-sm font-semibold text-[#101014] hover:text-[#7C3AED] px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                  Acceso Club
                </button>

                <button
                  id="nav-cta-try-free"
                  onClick={() => onNavigate?.('/demo')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <span>Probar CanchaLlena</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                if (user) onNavigate?.('/dashboard');
                else if (onOpenAuth) onOpenAuth();
                else onNavigate?.('/login');
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white"
            >
              {user ? 'Panel' : 'Acceso Club'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#101014] hover:bg-black/5"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-4 border-t border-[#D9D9D2]/80 mt-3 space-y-2 bg-[#FFFFFF] rounded-2xl p-4 shadow-lg">
            <a
              href="#como-funciona"
              onClick={(e) => handleNavClick('#como-funciona', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Cómo funciona
            </a>
            <a
              href="#matchmaking"
              onClick={(e) => handleNavClick('#matchmaking', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Matchmaking (4/4)
            </a>
            <a
              href="#horarios-valle"
              onClick={(e) => handleNavClick('#horarios-valle', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Horarios Valle & Ocupación
            </a>
            <a
              href="#calculadora"
              onClick={(e) => handleNavClick('#calculadora', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Calculadora ROI
            </a>
            <a
              href="#precios"
              onClick={(e) => handleNavClick('#precios', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Planes & Precios
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick('#faq', e)}
              className="block text-base font-medium text-[#101014] py-2 px-3 rounded-lg hover:bg-black/5"
            >
              Preguntas Frecuentes
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate?.('/club/padel-club-vitacura');
              }}
              className="w-full text-left text-sm font-semibold text-[#7C3AED] py-2 px-3 rounded-lg bg-[#7C3AED]/10 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Ver Micrositio Público Demo
            </button>
            <div className="pt-2 border-t border-[#D9D9D2]/60 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) onNavigate?.('/dashboard');
                  else if (onOpenAuth) onOpenAuth();
                  else onNavigate?.('/login');
                }}
                className="w-full py-2.5 rounded-xl bg-[#7C3AED] text-white font-semibold text-center"
              >
                {user ? 'Ir al Panel de Control' : 'Probar gratis 14 días'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
