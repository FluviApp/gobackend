// utils/deliveryTime.js
// Helper único para el horario de entrega. El formato oficial es un RANGO
// "HH:MM - HH:MM" (24h, con espacios) para bloques cortos Y grandes.
// Estas funciones son retrocompatibles con los formatos antiguos que aún
// existen en datos guardados:
//   - "07:00"            (hora suelta 24h, grilla de zonas antigua)
//   - "12:00 AM" / "3:00 PM" (12h AM/PM, ingreso manual antiguo)
//   - "09:00 - 11:00"    (rango, POS y formato oficial nuevo)

// Parsea una hora suelta ("07:00", "12:00 AM", "3:00 pm") a { h, m } en 24h.
// Devuelve null si no logra parsear.
export const parseSingleHour = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    const ampm = (s.match(/(am|pm)/i) || [])[0];
    if (ampm) {
        const isPM = ampm.toLowerCase() === 'pm';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
    }
    return { h: h % 24, m: min };
};

const pad = (n) => String(n).padStart(2, '0');
const toHHmm = ({ h, m }) => `${pad(h)}:${pad(m)}`;

// Devuelve la hora de INICIO en "HH:MM" (24h) de cualquier formato, o null.
// "09:00 - 11:00" -> "09:00" ; "07:00" -> "07:00" ; "12:00 AM" -> "00:00".
export const startOfHour = (raw) => {
    if (raw == null || String(raw).trim() === '') return null;
    const first = String(raw).split('-')[0];
    const parsed = parseSingleHour(first);
    return parsed ? toHHmm(parsed) : null;
};

// Devuelve la hora de inicio como número entero (para ordenar), o `fallback`
// (por defecto 99, para mandar "sin horario" al final).
export const startHourNumber = (raw, fallback = 99) => {
    const start = startOfHour(raw);
    if (!start) return fallback;
    return parseInt(start.split(':')[0], 10);
};

// Normaliza cualquier formato al rango canónico "HH:MM - HH:MM".
// Una hora suelta se convierte en un bloque de 1 hora (07:00 -> "07:00 - 08:00").
// Devuelve null si no hay horario (para modo sin_horario).
export const normalizeHourBlock = (raw) => {
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (s.includes('-')) {
        const [a, b] = s.split('-').map((x) => x.trim());
        const start = parseSingleHour(a);
        const end = parseSingleHour(b);
        if (!start) return null;
        if (!end) return `${toHHmm(start)} - ${toHHmm({ h: (start.h + 1) % 24, m: start.m })}`;
        return `${toHHmm(start)} - ${toHHmm(end)}`;
    }
    const start = parseSingleHour(s);
    if (!start) return null;
    return `${toHHmm(start)} - ${toHHmm({ h: (start.h + 1) % 24, m: start.m })}`;
};

export default { parseSingleHour, startOfHour, startHourNumber, normalizeHourBlock };
