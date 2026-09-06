const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Categories lookup (authenticated users)
router.get('/categories', verifyToken, incidentController.getCategories);

// Incident listing & creation
router.get('/', verifyToken, incidentController.listIncidents);
router.post('/', verifyToken, upload.single('evidence'), incidentController.createIncident);

// Detailed incident dossier
router.get('/:id', verifyToken, incidentController.getIncidentById);

// Analyst actions
router.put('/:id/status', verifyToken, requireRole('ANALYST', 'ADMIN'), incidentController.updateStatus);
router.put('/:id/severity', verifyToken, requireRole('ANALYST', 'ADMIN'), incidentController.updateSeverity);
router.put('/:id/assign', verifyToken, requireRole('ANALYST', 'ADMIN'), incidentController.assignIncident);
router.post('/:id/notes', verifyToken, requireRole('ANALYST', 'ADMIN'), incidentController.addNote);
router.post('/:id/evidence', verifyToken, upload.single('evidence'), incidentController.uploadEvidence);

module.exports = router;
