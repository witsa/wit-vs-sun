
const express = require('express');
const router = express.Router();
const redy = require('./redy');

var sendError = (res, error) => {
  res.status(error.code || 500).json(error);
};

router.use((req, res, next) => {
  console.log('Time: ', Date.now());
  next();
});

router.get('/runners', function (req, res) {
  res.json(router.db.getRunners());
});

router.get('/runners/add', function (req, res) {
  var runner = router.db.insertRunner(req.query.name);
  router.messageServe.broadcast('runners:add', runner);
  res.json(runner);
});

router.get('/runs/start', function (req, res) {
  router.running.start({ runnerId: req.query.runnerId, bikeName: req.query.bikeName }).then(
    run => {
      res.json(run);
    },
    error => {
      sendError(res, error);
    }
  );
});

router.get('/runs/stop', function (req, res) {
  router.running.stop(req.query.bikeName).then(
    run => {
      res.json(run);
    },
    error => {
      sendError(res, error);
    }
  );
});

router.get('/bikeA', function (req, res) {
  var response = {
    bike: router.db.getBike('A')
  }

  if (response.bike.runId) {
    response.run = router.db.getRun(response.bike.runId);
    response.runner = router.db.getRunner(response.run.runnerId);
  }

  res.json(response);
});

router.get('/bikeB', function (req, res) {
  var response = {
    bike: router.db.getBike('B')
  }

  if (response.bike.runId) {
    response.run = router.db.getRun(response.bike.runId);
    response.runner = router.db.getRunner(response.run.runnerId);
  }

  res.json(response);
});

router.get('/about', function (req, res) {
  res.send('<ul><li>api/runners</li><li>api/runners/add</li></ul>');
});

router.get('/redy/a', function (req, res) {
  redy.getA().then(data => res.json(data));
});

router.get('/redy/b', function (req, res) {
  redy.getB().then(data => res.json(data));
});

router.get('/redy/sun', function (req, res) {
  redy.getSun().then(data => res.json(data));
});

router.get('/db/download', (req, res) => {
  res.download(`./db/${req.query.fileName}.json`);
});

module.exports = router;