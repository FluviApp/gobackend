// src/services/client/ClientDiscountCodesService.js
import mongoose from 'mongoose';
import connectMongoDB from '../../libs/mongoose.js';
import DiscountCodes from '../../models/DiscountCodes.js';
import DiscountCodeUsages from '../../models/DiscountCodeUsages.js';

const MIN_CURRENCY_UNIT = 0.01;

export const calculateDiscountAmount = (code, subtotal) => {
    const base = Number(subtotal) || 0;
    if (!code || base <= 0) return 0;
    const value = Number(code.value) || 0;
    if (value <= 0) return 0;
    const raw = code.type === 'fixed' ? value : (base * value) / 100;
    const capped = Math.min(raw, base);
    return Number(capped.toFixed(2));
};

export default class ClientDiscountCodesService {
    constructor() {
        connectMongoDB();
    }

    findActiveByCode = async ({ code, storeId }) => {
        if (!code || !storeId) return null;
        const query = {
            code: String(code).toUpperCase().trim(),
            status: true,
        };
        if (mongoose.isValidObjectId(storeId)) {
            query.storeId = storeId;
        }
        return DiscountCodes.findOne(query);
    };

    countUsagesByUser = async ({ codeId, email, userId }) => {
        if (!codeId) return 0;
        const or = [];
        if (email) or.push({ email: String(email).toLowerCase().trim() });
        if (userId && mongoose.isValidObjectId(userId)) or.push({ userId });
        if (or.length === 0) return 0;
        try {
            return await DiscountCodeUsages.countDocuments({ codeId, $or: or });
        } catch (error) {
            console.error('❌ ClientDiscountCodesService - countUsagesByUser:', error);
            return 0;
        }
    };

    validateDiscountCode = async ({ code, storeId, subtotal = 0, email = null, userId = null }) => {
        try {
            if (!code) {
                return { success: false, message: 'Código requerido' };
            }
            if (!storeId) {
                return { success: false, message: 'Tienda no especificada' };
            }

            const found = await this.findActiveByCode({ code, storeId });
            if (!found) {
                return { success: false, message: 'Código inválido o inactivo' };
            }

            if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
                return { success: false, message: 'El código ha expirado' };
            }

            if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
                return { success: false, message: 'El código alcanzó su límite de usos' };
            }

            const numericSubtotal = Number(subtotal) || 0;
            if (found.minAmount > 0 && numericSubtotal < found.minAmount) {
                return {
                    success: false,
                    message: `El código requiere un subtotal mínimo de ${found.minAmount}`,
                };
            }

            if (found.perUserLimit > 0 && (email || userId)) {
                const previousUsages = await this.countUsagesByUser({
                    codeId: found._id,
                    email,
                    userId,
                });
                if (previousUsages >= found.perUserLimit) {
                    return {
                        success: false,
                        message: found.perUserLimit === 1
                            ? 'Ya usaste este código anteriormente'
                            : `Ya usaste este código ${previousUsages} veces (máximo ${found.perUserLimit})`,
                    };
                }
            }

            const discountAmount = calculateDiscountAmount(found, numericSubtotal);
            if (discountAmount < MIN_CURRENCY_UNIT) {
                return { success: false, message: 'El descuento no aplica para este subtotal' };
            }

            return {
                success: true,
                message: 'Código válido',
                data: {
                    codeId: found._id,
                    code: found.code,
                    name: found.name,
                    type: found.type,
                    value: found.value,
                    discountAmount,
                },
            };
        } catch (error) {
            console.error('❌ ClientDiscountCodesService - validateDiscountCode:', error);
            return { success: false, message: 'Error al validar el código' };
        }
    };

    registerUsage = async ({ codeId, userId = null, email, orderId }) => {
        if (!codeId || !orderId || !email) return null;
        try {
            const usage = await DiscountCodeUsages.create({
                codeId,
                userId: userId && mongoose.isValidObjectId(userId) ? userId : null,
                email: String(email).toLowerCase().trim(),
                orderId,
            });
            await DiscountCodes.findByIdAndUpdate(
                codeId,
                { $inc: { usedCount: 1 } },
                { new: true }
            );
            return usage;
        } catch (error) {
            console.error('❌ ClientDiscountCodesService - registerUsage:', error);
            return null;
        }
    };

    incrementUsage = async (id) => {
        if (!id) return null;
        try {
            return await DiscountCodes.findByIdAndUpdate(
                id,
                { $inc: { usedCount: 1 } },
                { new: true }
            );
        } catch (error) {
            console.error('❌ ClientDiscountCodesService - incrementUsage:', error);
            return null;
        }
    };
}
