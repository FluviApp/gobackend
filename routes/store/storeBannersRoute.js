import express from 'express';
import StoreBannersController from '../../controllers/store/storeBannersController.js';

const router = express.Router();
const storeBannersController = new StoreBannersController();

router.get('/banners', storeBannersController.getAllBanners);
router.post('/banners', storeBannersController.createBanner);
router.put('/banners/:id', storeBannersController.updateBanner);
router.delete('/banners/:id', storeBannersController.deleteBanner);

export default router;
