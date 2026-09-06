import { ArrowLeft } from 'lucide-react';

// Páginas legales de CanchaLlena — política de privacidad, términos y protección de datos.
// Se sirven como rutas hash: #/privacidad, #/terminos, #/datos
export type LegalPage = 'privacidad' | 'terminos' | 'datos';

const contenidos: Record<LegalPage, { titulo: string; secciones: { h: string; p: string }[] }> = {
  privacidad: {
    titulo: 'Política de Privacidad',
    secciones: [
      { h: '1. Responsable', p: 'CanchaLlena es un organizador inteligente de partidos de pádel operado por Código Guerrero Dev. Al usar el servicio, el club y sus socios aceptan el tratamiento de sus datos conforme a esta política.' },
      { h: '2. Datos que recopilamos', p: 'Recopilamos los datos que el club carga de sus socios (nombre, teléfono/WhatsApp, categoría, horarios, historial deportivo) y los datos de uso del panel. Los socios pueden consultar y corregir sus datos en cualquier momento.' },
      { h: '3. Finalidad del uso', p: 'Usamos los datos exclusivamente para operar el servicio: reservas, matchmaking, duplas, coach de progreso y comunicación de partidos por WhatsApp. No vendemos, no alquilamos ni compartimos los datos con terceros para fines publicitarios.' },
      { h: '4. Tratamiento por el agente', p: 'El asistente de CanchaLlena procesa los datos para reconocer al socio, armar su ficha y generar recomendaciones de juego. Este tratamiento es privado y está limitado a la operación de la cuenta del club.' },
      { h: '5. Almacenamiento y seguridad', p: 'Los datos se almacenan en servidores protegidos, accesibles solo por el club y el operador de la plataforma. Implementamos controles de acceso y cifrado en el tránsito. No retenemos datos de pago más allá de lo necesario.' },
      { h: '6. Derechos del titular', p: 'Todo socio o responsable de club puede solicitar acceso, rectificación, supresión o limitación del tratamiento de sus datos. Ejercer estos derechos escribiendo al contacto del club o a CanchaLlena.' },
      { h: '7. Contacto', p: 'Para consultas o solicitudes sobre privacidad, contacte a CanchaLlena a través del formulario de la página o el WhatsApp del operador de la plataforma.' },
    ],
  },
  terminos: {
    titulo: 'Términos de Uso',
    secciones: [
      { h: '1. Aceptación', p: 'Al contratar o usar CanchaLlena, el club acepta estos términos, la política de privacidad y las condiciones específicas del plan contratado (Club o Pro).' },
      { h: '2. Servicio', p: 'CanchaLlena ofrece gestión de reservas, matchmaking, duplas automáticas, coach de progreso y llenado de horarios a través de WhatsApp y un panel web. Las funcionalidades pueden variar según el plan contratado.' },
      { h: '3. Responsabilidades del club', p: 'El club es responsable de contar con la autorización de sus socios para el tratamiento de sus datos, y de la veracidad de la información que carga.' },
      { h: '4. Uso del número de WhatsApp', p: 'El servicio opera sobre los números de WhatsApp provistos por el operador (modelo de chip central) o, en el plan Pro, sobre un número dedicado entregado a pedido. El club no debe usarlos para fines distintos a la operación del servicio.' },
      { h: '5. Pagos y facturación', p: 'Los planes se pagan mensualmente mediante MercadoPago. El pago inicial habilita el dashboard y la activación del agente para el club. Los precios vigentes se publican en la página de planes.' },
      { h: '6. Limitación de responsabilidad', p: 'CanchaLlena se esfuerza por un servicio continuo, pero no garantiza la disponibilidad de WhatsApp ni la ocupación de canchas. La plataforma no es responsable por fallos de terceros (WhatsApp, MercadoPago) o por decisiones del club.' },
      { h: '7. Modificaciones', p: 'CanchaLlena puede actualizar estos términos para reflejar mejoras. Se notificará a los clubes con la debida antelación antes de que los cambios afecten el servicio.' },
    ],
  },
  datos: {
    titulo: 'Protección de Datos y Confidencialidad',
    secciones: [
      { h: '1. Base legal', p: 'El tratamiento de datos personales se realiza conforme a la Ley 19.628 de Chile y, cuando corresponda, al RGPD para titulares en la Unión Europea. La base legal es el contrato de servicio y el consentimiento.' },
      { h: '2. Minimización', p: 'Recogemos únicamente los datos necesarios para operar el servicio y los mantenemos actualizados. Los socios pueden solicitar que se eliminen sus datos tras dejar de participar en el club.' },
      { h: '3. Transferencia y terceros', p: 'No transferimos datos personales a terceros para fines comerciales. Los proveedores técnicos (hosting, MercadoPago, WhatsApp) que intervienen tratan datos bajo las garantías de contratos y normativas aplicables.' },
      { h: '4. Seguridad técnica', p: 'Aplicamos medidas de protección como cifrado, control de acceso por roles y supervisión de actividad para proteger la confidencialidad, integridad y disponibilidad de los datos.' },
      { h: '5. Notificación de incidentes', p: 'En caso de una brecha de seguridad que afecte los datos, notificaremos al club afectado y, cuando la ley lo exija, a la autoridad de protección de datos correspondiente.' },
    ],
  },
};

export function PaginaLegal({ page, onNavigate }: { page: LegalPage; onNavigate: (r: string) => void }) {
  const c = contenidos[page];
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#101014] flex flex-col font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a CanchaLlena
        </button>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101014]">{c.titulo}</h1>
        <p className="text-sm text-[#62626A]">Última actualización: 06 de septiembre de 2026</p>
        <div className="space-y-6">
          {c.secciones.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold text-[#101014] mb-1.5">{s.h}</h2>
              <p className="text-sm text-[#62626A] leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
