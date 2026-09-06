import { useState, useEffect } from 'react';
import { Settings, Plus, Clock } from 'lucide-react';
import { api } from '../../services/api';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ConfigCanchas({ onChanged }: { onChanged: () => void }) {
  const [courts, setCourts] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [horas, setHoras] = useState<{ day_of_week: number; open_time: string; close_time: string }[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [c, clubData] = await Promise.all([api.courts.getAll(), fetch('/api/club', { headers: { Authorization: `Bearer ${localStorage.getItem('canchallena_token')}` } }).then(r => r.json())]);
      setCourts(c);
      setHoras(clubData?.hours || []);
    } catch (e) { console.error(e); }
  }

  async function addCourt() {
    if (!nombre || !precio) return alert('Nombre y precio requeridos');
    await api.courts.create(nombre, Number(precio));
    setNombre(''); setPrecio('');
    await load(); onChanged();
  }

  function setDia(dow: number, open: string, close: string) {
    setHoras(prev => {
      const ex = prev.findIndex(h => h.day_of_week === dow);
      const copy = [...prev];
      if (ex >= 0) copy[ex] = { day_of_week: dow, open_time: open, close_time: close };
      else copy.push({ day_of_week: dow, open_time: open, close_time: close });
      return copy;
    });
  }

  async function saveHours() {
    await api.club.setHours(horas);
    onChanged();
  }

  return (
    <div className="space-y-6">
      {/* Agregar cancha */}
      <div className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#D9D9D2] space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#101014]">
          <Settings className="w-5 h-5 text-[#7C3AED]" /> Canchas del club
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej. Cancha 1 Cristal)" className="px-3 py-2 rounded-xl bg-white border border-[#D9D9D2] text-xs" />
          <input value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio por slot (CLP)" type="number" className="px-3 py-2 rounded-xl bg-white border border-[#D9D9D2] text-xs" />
          <button onClick={addCourt} className="inline-flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl px-4 py-2">
            <Plus className="w-4 h-4" /> Agregar cancha
          </button>
        </div>
        {courts.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {courts.map(c => (
              <span key={c.id} className="inline-flex items-center gap-2 bg-white border border-[#D9D9D2] rounded-xl px-3 py-1.5 font-semibold">
                {c.name} · $ {Number(c.price_per_slot).toLocaleString('de-DE')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Horarios por día */}
      <div className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#D9D9D2] space-y-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#101014]">
          <Clock className="w-5 h-5 text-[#7C3AED]" /> Horarios del club por día
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIAS.map((d, dow) => {
            const h = horas.find(x => x.day_of_week === dow);
            return (
              <div key={dow} className="flex items-center gap-2 text-xs bg-white border border-[#D9D9D2] rounded-xl p-2">
                <span className="font-bold w-20">{d}</span>
                <input type="time" value={h?.open_time || '09:00'} onChange={e => setDia(dow, e.target.value, h?.close_time || '23:00')} className="px-2 py-1 rounded-lg border border-[#D9D9D2] text-xs" />
                <span className="text-[#62626A]">a</span>
                <input type="time" value={h?.close_time || '23:00'} onChange={e => setDia(dow, h?.open_time || '09:00', e.target.value)} className="px-2 py-1 rounded-lg border border-[#D9D9D2] text-xs" />
              </div>
            );
          })}
        </div>
        <button onClick={saveHours} className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl px-4 py-2">
          Guardar horarios
        </button>
      </div>
    </div>
  );
}
