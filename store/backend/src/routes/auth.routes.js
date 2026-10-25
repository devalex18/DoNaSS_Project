const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Módulo de auth pendiente de implementación por el equipo' });
});

module.exports = router;