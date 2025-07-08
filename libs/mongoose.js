import mongoose from 'mongoose';

// Codificar la contraseña
const PASSWORD = encodeURIComponent("9OGls52Av34gdlBb");
const MONGO_URI = `mongodb+srv://fluviapp2025:${PASSWORD}@fluvidata.um4u4vq.mongodb.net/fluvidata?retryWrites=true&w=majority&appName=FluviData`;

// Importante: especifica el nombre de la base después de `.net/fluvidata`

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conectado a MongoDB (FluviData)');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectMongoDB;
