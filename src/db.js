const low = require("lowdb");
const lodashId = require('lodash-id')
const FileSync = require("lowdb/adapters/FileSync");

class DB {

  constructor() {
    this.runners = low(new FileSync('db/runners.json'));
    this.runs = low(new FileSync('db/runs.json'));
    this.bikes = low(new FileSync('db/bikes.json'));

    this.runners._.mixin(lodashId);
    this.runs._.mixin(lodashId);
    this.bikes._.mixin(lodashId);

    // Set some defaults
    this.runners.defaults([])
      .write();
    this.runs.defaults( [])
      .write();
    this.bikes.defaults({
      A: {
        name: 'A',
        runId: null,
        "power": 0
      },
      B: {
        name: 'B',
        runId: null,
        "power": 0
      }
    })
      .write();
  }

  insertRunner(name) {
    return this.runners.insert({ name: name, runsCount: 0, energy: 0, bestPower: null, duration: 0 }).write();
  }

  insertRun(run) {
    return this.runs.insert(run).value();
  }

  getRunners() {
    return this.runners.value();
  }

  getRunner(runnerId) {
    return this.runners.getById(runnerId).value();
  }

  getRun(runId) {
    return this.runs.getById(runId).value();
  }

  updateRun(run) {
    return this.runs.getById(run.id).assign(run).value();
  }

  updateRunner(runner) {
    return this.runners.getById(runner.id).assign(runner).value();
  }

  getBike(bikeName) {
    return this.bikes.value()[bikeName];
  }

  updateBike(bike) {
    return this.bikes.get(`${bike.name}.runId`).getById(bike.id).assign(bike).value();
  }

  writeAll() {
    this.runners.write();
    this.runs.write();
    this.bikes.write();
  }
}

module.exports = DB;