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

Recommended setup for always-on use. Install Node.js, clone the repo, and configure Homebridge as a systemd service:

```bash
sudo systemctl enable homebridge
sudo systemctl start homebridge
```

See the [official Homebridge Raspberry Pi guide](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Raspbian) for full instructions.

## API

The plugin uses the private Låsportalen REST API at `api.digitallassmed.se`:

- `POST /v1/auth` — login, returns JWT
- `GET /v1/organisations/{id}/locks?accessible=true` — discover locks
- `PUT /v1/organisations/{id}/locks/{lockId}/action/pulse?response=true` — open lock
