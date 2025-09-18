const express = require('express');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  deleteArea,
  calculateCarbonCredits,
  getMyAreas,
  uploadAreaImage
} = require('../controllers/areaController');

const router = express.Router();

router.get('/', optionalAuth, getAreas);
router.get('/my-areas', auth, getMyAreas);
router.get('/:id', auth, getAreaById);

router.use(auth);

router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);
router.post('/:id/calculate-credits', authorize('supplier'), calculateCarbonCredits);
router.post('/upload-image', authorize('supplier'), uploadAreaImage);

module.exports = router;