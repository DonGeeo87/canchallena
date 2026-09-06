import { useState } from 'react';
import { UploadCloud, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function ImportSocios({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState('');
  const [categoria, setCategoria] = useState('6ª');
  const [resultado, setResultado] = useState<null | { creados: number; actualizados: number; errores: number; detalleErrores?: string[] }>(null);
  const [cargando, setCargando] = useState(false);

  async function importar() {
    const lineas = text.split('\n').map(l => l.trim()).filter(Boolean);
    const socios = lineas.map(l => {
      // Soporta "Nombre, Telefono" o "Nombre; Telefono" o "Nombre Telefono"
      const partes = l.split(/[,;]\s*|\s{2,}/);
      const name = partes[0]?.trim() || '';
      const phone = (partes[1] || partes[0] || '').replace(/[^\d+]/g, '');
      return { name, phone, categoria };
    }).filter(s => s.name && s.phone);
    if (!socios.length) { alert('Pega una lista con Nombre y Teléfono en cada línea'); return; }
    setCargando(true);
    try {
      const r = await api.players.import(socios);
      setResultado(r);
      onImported();
    } catch (e: any) {
      alert(e?.message || 'Error al importar');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#D9D9D2] space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-[#101014]">Importar socios</h4>
          <p className="text-[11px] text-[#62626A]">Pega tu lista (Nombre, Teléfono) o súbela por CSV. Crea o actualiza según el número de WhatsApp.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="text-xs font-semibold text-[#101014] sm:col-span-1">
          Categoría por defecto
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-[#D9D9D2] text-xs font-semibold focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="3ª">3ª</option>
            <option value="4ª">4ª</option>
            <option value="5ª">5ª</option>
            <option value="6ª">6ª</option>
          </select>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={'Ejemplo:\nJuan Pérez, +56912345678\nMaría Soto, +56987654321'}
          className="w-full px-3 py-2 rounded-xl bg-white border border-[#D9D9D2] text-xs focus:outline-none focus:border-[#7C3AED] sm:col-span-2"
        />
        <div className="flex flex-col justify-end gap-2">
          <button
            onClick={importar}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            {cargando ? 'Importando...' : 'Importar socios'}
          </button>
        </div>
      </div>

      {resultado && (
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-[#D9D9D2] p-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#16A34A]">
            <CheckCircle2 className="w-4 h-4" /> {resultado.creados} creados
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-[#7C3AED]">
            <Users className="w-4 h-4" /> {resultado.actualizados} actualizados
          </span>
          {resultado.errores > 0 && (
            <span className="inline-flex items-center gap-1.5 font-bold text-[#DC2626]">
              <AlertTriangle className="w-4 h-4" /> {resultado.errores} errores
            </span>
          )}
        </div>
      )}
    </div>
  );
}
