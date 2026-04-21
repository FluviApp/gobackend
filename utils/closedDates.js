import Holidays from 'date-holidays';

const hd = new Holidays('CL');

const toIsoDay = (dateLike) => {
    const d = new Date(dateLike);
    if (isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * Calcula las fechas cerradas para los próximos `days` días.
 * Combina feriados chilenos (si deliverOnHolidays=false) + blockedDates manuales.
 * Retorna array de strings 'YYYY-MM-DD' únicos y ordenados.
 */
export const computeClosedDates = ({ deliverOnHolidays = true, blockedDates = [], days = 60 } = {}) => {
    const set = new Set();

    // 1) Feriados públicos si no se atiende en feriados
    if (deliverOnHolidays === false) {
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);

        const years = new Set([now.getFullYear(), end.getFullYear()]);
        years.forEach((y) => {
            const list = hd.getHolidays(y) || [];
            list.forEach((h) => {
                if (h.type !== 'public') return;
                const hDate = new Date(h.date);
                if (hDate >= now && hDate <= end) {
                    const iso = toIsoDay(hDate);
                    if (iso) set.add(iso);
                }
            });
        });
    }

    // 2) Fechas bloqueadas manualmente
    (blockedDates || []).forEach((d) => {
        const iso = toIsoDay(d);
        if (iso) set.add(iso);
    });

    return Array.from(set).sort();
};

export default computeClosedDates;
