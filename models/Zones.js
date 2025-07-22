// models/Zones.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const hourBlockSchema = new Schema({
    from: { type: String, required: true }, // Ej: '07:00'
    to: { type: String, required: true },   // Ej: '08:00'
    active: { type: Boolean, default: false },
}, { _id: false });

const dailyScheduleSchema = new Schema({
    enabled: { type: Boolean, default: false },
    hours: {
        type: Map,
        of: Boolean, // clave = '07:00', valor = true/false
        default: {}
    }
}, { _id: false });

const scheduleSchema = new Schema({
    monday: { type: dailyScheduleSchema, default: () => ({}) },
    tuesday: { type: dailyScheduleSchema, default: () => ({}) },
    wednesday: { type: dailyScheduleSchema, default: () => ({}) },
    thursday: { type: dailyScheduleSchema, default: () => ({}) },
    friday: { type: dailyScheduleSchema, default: () => ({}) },
    saturday: { type: dailyScheduleSchema, default: () => ({}) },
    sunday: { type: dailyScheduleSchema, default: () => ({}) },
}, { _id: false });

const zoneSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['comuna', 'area'],
            required: true,
        },
        comuna: {
            type: String,
            trim: true,
        },
        deliveryCost: {
            type: Number,
            required: true,
            min: 0
        },
        polygon: [
            {
                lat: Number,
                lng: Number,
            },
        ],
        storeId: {
            type: String,
            required: true,
        },
        dealerId: {
            type: String,
            default: '',
        },

        schedule: {
            type: scheduleSchema,
            default: () => ({}),
        }
    },
    { timestamps: true }
);

zoneSchema.plugin(mongoosePaginate);

const Zones = mongoose.model('Zone', zoneSchema);
export default Zones;
