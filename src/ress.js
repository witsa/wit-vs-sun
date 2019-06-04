const { ApiConfiguration, ApiClientWithOAuth, WosApi, NodFieldsEnum } = require('openredy-sdk');

var device = {
  url: 'http://redy-demo.westeurope.cloudapp.azure.com',
  user: 'admin',
  password: '.'
}

let configuration = new ApiConfiguration(device.url, { user: device.user, password: device.password });
let client = new ApiClientWithOAuth(configuration);
let service = new WosApi(client);

module.exports = {
  test(callback) {
    return service.get(':easy.RESS.R00005.R00002.Value', 1, [NodFieldsEnum.Value]).then(nod => {
      callback(nod.value);
    });
  }
};
