// Genera un código único de tienda a partir del nombre + sufijo aleatorio.
// Ej: "Agua QueRica" -> "AGUAQUERICA-7K2Q". Visible en Ajustes del panel; el
// cliente lo usa para entrar directo a esta marca en la app (por código o QR).

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para evitar confusión

export const storeCodeBase = (name = '') =>
    String(name)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12) || 'TIENDA';

const randomSuffix = (len = 4) => {
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return s;
};

// Genera un código único chequeando colisiones en la colección Stores.
export const generateUniqueStoreCode = async (name, Stores) => {
    const base = storeCodeBase(name);
    for (let attempt = 0; attempt < 25; attempt++) {
        const code = `${base}-${randomSuffix(4)}`;
        const exists = await Stores.findOne({ code }).lean();
        if (!exists) return code;
    }
    return `${base}-${Date.now().toString(36).toUpperCase()}`;
};
