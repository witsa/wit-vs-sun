
const express = require('express');
const router = express.Router();

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log('Time: ', Date.now());
  next();
});

router.get('/runners', function (req, res) {
  res.json(router.dbs.runners.get('runners').value());
});

router.get('/runners/add', function (req, res) {
  var runner = router.dbs.runners.get('runners').insert({ name: req.query.name }).write();
  router.wss.clients.forEach(ws => ws.send(JSON.stringify({ type: 'runners/add', data: runner})));
  res.json(runner);
});

router.get('/about', function (req, res) {
  res.send('<ul><li>api/runners</li><li>api/runners/add</li></ul>');
});

router.get('/db/download', (req, res) => {
  res.download(`./db/${req.query.fileName}.json`);
});

module.exports = router;