import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';
import { api } from '../../services/api';
import { User as UserType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('rodrigo@padelvitacura.cl');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register({ email, password, name, clubName: 'Mi Club de Pádel' });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(userEmail, 'password123');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError('Error al iniciar sesión rápida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D9D9D2] shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F7F7F4] text-[#62626A] hover:text-[#101014] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center mb-1">
            <PadelBall size={28} glow />
          </div>
          <h3 className="text-2xl font-black text-[#101014] tracking-tight">
            {isLogin ? 'Acceso al Centro de Control' : 'Crear Cuenta en CanchaLlena'}
          </h3>
          <p className="text-xs text-[#62626A]">
            {isLogin
              ? 'Administre sus canchas, horarios valle y jugadores'
              : 'Pruebe gratis 14 días con su club'}
          </p>
        </div>

        {/* 1-Click Quick Demo Acccess Buttons */}
        <div className="mb-5 bg-[#F7F7F4] p-3 rounded-2xl border border-[#D9D9D2] space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C3AED] block text-center">
            ⚡ Acceso Rápido de Demostración (1 Clic)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('rodrigo@padelvitacura.cl')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D9D9D2] hover:border-[#7C3AED] text-left text-xs font-semibold text-[#101014] shadow-2xs hover:bg-[#7C3AED]/5 transition-all"
            >
              <span className="block font-bold text-[#7C3AED] text-[11px]">Dueño de Club</span>
              <span className="text-[10px] text-[#62626A] truncate block">Rodrigo (Vitacura)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('juan.silva@email.com')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D9D9D2] hover:border-[#7C3AED] text-left text-xs font-semibold text-[#101014] shadow-2xs hover:bg-[#7C3AED]/5 transition-all"
            >
              <span className="block font-bold text-[#16A34A] text-[11px]">Jugador Nivel 3.5</span>
              <span className="text-[10px] text-[#62626A] truncate block">Juan Ignacio</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#101014] mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#62626A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Rodrigo Martínez"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] text-xs font-semibold text-[#101014] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#101014] mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#62626A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rodrigo@miclub.cl"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] text-xs font-semibold text-[#101014] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#101014] mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#62626A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] text-xs font-semibold text-[#101014] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <span>{isLogin ? 'Ingresar al Panel' : 'Crear Cuenta Gratis'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-5 text-center text-xs text-[#62626A]">
          {isLogin ? (
            <p>
              ¿No tiene cuenta aún?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-[#7C3AED] font-bold hover:underline cursor-pointer"
              >
                Comenzar prueba gratis
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tiene cuenta?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-[#7C3AED] font-bold hover:underline cursor-pointer"
              >
                Iniciar sesión
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
