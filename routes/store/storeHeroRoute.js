import express from 'express';
import StoreHeroController from '../../controllers/store/storeHeroController.js';

const router = express.Router();
const storeHeroController = new StoreHeroController();

// GET - Obtener la config del hero de la tienda
router.get('/hero', storeHeroController.getHero);

// PUT - Guardar (upsert) la config del hero
router.put('/hero', storeHeroController.saveHero);

export default router;
