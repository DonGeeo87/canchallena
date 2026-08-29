import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';
import { PadelBall } from './PadelBall';

interface FooterProps {
  onNavigate?: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#FFFFFF] border-t border-[#D9D9D2] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#D9D9D2]/70">
          {/* Col 1: Brand & Proposition */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#101014] flex items-center justify-center border border-[#D9D9D2]">
                <PadelBall size={12} glow={false} />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#101014]">
                Cancha<span className="text-[#7C3AED]">Llena</span>
              </span>
            </div>

            <p className="text-sm text-[#62626A] max-w-md leading-relaxed">
              Automatización inteligente para clubes de pádel en Chile y Latinoamérica. Conectamos su WhatsApp para llenar horarios valle, gestionar reservas y armar partidos compatibles 4/4 en segundos.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                Servicio Operativo 99.9%
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                <Zap className="w-3 h-3 text-[#7C3AED]" />
                WhatsApp Cloud Sync
              </span>
            </div>
          </div>

          {/* Col 2: Producto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101014] mb-4">
              Producto
            </h4>
            <ul className="space-y-2.5 text-sm text-[#62626A]">
              <li>
                <a href="#como-funciona" className="hover:text-[#7C3AED] transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#matchmaking" className="hover:text-[#7C3AED] transition-colors flex items-center gap-1">
                  Matchmaking Automático
                  <span className="text-[10px] bg-[#C7F000] text-[#101014] px-1.5 py-0.5 rounded-md font-bold">
                    PRO
                  </span>
                </a>
              </li>
              <li>
                <a href="#horarios-valle" className="hover:text-[#7C3AED] transition-colors">
                  Horarios Valle & Ocupación
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('/club/padel-club-vitacura')}
                  className="hover:text-[#7C3AED] transition-colors text-left flex items-center gap-1 text-[#7C3AED] font-medium"
                >
                  Micrositio Club Vitacura
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
              <li>
                <a href="#precios" className="hover:text-[#7C3AED] transition-colors">
                  Planes y Precios
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Clubes & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101014] mb-4">
              Clubes & Contacto
            </h4>
            <ul className="space-y-2.5 text-sm text-[#62626A]">
              <li>
                <button
                  onClick={() => onNavigate?.('/login')}
                  className="hover:text-[#7C3AED] transition-colors text-left font-semibold text-[#101014]"
                >
                  Acceso Administrador Club
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#7C3AED] transition-colors">
                  Preguntas Frecuentes (FAQ)
                </a>
              </li>
              <li>
                <a href="mailto:contacto@canchallena.cl" className="hover:text-[#7C3AED] transition-colors">
                  Soporte WhatsApp Clubes
                </a>
              </li>
              <li>
                <span className="text-xs text-[#62626A] block pt-2">
                  Santiago, Chile · Vitacura / Las Condes / Lo Barnechea / Chicureo
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62626A]">
          <p>© {new Date().getFullYear()} CanchaLlena SpA. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#101014]">Hecho por Código Guerrero Dev</span>
            <span className="text-[#D9D9D2]">|</span>
            <span>Sport-Tech Chile</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
