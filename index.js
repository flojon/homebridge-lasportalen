const axios = require('axios');

const PLATFORM_NAME = 'LasPortalen';
const PLUGIN_NAME = 'homebridge-lasportalen';
const BASE_URL = 'https://api.digitallassmed.se';

module.exports = (api) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, LasPortalenPlatform);
};

class LasPortalenPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessories = [];
    this.token = config.token || null;
    this.tokenExpires = null;

    this.api.on('didFinishLaunching', async () => {
      await this.ensureToken();
      this.discoverLocks();
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  async ensureToken() {
    const { email, password } = this.config;
    if (!email || !password) return; // fall back to static token from config

    const expired = this.tokenExpires && Date.now() >= this.tokenExpires - 60000;
    if (this.token && !expired) return;

    try {
      this.log.info('Logging in to Låsportalen...');
      const { data } = await axios.post(`${BASE_URL}/v1/auth`, { email, password });
      this.token = data.token;
      // expires is Unix seconds; convert to ms for Date.now() comparison
      this.tokenExpires = data.expires * 1000;
      this.log.info('Login successful, token expires:', new Date(this.tokenExpires).toISOString());
    } catch (err) {
      this.log.error('Login failed:', err.response?.data || err.message);
    }
  }

  async request(method, path, opts = {}) {
    await this.ensureToken();
    try {
      return await axios({ method, url: `${BASE_URL}${path}`, ...opts, headers: { Authorization: `Bearer ${this.token}`, ...opts.headers } });
    } catch (err) {
      if (err.response?.status === 401) {
        this.token = null; // force re-login
        await this.ensureToken();
        return axios({ method, url: `${BASE_URL}${path}`, ...opts, headers: { Authorization: `Bearer ${this.token}`, ...opts.headers } });
      }
      throw err;
    }
  }

  async discoverLocks() {
    const { organisationId } = this.config;

    try {
      const { data: locks } = await this.request('get', `/v1/organisations/${organisationId}/locks`, {
        params: { accessible: true, orderBy: 'name', order: 'asc' },
      });

      for (const lock of locks) {
        const uuid = this.api.hap.uuid.generate(`lasportalen-${lock.id}`);
        const existing = this.accessories.find(a => a.UUID === uuid);

        if (existing) {
          this.log.info('Restoring cached accessory:', lock.name);
          new LasPortalenLock(this, existing, lock);
        } else {
          this.log.info('Adding new accessory:', lock.name);
          const accessory = new this.api.platformAccessory(lock.name, uuid);
          new LasPortalenLock(this, accessory, lock);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    } catch (err) {
      this.log.error('Failed to discover locks:', err.message);
    }
  }
}

class LasPortalenLock {
  constructor(platform, accessory, lock) {
    this.platform = platform;
    this.accessory = accessory;
    this.lock = lock;

    const { Service, Characteristic } = platform.api.hap;

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, 'Digital Låssmed')
      .setCharacteristic(Characteristic.Model, 'KEE Lock')
      .setCharacteristic(Characteristic.SerialNumber, String(lock.id));

    this.service = accessory.getService(Service.LockMechanism)
      || accessory.addService(Service.LockMechanism);

    this.service.getCharacteristic(Characteristic.LockCurrentState)
      .onGet(() => Characteristic.LockCurrentState.SECURED);

    this.service.getCharacteristic(Characteristic.LockTargetState)
      .onGet(() => Characteristic.LockTargetState.SECURED)
      .onSet(this.handleUnlock.bind(this));
  }

  async handleUnlock(value) {
    const { Characteristic, HAPStatus, HapStatusError } = this.platform.api.hap;

    if (value !== Characteristic.LockTargetState.UNSECURED) return;

    const { organisationId } = this.platform.config;

    try {
      await this.platform.request(
        'put',
        `/v1/organisations/${organisationId}/locks/${this.lock.id}/action/pulse`,
        { params: { response: true } }
      );

      this.platform.log.info(`Unlocked: ${this.lock.name}`);
      this.service.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);

      setTimeout(() => {
        this.service.updateCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
        this.service.updateCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
      }, this.lock.pulseTimeMs || 8000);

    } catch (err) {
      this.platform.log.error(`Failed to unlock ${this.lock.name}:`, err.message);
      throw new HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
}
