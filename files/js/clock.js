/* World Clock component
   - Displays live time for multiple time zones
   - Persist selected zones + 24h preference in localStorage
   - Uses Intl.DateTimeFormat for localization/time zones
*/

(() => {
  const DEFAULT_ZONES = [
    'local', // special token for user's local time
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];
  const STORAGE_KEY = 'world-clock:zones';
  const STORAGE_HOUR_KEY = 'world-clock:24h';

  const tzSelect = document.getElementById('tz-select');
  const addBtn = document.getElementById('add-tz');
  const zonesContainer = document.getElementById('zones');
  const hourToggle = document.getElementById('hour-toggle');

  // Populate timezone select with common time zones + IANA list fallback
  const commonZones = [
    'local',
    'UTC',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  function buildSelect() {
    tzSelect.innerHTML = '';
    commonZones.forEach(tz => {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = tz === 'local' ? 'Local time (your browser)' : tz;
      tzSelect.appendChild(opt);
    });

    // Try to add all IANA zones if Intl.supportsFormatToParts isn't limited
    // Avoid heavy lists for smaller pages; commonZones is sufficient for most use cases.
  }

  // Save/load
  function loadZones() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ZONES.slice();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_ZONES.slice();
      return arr;
    } catch {
      return DEFAULT_ZONES.slice();
    }
  }
  function saveZones(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function loadHourPref() {
    return localStorage.getItem(STORAGE_HOUR_KEY) === 'true';
  }
  function saveHourPref(v) {
    localStorage.setItem(STORAGE_HOUR_KEY, v ? 'true' : 'false');
  }

  // Utilities
  function tzDisplayName(tz) {
    if (tz === 'local') return 'Local time';
    return tz;
  }

  function getFormatter(tz, hour12) {
    // Use Intl.DateTimeFormat to format time for a given timeZone
    // We include timeZoneName as 'short' to display offsets/abbr (browser-dependent)
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !!(!hour12 ? true : false) ? !hour12 : !hour12, // fallback: convert
      timeZone: tz === 'local' ? undefined : tz,
      timeZoneName: 'short'
    });
  }

  function formatParts(tz, hour24) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !hour24,
      timeZone: tz === 'local' ? undefined : tz,
      timeZoneName: 'short'
    });
    const parts = fmt.formatToParts(now);
    // Assemble main time and tz name from parts
    const timeParts = [];
    let tzName = '';
    parts.forEach(p => {
      if (p.type === 'hour' || p.type === 'minute' || p.type === 'second' || p.type === 'dayPeriod' || p.type === 'literal') {
        timeParts.push(p.value);
      } else if (p.type === 'timeZoneName') {
        tzName = p.value;
      }
    });
    const timeStr = timeParts.join('');
    return { timeStr, tzName, date: now.toLocaleDateString(undefined, {timeZone: tz === 'local' ? undefined : tz}) };
  }

  // Create a zone card DOM
  function createZoneCard(tz) {
    const card = document.createElement('article');
    card.className = 'zone-card';
    card.setAttribute('data-tz', tz);

    const header = document.createElement('div');
    header.className = 'zone-header';

    const title = document.createElement('div');
    title.innerHTML = `<div class="zone-title">${tzDisplayName(tz)}</div><div class="zone-sub tz-name" aria-hidden="true"></div>`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn';
    removeBtn.title = 'Remove timezone';
    removeBtn.ariaLabel = 'Remove timezone';
    removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', () => {
      removeZone(tz);
    });

    header.appendChild(title);
    header.appendChild(removeBtn);

    const timeWrap = document.createElement('div');
    timeWrap.className = 'time-wrap';
    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.setAttribute('aria-live', 'off');
    const secondsSpan = document.createElement('span');
    secondsSpan.className = 'seconds';

    // date line
    const dateLine = document.createElement('div');
    dateLine.className = 'zone-sub';

    // actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'icon-btn';
    refreshBtn.title = 'Refresh';
    refreshBtn.innerHTML = '⟳';
    refreshBtn.addEventListener('click', () => updateCard(tz));

    actions.appendChild(refreshBtn);

    timeWrap.appendChild(timeEl);
    timeWrap.appendChild(actions);

    card.appendChild(header);
    card.appendChild(timeWrap);
    card.appendChild(dateLine);

    return card;
  }

  function renderZones(list) {
    zonesContainer.innerHTML = '';
    list.forEach(tz => {
      const card = createZoneCard(tz);
      zonesContainer.appendChild(card);
    });
  }

  function getZoneList() {
    return loadZones();
  }

  // Add/Remove logic
  function addZone(tz) {
    if (!tz) return;
    const list = getZoneList();
    if (list.includes(tz)) return;
    list.push(tz);
    saveZones(list);
    renderZones(list);
    updateAll(); // render immediately
  }

  function removeZone(tz) {
    let list = getZoneList();
    list = list.filter(x => x !== tz);
    if (list.length === 0) list = DEFAULT_ZONES.slice();
    saveZones(list);
    renderZones(list);
    updateAll();
  }

  // Update time displays
  function updateCard(tz) {
    const card = zonesContainer.querySelector(`.zone-card[data-tz="${CSS.escape(tz)}"]`);
    if (!card) return;
    const hour24 = hourToggle.checked;
    const { timeStr, tzName, date } = formatParts(tz === 'local' ? 'local' : tz, hour24);

    const titleEl = card.querySelector('.zone-title');
    const tzNameEl = card.querySelector('.tz-name');
    const timeEl = card.querySelector('.time');
    const dateEl = card.querySelector('.zone-sub:last-of-type');

    // Separate seconds visually (last two digits after last colon)
    // timeStr contains hour/minute/second + AM/PM if present e.g. "1:23:45 PM GMT+1"
    // We remove the timezone token from timeStr if present (formatParts kept tzName separate).
    let mainTime = timeStr;
    // place seconds in .seconds span for visual style if we can extract them
    const ms = mainTime.match(/(\d{1,2}:\d{2})(:\d{2})?(\s?[AP]M)?/i);
    if (ms) {
      let hhmm = ms[1];
      let sec = ms[2] ? ms[2].slice(1) : '';
      let period = ms[3] ? ms[3] : '';
      if (sec) {
        timeEl.textContent = `${hhmm}:${sec}${period}`;
      } else {
        timeEl.textContent = `${hhmm}${period}`;
      }
    } else {
      timeEl.textContent = mainTime;
    }

    tzNameEl.textContent = tzName || '';
    dateEl.textContent = date || '';

    // ARIA: provide a readable label for screen readers (full time)
    card.setAttribute('aria-label', `${tzDisplayName(tz)}: ${timeEl.textContent} ${tzNameEl.textContent}. Date: ${dateEl.textContent}`);
  }

  function updateAll() {
    const list = getZoneList();
    list.forEach(tz => updateCard(tz));
  }

  // Tick every second
  let timerId = null;
  function startTicker() {
    if (timerId) clearInterval(timerId);
    updateAll();
    timerId = setInterval(updateAll, 1000);
  }

  // Wire up events
  function initEvents() {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const tz = tzSelect.value;
      addZone(tz);
    });

    tzSelect.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addZone(tzSelect.value);
      }
    });

    hourToggle.checked = loadHourPref();
    hourToggle.addEventListener('change', () => {
      saveHourPref(hourToggle.checked);
      updateAll();
    });

    // Allow remove via double click on card title as alternative
    zonesContainer.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.zone-card');
      if (!card) return;
      const tz = card.getAttribute('data-tz');
      if (tz) removeZone(tz);
    });

    // Optional: drag & drop reorder
    enableDragAndDrop();
  }

  // Basic drag & drop reorder; updates localStorage order
  function enableDragAndDrop() {
    let dragEl = null;

    zonesContainer.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.zone-card');
      if (!card) return;
      dragEl = card;
      e.dataTransfer?.setData('text/plain', card.getAttribute('data-tz') || '');
      e.dataTransfer!.effectAllowed = 'move';
    });

    zonesContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const after = getDragAfterElement(e.clientY);
      const dragged = dragEl;
      if (!dragged) return;
      if (after == null) zonesContainer.appendChild(dragged);
      else zonesContainer.insertBefore(dragged, after);
    });

    zonesContainer.addEventListener('dragend', () => {
      dragEl = null;
      // Save new order
      const newOrder = Array.from(zonesContainer.querySelectorAll('.zone-card')).map(c => c.getAttribute('data-tz'));
      saveZones(newOrder);
    });

    // Make cards draggable
    zonesContainer.addEventListener('mouseenter', () => {
      zonesContainer.querySelectorAll('.zone-card').forEach(c => c.setAttribute('draggable', 'true'));
    }, { once: true });

    function getDragAfterElement(y) {
      const draggableElements = [...zonesContainer.querySelectorAll('.zone-card:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  // Initialize
  function init() {
    buildSelect();
    renderZones(getZoneList());
    initEvents();
    startTicker();
  }

  // Start
  init();
})();