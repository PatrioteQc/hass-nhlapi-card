# NHL Card

A custom Lovelace card for displaying NHL game information from the hass-nhlapi integration.

## Requirements

- Home Assistant 2023.4 or later
- [hass-nhlapi](https://github.com/JayBlackedOut/hass-nhlapi) custom component

## Installation

Install via HACS (Custom Repository) or manually by copying `nhl-card.js` to your `www` folder.

## Usage

```yaml
type: custom:nhl-card
entity: sensor.nhl_sensor
```
