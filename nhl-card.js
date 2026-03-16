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

  _t(lang, key) {
    const translations = {
      en: {
        nextGame: 'Next Game',
        pregame: 'Pregame',
        noGame: 'No Game Scheduled',
        live: 'LIVE',
        critical: 'CRITICAL',
        final: 'FINAL',
        lastGoal: 'Last Goal',
        assists: 'Assists',
        sog: 'SOG'
      },
      fr: {
        nextGame: 'Prochain Match',
        pregame: 'Avant-match',
        noGame: 'Aucun match prévu',
        live: 'EN DIRECT',
        critical: 'CRITIQUE',
        final: 'FINAL',
        lastGoal: 'Dernier But',
        assists: 'Passes',
        sog: 'Tirs'
      }
    };
    const language = lang && lang.startsWith('fr') ? 'fr' : 'en';
    return translations[language][key] || translations['en'][key];
  }

  _formatTime(timeStr, lang) {
    if (!timeStr) return '';
    const isFrench = lang && lang.startsWith('fr');
    
    if (isFrench) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return `${hours}h${minutes}`;
      }
    }
    return timeStr;
  }

  _formatDate(dateStr, lang) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    
    const isFrench = lang && lang.startsWith('fr');
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return dateObj.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', options);
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
    const lang = this._hass?.language || 'en';

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

    // Format date and time
    let formattedNextGame = '';
    let formattedTime = '';
    if (nextGameDateTime) {
      formattedNextGame = this._formatDate(nextGameDateTime, lang);
      formattedTime = this._formatTime(nextGameTime, lang);
    } else if (nextGameDate) {
      formattedNextGame = nextGameDate;
      formattedTime = this._formatTime(nextGameTime, lang);
    }

    // Game state detection - based on hass-nhlapi sensor.py logic
    // game_state attribute contains: FUT, PRE, LIVE, CRIT, OVER, FINAL, OFF
    const gameState = String(attrs.game_state || 'FUT');
    
    const isUpcoming = gameState === 'FUT' || gameState === 'PRE';
    const isLive = gameState === 'LIVE' || gameState === 'CRIT' || gameState === 'OVER';
    const isFinal = gameState === 'FINAL' || gameState === 'OFF';
    const isNoGame = !attrs.away_name || !attrs.home_name;

    let periodDisplay = '';
    if (isLive) {
      periodDisplay = isIntermission ? 'INT' : `${currentPeriod} ${timeRemaining}`;
    } else if (isFinal) {
      periodDisplay = this._t(lang, 'final');
    } else if (isUpcoming) {
      periodDisplay = this._t(lang, 'nextGame');
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
            margin-bottom: 16px;
            font-size: 13px;
            color: var(--secondary-text-color);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
          }
          .game-header.live {
            color: var(--error-color);
            font-weight: bold;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .pregame-header {
            text-align: center;
            font-size: 12px;
            color: var(--disabled-color);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
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
            width: 72px;
            height: 72px;
            margin: 0 auto 12px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          }
          .team-logo.away {
            background-image: url('${awayLogo}');
          }
          .team-logo.home {
            background-image: url('${homeLogo}');
          }
          .team-name {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--primary-text-color);
          }
          .team-record {
            font-size: 12px;
            color: var(--secondary-text-color);
          }
          .team-sog {
            font-size: 11px;
            color: var(--secondary-text-color);
            margin-top: 6px;
          }
          .score-section {
            text-align: center;
            padding: 0 16px;
          }
          .score {
            font-size: 44px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 8px;
            color: var(--primary-text-color);
            font-family: 'SF Mono', Monaco, monospace;
          }
          .score-divider {
            font-size: 24px;
            color: var(--disabled-color);
          }
          .period-info {
            font-size: 13px;
            color: var(--secondary-text-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .pregame-matchup {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 24px;
            margin-bottom: 16px;
          }
          .pregame-team {
            text-align: center;
          }
          .pregame-team .team-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 8px;
          }
          .pregame-team .team-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--primary-text-color);
          }
          .pregame-vs {
            font-size: 18px;
            color: var(--disabled-color);
            font-weight: 600;
          }
          .game-datetime {
            text-align: center;
            margin-bottom: 16px;
          }
          .game-date {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary-text-color);
            margin-bottom: 4px;
          }
          .game-time {
            font-size: 28px;
            font-weight: 700;
            color: var(--primary-color);
          }
          .game-records {
            text-align: center;
            font-size: 14px;
            color: var(--secondary-text-color);
            margin-bottom: 12px;
          }
          .game-broadcasts {
            text-align: center;
            font-size: 12px;
            color: var(--disabled-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .goal-info {
            background: var(--secondary-background-color);
            border-left: 3px solid var(--error-color);
            border-radius: 0 8px 8px 0;
            padding: 12px 16px;
            margin-top: 16px;
          }
          .goal-header {
            font-size: 11px;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
            letter-spacing: 0.5px;
          }
          .goal-icon {
            font-size: 14px;
          }
          .scorer {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--primary-text-color);
          }
          .scorer .number {
            color: var(--secondary-text-color);
            font-weight: 500;
            margin-right: 4px;
          }
          .assists {
            font-size: 12px;
            color: var(--secondary-text-color);
          }
          .goal-type {
            display: inline-block;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--error-color);
            color: white;
            margin-left: 8px;
            font-weight: 600;
          }
          .no-game {
            text-align: center;
            padding: 32px 16px;
            color: var(--secondary-text-color);
          }
        </style>

        <div class="nhl-card">
          ${this._renderGameHeader(gameState, periodDisplay, periodType, lang)}
          
          ${isNoGame ? `
            <div class="no-game">
              <div style="font-size: 48px; margin-bottom: 12px;">🏒</div>
              <div style="font-size: 16px; font-weight: 500;">${this._t(lang, 'noGame')}</div>
            </div>
          ` : isUpcoming ? `
            <div class="pregame-header">${this._t(lang, 'nextGame')}</div>
            <div class="pregame-matchup">
              <div class="pregame-team">
                ${this._config.show_team_logos !== false && awayLogo ? `
                  <div class="team-logo away"></div>
                ` : ''}
                <div class="team-name">${awayName}</div>
              </div>
              <div class="pregame-vs">@</div>
              <div class="pregame-team">
                ${this._config.show_team_logos !== false && homeLogo ? `
                  <div class="team-logo home"></div>
                ` : ''}
                <div class="team-name">${homeName}</div>
              </div>
            </div>
            <div class="game-datetime">
              <div class="game-date">${formattedNextGame || state}</div>
              ${formattedTime ? `<div class="game-time">${formattedTime}</div>` : ''}
            </div>
            ${awayRecord || homeRecord ? `<div class="game-records">${awayRecord || ''} vs ${homeRecord || ''}</div>` : ''}
            ${attrs.national_broadcasts && attrs.national_broadcasts.length ? `
              <div class="game-broadcasts">
                ${Array.isArray(attrs.national_broadcasts) ? attrs.national_broadcasts.join(' • ') : attrs.national_broadcasts}
              </div>
            ` : ''}
          ` : `
            <div class="scoreboard">
              <div class="team away">
                ${this._config.show_team_logos !== false && awayLogo ? `
                  <div class="team-logo away"></div>
                ` : ''}
                <div class="team-name">${awayName}</div>
                ${awayRecord ? `<div class="team-record">${awayRecord}</div>` : ''}
                ${isLive || isFinal ? `<div class="team-sog">${awaySog} ${this._t(lang, 'sog')}</div>` : ''}
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
                ${isLive || isFinal ? `<div class="team-sog">${homeSog} ${this._t(lang, 'sog')}</div>` : ''}
              </div>
            </div>

            ${this._config.show_last_goal !== false && scoringPlayer && isLive ? `
              <div class="goal-info">
                <div class="goal-header">
                  <span class="goal-icon">🏒</span>
                  <span>${this._t(lang, 'lastGoal')}</span>
                  ${goalType && goalType !== 'EVEN' ? `<span class="goal-type">${goalType}</span>` : ''}
                </div>
                <div class="scorer">
                  ${scoringPlayerNumber ? `<span class="number">#${scoringPlayerNumber}</span>` : ''}
                  ${scoringPlayer}
                </div>
                ${assist1Player ? `
                  <div class="assists">
                    ${this._t(lang, 'assists')}: ${assist1Player}${assist2Player ? `, ${assist2Player}` : ''}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          `}
        </div>
      </ha-card>
    `;
  }

  _renderGameHeader(gameState, periodDisplay, periodType, lang) {
    let headerText = '';
    let cssClass = '';

    if (gameState === 'LIVE') {
      headerText = '🔴 ' + this._t(lang, 'live');
      cssClass = 'live';
    } else if (gameState === 'CRIT') {
      headerText = '🔴 ' + this._t(lang, 'critical');
      cssClass = 'live';
    } else if (gameState === 'FINAL' || gameState === 'OFF') {
      headerText = periodType !== 'REG' ? `${this._t(lang, 'final')}/${periodType}` : this._t(lang, 'final');
    } else if (gameState === 'OVER') {
      headerText = this._t(lang, 'live');
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
