# homebridge-lasportalen

Homebridge plugin for [Digital Låssmed](https://digitallassmed.se) Låsportalen. Exposes your accessible locks as HomeKit `LockMechanism` accessories.

## Features

- Auto-discovers all locks you have access to via the Låsportalen API
- Authenticates with email/password and handles token refresh automatically
- Pulse-based unlocking — door reports as unlocked for the pulse duration, then relocks

## Installation

```bash
npm install -g homebridge
git clone https://github.com/flojon/homebridge-lasportalen
cd homebridge-lasportalen
npm install
npm link
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
| `organisationId` | Your BRF/organisation ID (found in your account JWT) |

## Running

```bash
homebridge -P /path/to/homebridge-lasportalen
```

## Raspberry Pi

Recommended setup for always-on use.

```bash
# Install Node.js and Homebridge
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g homebridge

# Clone and link the plugin
git clone https://github.com/flojon/homebridge-lasportalen
cd homebridge-lasportalen
npm install
npm link

# Create your config at ~/.homebridge/config.json (see above)

# Install and enable the systemd service
sudo cp homebridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable homebridge
sudo systemctl start homebridge
```

Check logs with:

```bash
sudo journalctl -u homebridge -f
```

> **Note:** The service file assumes the default `pi` user and that the plugin is cloned to `/home/pi/homebridge-lasportalen`. Adjust if needed.

## Disclaimer

This plugin uses the **unofficial, undocumented** Låsportalen REST API. It is not affiliated with or endorsed by Digital Låssmed. The API may change without notice and break this plugin at any time.

## API

The plugin uses the private Låsportalen REST API at `api.digitallassmed.se`:

- `POST /v1/auth` — login, returns JWT
- `GET /v1/organisations/{id}/locks?accessible=true` — discover locks
- `PUT /v1/organisations/{id}/locks/{lockId}/action/pulse?response=true` — open lock
