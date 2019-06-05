const redy = require('./redy');
const moment = require('moment');
const { hash, Promise } = require('rsvp');

class Running {

  constructor(db, messageServe) {
    this.db = db;
    this.messageServe = messageServe;
    this.intervales = {
      A: null,
      B: null
    };

    if (this.bikeA.runId) {
      this.startInterval('A');
    }

    if (this.bikeB.runId) {
      this.startInterval('B');
    }

    this.delay = 3000;
  }

  get bikeA() {
    return this.db.getBike('A');
  }

  get bikeB() {
    return this.db.getBike('B');
  }

  getBike(bikeName) {
    return bikeName === 'A' ? this.bikeA : this.bikeB;
  }

  createError(code, origin, message) {
    return { code: code, origin: origin || 'unknow', message: message };
  }

  sendErrorMessage(code, origin, message) {
    this.messageServe.broadcast('error:origin', this.createError(code, origin, message));
  }

  removeRunFromBike(bike) {
    bike.power = 0;
    bike.runId = null;
    bike = this.db.updateBike(bike);
    return bike;
  }

  start({ runnerId, bikeName }) {
    return new Promise((resolve, reject) => {
      console.log('Strating a run...');
      if (!runnerId) {
        console.log('aborted');
        reject(this.createError(400, 'running:start', 'runnerId is required'));
        return;
      }

      var runner = this.db.getRunner(runnerId);
      if (!runner) {
        console.log('aborted');
        reject(this.createError(404, 'running:start', `runner (${runnerId}) is not found`));
        return;
      }

      if (!bikeName) {
        console.log('aborted');
        reject(this.createError(400, 'running:start', 'bikeName is required'));
        return;
      }

      if (!['A', 'B'].includes(bikeName)) {
        console.log('aborted');
        reject(this.createError(400, 'running:start', 'bikeName is invalid (A or B expected)'));
        return;
      }

      var bike = this.getBike(bikeName);
      console.log('bike:', bike);
      if (bike && bike.runId) {
        console.log('aborted');
        reject(this.createError(500, 'running:start', 'Bike is in used'));
        return;
      }

      var run = {
        bikeName: bikeName,
        start: null,
        stop: null,
        runnerId: runnerId,
        startEnergy: 0,
        stopEnergy: null,
        energy: 0,
        bestPower: 0,
        avgPower: 0,
        sunStartEnergy: 0,
        sunStopEnergy: null,
        sunBestPower: 0,
        runnerStartEnergy: runner.energy,
        runnerStartDuration: runner.duration,
        powers: []
      };

      hash({
        bike: redy[`get${run.bikeName}`](),
        sun: redy.getSun()
      }).then(data => {
        run.start = new Date();
        run.startEnergy = data.bike.energy;
        run.bestPower = data.bike.power;
        run.avgPower = data.bike.power;
        run.sunBestPower = data.sun.power;
        run.sunStartEnergy = data.sun.energy;

        // ajoute run à la liste
        run = this.db.insertRun(run);
        console.log('run:', run);

        runner.runsCount++;
        this.syncRunner(runner, run);
        runner = this.db.updateRunner(runner);

        // place run dans bike[A/B]
        bike.power = data.bike.power;
        bike.runId = run.id;
        bike = this.db.updateBike(bike);

        // démarre la récupération des données du bike
        this.db.writeAll();

        // broadcast run:start
        this.messageServe.broadcast('run:start', { bike: bike, run: run, runner: runner });

        this.startInterval(bikeName);

        resolve({ bike: bike, run: run, runner: runner });
      }, error => {
        reject(this.createError(500, 'api/runs/start', 'An error occured during start run.'));
      });
    });
  }

  stop(bikeName) {
    return new Promise((resolve, reject) => {
      console.log('Stoping run...');

      if (!bikeName) {
        console.log('aborted');
        reject(this.createError(400, 'running:stop', 'bikeName is required'));
        return;
      }

      if (!['A', 'B'].includes(bikeName)) {
        console.log('aborted');
        reject(this.createError(400, 'running:stop', 'bikeName is invalid (A or B expected)'));
        return;
      }

      var bike = this.getBike(bikeName);
      console.log('bike:', bike);
      if (bike && !bike.runId) {
        console.log('aborted');
        reject(this.createError(500, 'running:stop', 'Bike is not in used'));
        return;
      }

      var run = this.db.getRun(bike.runId);
      if (!run) {
        console.log('aborted');
        reject(this.createError(404, 'running:stop', `run (${bike.runId}) is not found`));
        this.removeRunFromBike(bike);
        this.db.writeAll();
        return;
      }

      var runner = this.db.getRunner(run.runnerId);
      if (!runner) {
        console.log('aborted');
        reject(this.createError(404, 'running:stop', `runner (${run.runnerId}) is not found`));
        this.removeRunFromBike(bike);
        this.db.writeAll();
        return;
      }

      // arrête la récupération des données du bike
      this.stopInterval(bikeName);

      hash({
        bike: redy[`get${run.bikeName}`](),
        sun: redy.getSun()
      }).then(data => {
        run.stop = new Date();
        run.stopEnergy = data.bike.energy;
        run.energy = run.stopEnergy - run.startEnergy;
        run.avgPower = run.energy / (run.stop - run.start) * this.delay;
        run.bestPower = Math.max(run.bestPower, data.bike.power);
        run.sunBestPower = Math.max(run.sunBestPower, data.sun.power);
        run.sunStopEnergy = data.sun.energy;

        // update run
        run = this.db.updateRun(run);
        console.log('run:', run);

        bike = this.removeRunFromBike(bike);

        this.syncRunner(runner, run);
        runner = this.db.updateRunner(runner);

        this.db.writeAll();

        // broadcast run:stop
        this.messageServe.broadcast('run:stop', { bike: bike, run: run, runner: runner });

        resolve({ bike: bike, run: run, runner: runner });
      }, error => {
        reject(this.createError(500, 'running:stop', 'An error occured during stop run.'));
      });

    });
  }

  syncRunner(runner, run) {
    runner.bestPower = Math.max(run.bestPower, runner.bestPower);
    runner.duration = run.runnerStartDuration +  (run.stop ? moment(run.stop) : moment()) - moment(run.start);
    runner.energy = run.runnerStartEnergy + run.energy;
  }

  startInterval(bikeName) {
    if (this.intervales[bikeName]) {
      this.stopInterval(bikeName);
    }

    this.intervales[bikeName] = setInterval(this[`syncBike${bikeName}`].bind(this), this.delay);
  }

  stopInterval(bikeName) {
    clearInterval(this.intervales[bikeName]);
    this.intervales[bikeName] = null;
  }

  syncBike(bikeName) {
    var bike = this.getBike(bikeName);
    if (!bike.runId) {
      this.stopInterval(bikeName);
      return;
    }

    var run = this.db.getRun(bike.runId);
    if (!run) {
      this.stopInterval(bikeName);
      this.sendErrorMessage(404, `running:syncBike${bikeName}`, `run (${bike.runId}) is not found`);
      this.removeRunFromBike(bike);
      this.db.writeAll();
      return;
    }

    var runner = this.db.getRunner(run.runnerId);
    if (!runner) {
      this.sendErrorMessage(404, `running:syncBike${bikeName}`, `runner (${run.runnerId}) is not found`);
      this.removeRunFromBike(bike);
      this.db.writeAll();
      return;
    }

    redy[`get${bikeName}`]().then(
      data => {
        bike.power = data.power;

        run.energy = data.energy - run.startEnergy;
        run.bestPower = Math.max(data.power, run.bestPower);
        run.avgPower = run.energy / (new Date() - run.start) * this.delay;
        run = this.db.updateRun(run);

        this.syncRunner(runner, run);
        runner = this.db.updateRunner(runner);
        
        this.db.writeAll();

        this.messageServe.broadcast(`sync:bike${bikeName}`, {
          run: run,
          bike: bike,
          runner: runner
        })
      },
      error => {
        this.sendErrorMessage(500, `running:syncBike${bikeName}`, `error durring syncbike${bikeName}.`);
      }
    );
  }

  syncBikeA() {
    this.syncBike('A');
  }

  syncBikeB() {
    this.syncBike('B');
  }
}

module.exports = Running;