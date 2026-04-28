# homebridge-lasportalen

[![npm](https://img.shields.io/npm/v/homebridge-lasportalen)](https://www.npmjs.com/package/homebridge-lasportalen)
[![npm](https://img.shields.io/npm/dt/homebridge-lasportalen)](https://www.npmjs.com/package/homebridge-lasportalen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Homebridge plugin for [Digital Låssmed](https://digitallassmed.se) Låsportalen. Exposes your accessible locks as HomeKit `LockMechanism` accessories.

## Features

- Auto-discovers all locks you have access to via the Låsportalen API
- Authenticates with email/password and handles token refresh automatically
- Pulse-based unlocking — door reports as unlocked for the pulse duration, then relocks

## Installation

```bash
npm install -g homebridge homebridge-lasportalen
```

## Configuration

Add the platform to `~/.homebridge/config.json`:

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "platforms": [
    {
      "platform": "LasPortalen",
      "name": "Låsportalen",
      "email": "your@email.com",
      "password": "yourpassword",
      "organisationId": 16
    }
  ]
}
```

| Field | Description |
|---|---|
| `email` | Your Låsportalen login email |
| `password` | Your Låsportalen password |
| `organisationId` | Your BRF/organisation ID |

## Raspberry Pi

Recommended setup for always-on use.

```bash
# Install Node.js, Homebridge and the plugin
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g homebridge homebridge-lasportalen

# Create your config at ~/.homebridge/config.json (see above)

# Install and enable the systemd service
curl -O https://raw.githubusercontent.com/flojon/homebridge-lasportalen/main/homebridge.service
sudo cp homebridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable homebridge
sudo systemctl start homebridge
```

Check logs with:

```bash
sudo journalctl -u homebridge -f
```

> **Note:** The service file assumes the default `pi` user. Adjust `User=` in the service file if needed.

## Disclaimer

This plugin uses the **unofficial, undocumented** Låsportalen REST API. It is not affiliated with or endorsed by Digital Låssmed. The API may change without notice and break this plugin at any time.

## API

The plugin uses the private Låsportalen REST API at `api.digitallassmed.se`:

- `POST /v1/auth` — login, returns JWT
- `GET /v1/organisations/{id}/locks?accessible=true` — discover locks
- `PUT /v1/organisations/{id}/locks/{lockId}/action/pulse?response=true` — open lock
