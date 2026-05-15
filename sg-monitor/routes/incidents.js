const express = require('express');
const { listRecentIncidents } = require('../database/incidentsRepository');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const data = await listRecentIncidents(limit);
    return res.json({ incidents: data });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
