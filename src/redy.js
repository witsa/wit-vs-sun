const { ApiConfiguration, ApiClientWithOAuth, WosApi, NodFieldsEnum } = require('openredy-sdk');
const {Promise , hash} = require('rsvp');
var device = {
  url: 'http://redy-demo.westeurope.cloudapp.azure.com',
  user: 'admin',
  password: '.'
}

var paths = {
  energyA: ':easy.RESS.WVS.A.R00021.Value',
  energyB: ':easy.RESS.WVS.B.R00026.Value',
  energySun: ':easy.RESS.WVS.Sun.R00027.Value',
  powerA: ':easy.RESS.WVS.A.R00019.Value',
  powerB: ':easy.RESS.WVS.B.R00024.Value',
  powerSun: ':easy.RESS.WVS.Sun.R00025.Value'
};

let configuration = new ApiConfiguration(device.url, { user: device.user, password: device.password }, { clientId: '79DF4D4B533313E7', clientSecret: '70B42D7041379369' } );
let client = new ApiClientWithOAuth(configuration);
let service = new WosApi(client);

var _get = (energyName, powerName) => {
  return new Promise((resolve, reject) => {
    hash({
      energy: service.get(paths[energyName], 1, [NodFieldsEnum.Value]),
      power: service.get(paths[powerName], 1, [NodFieldsEnum.Value])
    }).then(data => resolve({
      energy: data.energy.value,
      power: data.power.value
    }), reject);
  });
};

module.exports = {
  getA() {
    return _get('energyA', 'powerA');
  },

  getB() {
    return _get('energyB', 'powerB');
  },

  getSun() {
    return _get('energySun', 'powerSun');
  }
};
