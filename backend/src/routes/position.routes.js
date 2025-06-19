const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');

router.get('/', positionController.getAllPositions);
router.get('/next-code', positionController.getNextPositionCode);
router.get('/:id', positionController.getPosition);
router.post('/', positionController.createPosition);
router.put('/:id', positionController.updatePosition);
router.delete('/:id', positionController.deletePosition);

module.exports = router; 