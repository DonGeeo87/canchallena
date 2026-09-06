import { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

// Contrato post-pago: se muestra al confirmar el pago, exige aceptar
// los términos y el uso privado de datos por el agente antes de activar el dashboard.
interface Props {
  plan: string;
  club_name?: string;
  onAceptar: () => void;
  onCancelar: () => void;
}

export default function ContractoModal({ plan, club_name, onAceptar, onCancelar }: Props) {
  const [acepta, setAcepta] = useState(false);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const aceptado = acepta && aceptaDatos;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#16A34A]/15 text-[#16A34A] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#101014]">Pago recibido — Configure su servicio</h2>
            <p className="text-xs text-[#7C3AED] font-semibold">Plan {plan === 'pro' ? 'Pro' : 'Club'}{club_name ? ` · ${club_name}` : ''}</p>
          </div>
        </div>

        <div className="bg-[#F7F7F4] rounded-2xl border border-[#D9D9D2] p-4 space-y-3 text-xs text-[#62626A]">
          <p className="font-bold text-[#101014]">Antes de activar su dashboard, le pedimos aceptar el contrato de servicio y el tratamiento de datos:</p>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#7C3AED]" />
            <span>
              Acepto los <strong className="text-[#7C3AED]">Términos de Uso</strong> y la{' '}
              <strong className="text-[#7C3AED]">Política de Privacidad</strong> de CanchaLlena, y entiendo que el servicio es de suscripción mensual según el plan contratado.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={aceptaDatos} onChange={(e) => setAceptaDatos(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#7C3AED]" />
            <span>
              Autorizo que el <strong className="text-[#101014]">asistente de CanchaLlena</strong> trate de forma privada los datos de mi club y de mis socios (nombre, teléfono/WhatsApp, categoría, horarios e historial deportivo) con el fin exclusivo de operar reservas, matchmaking, duplas y coach de progreso.
            </span>
          </label>
        </div>

        <button
          disabled={!aceptado}
          onClick={onAceptar}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#D9D9D2] disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          Aceptar y activar mi club
        </button>
        <button onClick={onCancelar} className="w-full text-center text-xs font-semibold text-[#62626A] hover:text-[#101014] py-1">
          Omitir por ahora (podrá completarlo en el panel)
        </button>
      </div>
    </div>
  );
}
