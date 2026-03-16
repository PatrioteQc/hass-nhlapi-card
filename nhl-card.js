/**
 * NHL Card for Home Assistant
 * A custom Lovelace card to display NHL game information
 * Requires the hass-nhlapi custom component
 * 
 * Version: 1.0.0
 */

class NHLCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._entity = null;
  }

  static getConfigElement() {
    return document.createElement('nhl-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'sensor.nhl_sensor',
      show_team_logos: true,
      show_last_goal: true,
      show_game_info: true,
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._entity = hass.states[this._config.entity];
    this.render();
  }

  render() {
    if (!this._entity) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content" style="padding: 16px;">
            Entity ${this._config.entity} not found.
          </div>
        </ha-card>
      `;
      return;
    }

    const attrs = this._entity.attributes;
    const state = this._entity.state;

    const awayName = attrs.away_name || 'Away';
    const homeName = attrs.home_name || 'Home';
    const awayScore = attrs.away_score !== undefined ? attrs.away_score : '-';
    const homeScore = attrs.home_score !== undefined ? attrs.home_score : '-';
    const awayLogo = attrs.away_logo || '';
    const homeLogo = attrs.home_logo || '';
    const awayRecord = attrs.away_record || '';
    const homeRecord = attrs.home_record || '';
    const awaySog = attrs.away_sog !== undefined ? attrs.away_sog : 0;
    const homeSog = attrs.home_sog !== undefined ? attrs.home_sog : 0;

    const currentPeriod = attrs.current_period || '';
    const timeRemaining = attrs.time_remaining || '';
    const isIntermission = attrs.is_intermission || false;
    const periodType = attrs.current_period_type || 'REG';

    const scoringPlayer = attrs.scoring_player_name || '';
    const scoringPlayerNumber = attrs.scoring_player_number || '';
    const assist1Player = attrs.assist1_player_name || '';
    const assist2Player = attrs.assist2_player_name || '';
    const goalType = attrs.goal_type || '';

    const nextGameDate = attrs.next_game_date || '';
    const nextGameTime = attrs.next_game_time || '';
    const nextGameDateTime = attrs.next_game_datetime || null;

    // Format next game for display (use HA's date format if available)
    let formattedNextGame = '';
    if (nextGameDateTime) {
      // Use Home Assistant's format_date if available, otherwise fallback
      const dateObj = new Date(nextGameDateTime);
      if (!isNaN(dateObj.getTime())) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        formattedNextGame = dateObj.toLocaleDateString(undefined, options);
      } else {
        formattedNextGame = nextGameDate;
      }
    } else if (nextGameDate) {
      formattedNextGame = nextGameDate;
    }

    // Game state detection - based on hass-nhlapi sensor.py logic
    // game_state attribute contains: FUT, PRE, LIVE, CRIT, OVER, FINAL, OFF
    const gameState = attrs.game_state || 'FUT';  // Default to future if not set
    
    const isFuture = gameState === 'FUT';
    const isPregame = gameState === 'PRE';
    const isLive = gameState === 'LIVE' || gameState === 'CRIT';
    const isFinal = gameState === 'FINAL' || gameState === 'OFF' || gameState === 'OVER';
    const isNoGame = !attrs.away_name && !attrs.home_name;

    let periodDisplay = '';
    if (isLive) {
      periodDisplay = isIntermission ? 'INT' : `${currentPeriod} ${timeRemaining}`;
    } else if (isFinal) {
      periodDisplay = 'FINAL';
    } else if (isPregame) {
      periodDisplay = 'PRE';
    }

    this.innerHTML = `
      <ha-card>
        <style>
          .nhl-card {
            padding: 16px;
            font-family: var(--ha-card-font-family, inherit);
          }
          .game-header {
            text-align: center;
            margin-bottom: 12px;
            font-size: 14px;
            color: var(--secondary-text-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .game-header.live {
            color: var(--error-color, #f44336);
            font-weight: bold;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .scoreboard {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .team {
            flex: 1;
            text-align: center;
          }
          .team-logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 8px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          .team-logo.away {
            background-image: url('${awayLogo}');
          }
          .team-logo.home {
            background-image: url('${homeLogo}');
          }
          .team-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .team-record {
            font-size: 12px;
            color: var(--secondary-text-color);
          }
          .team-sog {
            font-size: 11px;
            color: var(--secondary-text-color);
            margin-top: 4px;
          }
          .score-section {
            text-align: center;
            padding: 0 16px;
          }
          .score {
            font-size: 42px;
            font-weight: bold;
            line-height: 1;
            margin-bottom: 8px;
          }
          .score-divider {
            font-size: 24px;
            color: var(--secondary-text-color);
          }
          .period-info {
            font-size: 14px;
            color: var(--secondary-text-color);
            text-transform: uppercase;
          }
          .goal-info {
            background: var(--secondary-background-color, rgba(0,0,0,0.05));
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
          }
          .goal-header {
            font-size: 12px;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .goal-icon {
            font-size: 16px;
          }
          .scorer {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .scorer .number {
            color: var(--secondary-text-color);
            font-weight: normal;
            margin-right: 4px;
          }
          .assists {
            font-size: 13px;
            color: var(--secondary-text-color);
          }
          .goal-type {
            display: inline-block;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--primary-color);
            color: white;
            margin-left: 8px;
          }
          .pregame-info {
            text-align: center;
            padding: 16px;
          }
          .pregame-info .next-game {
            font-size: 18px;
            margin-bottom: 8px;
          }
          .pregame-info .next-game-date {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .pregame-info .next-game-time {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 12px;
          }
          .pregame-info .matchup {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .pregame-info .records {
            font-size: 13px;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
          }
          .pregame-info .broadcasts {
            font-size: 13px;
            color: var(--secondary-text-color);
          }
          .no-game {
            text-align: center;
            padding: 24px;
            color: var(--secondary-text-color);
          }
        </style>

        <div class="nhl-card">
          ${this._renderGameHeader(gameState, periodDisplay, periodType)}
          
          ${isNoGame ? `
            <div class="no-game">
              <div style="font-size: 48px; margin-bottom: 12px;">🏒</div>
              No Game Scheduled
            </div>
          ` : isFuture ? `
            <div class="pregame-info">
              <div class="next-game-date">${formattedNextGame || state}</div>
              ${nextGameTime ? `<div class="next-game-time">${nextGameTime}</div>` : ''}
              <div class="matchup">${awayName} @ ${homeName}</div>
              ${awayRecord || homeRecord ? `<div class="records">${awayRecord || ''} vs ${homeRecord || ''}</div>` : ''}
              ${attrs.national_broadcasts ? `
                <div class="broadcasts">
                  ${Array.isArray(attrs.national_broadcasts) ? attrs.national_broadcasts.join(', ') : attrs.national_broadcasts}
                </div>
              ` : ''}
            </div>
          ` : isPregame ? `
            <div class="pregame-info">
              <div class="next-game">PREGAME</div>
              <div class="matchup">${awayName} @ ${homeName}</div>
              ${awayRecord || homeRecord ? `<div class="records">${awayRecord || ''} vs ${homeRecord || ''}</div>` : ''}
              ${attrs.national_broadcasts ? `
                <div class="broadcasts">
                  ${Array.isArray(attrs.national_broadcasts) ? attrs.national_broadcasts.join(', ') : attrs.national_broadcasts}
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="scoreboard">
              <div class="team away">
                ${this._config.show_team_logos !== false && awayLogo ? `
                  <div class="team-logo away"></div>
                ` : ''}
                <div class="team-name">${awayName}</div>
                ${awayRecord ? `<div class="team-record">${awayRecord}</div>` : ''}
                ${isLive || isFinal ? `<div class="team-sog">${awaySog} SOG</div>` : ''}
              </div>
              
              <div class="score-section">
                <div class="score">
                  <span class="away-score">${awayScore}</span>
                  <span class="score-divider"> - </span>
                  <span class="home-score">${homeScore}</span>
                </div>
                <div class="period-info">${periodDisplay}${periodType !== 'REG' && isFinal ? ` ${periodType}` : ''}</div>
              </div>
              
              <div class="team home">
                ${this._config.show_team_logos !== false && homeLogo ? `
                  <div class="team-logo home"></div>
                ` : ''}
                <div class="team-name">${homeName}</div>
                ${homeRecord ? `<div class="team-record">${homeRecord}</div>` : ''}
                ${isLive || isFinal ? `<div class="team-sog">${homeSog} SOG</div>` : ''}
              </div>
            </div>

            ${this._config.show_last_goal !== false && scoringPlayer && isLive ? `
              <div class="goal-info">
                <div class="goal-header">
                  <span class="goal-icon">🏒</span>
                  <span>Last Goal</span>
                  ${goalType && goalType !== 'EVEN' ? `<span class="goal-type">${goalType}</span>` : ''}
                </div>
                <div class="scorer">
                  ${scoringPlayerNumber ? `<span class="number">#${scoringPlayerNumber}</span>` : ''}
                  ${scoringPlayer}
                </div>
                ${assist1Player ? `
                  <div class="assists">
                    Assists: ${assist1Player}${assist2Player ? `, ${assist2Player}` : ''}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          `}
        </div>
      </ha-card>
    `;
  }

  _renderGameHeader(gameState, periodDisplay, periodType) {
    let headerText = '';
    let cssClass = '';

    if (gameState === 'LIVE') {
      headerText = '🔴 LIVE';
      cssClass = 'live';
    } else if (gameState === 'CRIT') {
      headerText = '🔴 CRITICAL';
      cssClass = 'live';
    } else if (gameState === 'FINAL' || gameState === 'OFF') {
      headerText = periodType !== 'REG' ? `FINAL/${periodType}` : 'FINAL';
    } else if (gameState === 'PRE') {
      headerText = 'PREGAME';
    } else if (gameState === 'OVER') {
      headerText = 'GAME OVER';
    }

    return headerText ? `
      <div class="game-header ${cssClass}">
        ${headerText}
      </div>
    ` : '';
  }

  getCardSize() {
    return 4;
  }
}

customElements.define('nhl-card', NHLCard);

// Add to window for Lovelace to find
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'nhl-card',
  name: 'NHL Card',
  description: 'A card to display NHL game information from hass-nhlapi',
  preview: true,
});
