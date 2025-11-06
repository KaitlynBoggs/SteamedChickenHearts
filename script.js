(function(){
  'use strict'

  // Interactive behaviors for the Satanic Nightjar micro-site

  // Accent toggle (keeps orange by default but allows toggling to blue accent for demo)
  const accentToggle = document.getElementById('accentToggle');
  const accentSample = document.getElementById('accentSample');
  let orange = true;

  function applyAccent(){
    if(orange){
      document.documentElement.style.setProperty('--accent','#ff7a18');
      document.documentElement.style.setProperty('--accent-2','#ff9a49');
      accentToggle.setAttribute('aria-pressed','true');
      accentToggle.textContent = 'Orange accents';
    } else {
      // alternate accent (cool blue) — user requested orange; this is optional.
      document.documentElement.style.setProperty('--accent','#00c2ff');
      document.documentElement.style.setProperty('--accent-2','#0077b6');
      accentToggle.setAttribute('aria-pressed','false');
      accentToggle.textContent = 'Blue accents';
    }
    if(accentSample) accentSample.style.background = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  }

  accentToggle && accentToggle.addEventListener('click', ()=>{
    orange = !orange;
    applyAccent();
  });

  // Card flip: support click/tap (use button so keyboard is supported)
  const cards = Array.from(document.querySelectorAll('.card'));
  cards.forEach(card => {
    card.addEventListener('click', ()=>{
      card.classList.toggle('is-flipped');
      const expanded = card.classList.contains('is-flipped');
      card.setAttribute('aria-expanded', String(expanded));
    });
    // allow keyboard flipping
    card.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        card.click();
      }
    });
  });

  // ---- New interactive features ----
  // Modal for expanded details
  const modal = document.getElementById('factModal');
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const cardsContainer = document.getElementById('cardsContainer');
  const progressFill = document.getElementById('progressFill');

  // Build a facts array from the cards for navigation/filtering
  let facts = Array.from(cardsContainer.querySelectorAll('.card')).map((el, idx)=>({
    el,
    id: idx,
    title: el.querySelector('.card__face--front strong')?.innerText || 'Fact',
    summary: el.querySelector('.card__face--front p')?.innerText || '',
    detail: el.querySelector('.card__face--back p')?.innerText || ''
  }));

  // Track viewed facts in this session
  const viewed = new Set();
  function updateProgress(){
    const pct = facts.length ? Math.round((viewed.size / facts.length) * 100) : 0;
    progressFill.style.width = pct + '%';
  }

  // Open modal for a fact index
  let currentIndex = 0;
  function openModal(index){
    currentIndex = (index + facts.length) % facts.length;
    const f = facts[currentIndex];
    modalTitle.innerText = f.title;
    modalBody.innerText = f.detail || f.summary;
    modal.setAttribute('aria-hidden','false');
    modal.style.display = 'flex';
    modalClose.focus();
    viewed.add(f.id);
    updateProgress();
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    modal.style.display = 'none';
  }

  // wire card to open modal on double-click or long-press; single click still flips
  facts.forEach((f, i)=>{
    f.el.addEventListener('dblclick', ()=>openModal(i));
    // also add a small context menu-like longpress listener for touch
    let touchTimer = null;
    f.el.addEventListener('touchstart', ()=>{ touchTimer = setTimeout(()=>openModal(i), 700); });
    f.el.addEventListener('touchend', ()=>{ if(touchTimer) clearTimeout(touchTimer); });
  });

  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', ()=>openModal((currentIndex-1+facts.length)%facts.length));
  modalNext.addEventListener('click', ()=>openModal((currentIndex+1)%facts.length));

  // keyboard shortcuts for modal and site: Left/Right to navigate, Esc to close, / to focus search
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false'){
      closeModal();
    }
    if(modal.getAttribute('aria-hidden') === 'false'){
      if(e.key === 'ArrowLeft') openModal(currentIndex-1);
      if(e.key === 'ArrowRight') openModal(currentIndex+1);
    }
    if(e.key === '/'){
      const s = document.getElementById('factSearch');
      if(s){ e.preventDefault(); s.focus(); }
    }
  });

  // Search/filter
  const searchInput = document.getElementById('factSearch');
  function filterCards(q){
    q = (q||'').trim().toLowerCase();
    facts.forEach(f=>{
      const match = (f.title + ' ' + f.summary + ' ' + f.detail).toLowerCase().includes(q);
      f.el.style.display = match ? '' : 'none';
    });
  }
  searchInput && searchInput.addEventListener('input', e=>filterCards(e.target.value));

  // Random fact button now opens modal with a random fact
  const randomFactBtn = document.getElementById('randomFactBtn');
  randomFactBtn && randomFactBtn.addEventListener('click', ()=>{
    const idx = Math.floor(Math.random() * facts.length);
    openModal(idx);
  });

  // Enhance Speak button to speak the modal detail if modal open, otherwise speak a random fact summary
  // --- Speech enhancements: voice selection, rate, play/pause/stop, highlight ---
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceRate = document.getElementById('voiceRate');
  const ttsPlay = document.getElementById('ttsPlay');
  const ttsPause = document.getElementById('ttsPause');
  const ttsStop = document.getElementById('ttsStop');

  let availableVoices = [];
  // choose a high-quality sounding voice if available
  function chooseBestVoice(voices){
    if(!voices || !voices.length) return 0;
    const preferred = [
      'Google US English','Google US','Google UK English Male','Google UK English Female',
      'Microsoft Zira','Microsoft David','Samantha','Joanna','Ivy','Daniel','Alex','Serena'
    ];
    // try to match preferred names first
    for(const p of preferred){
      const idx = voices.findIndex(v => (v.name || '').includes(p));
      if(idx >= 0) return idx;
    }
    // fall back to language preference (en or en-US)
    const enIdx = voices.findIndex(v => v.lang && (v.lang.startsWith('en') || v.lang.startsWith('en-')));
    if(enIdx >= 0) return enIdx;
    return 0;
  }
  function populateVoices(){
    availableVoices = speechSynthesis.getVoices().filter(v=>v.lang);
    if(voiceSelect){
      voiceSelect.innerHTML = '';
      availableVoices.forEach((v,i)=>{
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${v.name} — ${v.lang}` + (v.default ? ' (default)' : '');
        voiceSelect.appendChild(opt);
      });
      // pick a sensible default
      if(availableVoices.length && voiceSelect.selectedIndex < 0) voiceSelect.selectedIndex = chooseBestVoice(availableVoices);
    }
  }

  if('speechSynthesis' in window){
    // voices may load asynchronously
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  } else {
    // hide controls if not supported
    document.querySelectorAll('.speech-controls').forEach(el=> el.style.display = 'none');
  }

  // helpers for sentence-wise speaking and highlighting
  let _utterQueue = [];
  let _isPlaying = false;

  function clearHighlights(){
    if(modalBody){
      modalBody.innerHTML = modalBody.innerText; // reset to plain text
    }
  }

  function speakText(text){
    if(!('speechSynthesis' in window)) return alert('Speech synthesis not supported in this browser.');
    // split into sentences for highlighting (simple split)
    const sentences = text.match(/[^\.\!\?\n]+[\.\!\?]?/g) || [text];
    // prepare modal body for highlighting if modal open
    if(modal.getAttribute('aria-hidden') === 'false'){
      modalBody.innerHTML = sentences.map(s=>`<span>${s.trim()}</span>`).join(' ');
    }

    window.speechSynthesis.cancel();
    _utterQueue = sentences.map((s, idx)=>{
      const u = new SpeechSynthesisUtterance(s.trim());
      const voiceIdx = Number(voiceSelect?.value || 0) || 0;
      u.voice = availableVoices[voiceIdx] || null;
      // tuning for more natural delivery
      u.rate = Math.max(0.75, Math.min(1.05, Number(voiceRate?.value) || 0.95));
      u.pitch = 1.02; // slight pitch boost for clarity
      u.volume = 1.0;
      const sentenceIndex = idx;
      u.onstart = ()=>{
        _isPlaying = true;
        // highlight current sentence if modal open
        if(modal.getAttribute('aria-hidden') === 'false'){
          const spans = Array.from(modalBody.querySelectorAll('span'));
          spans.forEach(sp=>sp.classList.remove('highlight'));
          spans[sentenceIndex] && spans[sentenceIndex].classList.add('highlight');
        }
      };
      u.onend = ()=>{
        // remove highlight for this sentence
        if(modal.getAttribute('aria-hidden') === 'false'){
          const spans = Array.from(modalBody.querySelectorAll('span'));
          spans[sentenceIndex] && spans[sentenceIndex].classList.remove('highlight');
        }
      };
      return u;
    });

    // speak sequentially with a short gap between sentences for natural pacing
    (function playQueue(i){
      if(i >= _utterQueue.length) { _isPlaying = false; return; }
      const u = _utterQueue[i];
      // attach end handler to advance after a short pause
      u.onend = ()=> setTimeout(()=> playQueue(i+1), 220);
      window.speechSynthesis.speak(u);
    })(0);
  }

  function stopSpeech(){
    window.speechSynthesis.cancel();
    _isPlaying = false;
    clearHighlights();
  }

  ttsPlay && ttsPlay.addEventListener('click', ()=>{
    let text = '';
    if(modal.getAttribute('aria-hidden') === 'false'){
      text = modalBody.innerText;
    } else {
      const f = facts[Math.floor(Math.random()*facts.length)];
      text = f.title + '. ' + f.summary + ' ' + f.detail;
    }
    speakText(text);
  });

  ttsPause && ttsPause.addEventListener('click', ()=>{
    if(window.speechSynthesis.speaking){
      if(window.speechSynthesis.paused) window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
    }
  });

  ttsStop && ttsStop.addEventListener('click', ()=>{
    stopSpeech();
  });

  // Make sure Stop is called when modal closed
  modalClose && modalClose.addEventListener('click', ()=> stopSpeech());

  // Initialize progress
  updateProgress();

  // Image fallback: if external PNG isn't available, show the inline SVG fallback
  const nightjarImg = document.getElementById('nightjarImg');
  const inlineSvg = document.querySelector('.inline-svg');
  if(nightjarImg){
    // if the image loads, hide the inline SVG
    nightjarImg.addEventListener('load', ()=>{
      if(inlineSvg) inlineSvg.style.display = 'none';
      nightjarImg.style.display = 'block';
    });
    // if it errors (missing), show the inline SVG
    nightjarImg.addEventListener('error', ()=>{
      if(inlineSvg) inlineSvg.style.display = 'block';
      nightjarImg.style.display = 'none';
    });
    // trigger fallback logic immediately if already failed to load
    if(!nightjarImg.complete || nightjarImg.naturalWidth === 0){
      // wait a tick for browser to attempt load
      setTimeout(()=>{ if(nightjarImg.naturalWidth === 0 && inlineSvg) { inlineSvg.style.display = 'block'; nightjarImg.style.display = 'none'; } }, 250);
    }
  }

  // --- Audio playback for nightjar calls ---
  const audioStatus = document.getElementById('audioStatus');
  const audioPlay = document.getElementById('audioPlay');
  const audioPause = document.getElementById('audioPause');
  const audioStop = document.getElementById('audioStop');
  const audioVolume = document.getElementById('audioVolume');

  // attempt to load a local recording (user can add assets/nightjar-call.mp3), otherwise fall back to the attached Freesound MP3
  const localSrc = 'assets/nightjar-call.mp3';
  const remoteSrc = 'https://cdn.freesound.org/previews/245/245700_2404634-lq.mp3'; // Jonnosaurus (CC0)
  const audioPlayer = new Audio();
  audioPlayer.preload = 'auto';
  let audioAvailable = false;
  let usingRemote = false;

  function setAudioStatus(text){ if(audioStatus) audioStatus.textContent = text; }

  function tryLocalThenRemote(){
    usingRemote = false;
    audioPlayer.src = localSrc;
    audioPlayer.load();
    setAudioStatus('Checking for local recording...');
  }

  // first try local file
  tryLocalThenRemote();

  audioPlayer.addEventListener('canplaythrough', ()=>{
    audioAvailable = true;
    setAudioStatus(usingRemote ? 'Remote recording available (Freesound — Jonnosaurus).' : 'Local recording available.');
  });

  audioPlayer.addEventListener('error', ()=>{
    if(!usingRemote){
      // try remote Freesound as fallback
      usingRemote = true;
      audioPlayer.src = remoteSrc;
      audioPlayer.load();
      setAudioStatus('Local file not found — trying remote sample (Freesound)...');
    } else {
      audioAvailable = false;
      setAudioStatus('No recording available — using spoken fallback.');
    }
  });

  // volume control
  audioVolume && audioVolume.addEventListener('input', (e)=>{
    audioPlayer.volume = Number(e.target.value);
  });

  // play/pause/stop
  audioPlay && audioPlay.addEventListener('click', ()=>{
    if(audioAvailable){
      audioPlayer.play();
      setAudioStatus((usingRemote ? 'Playing remote recording (Freesound)...' : 'Playing local recording...'));
    } else {
      // fallback: use speech synthesis to describe/imitate the call
      if('speechSynthesis' in window){
        const fallbackText = 'Playing a sample nightjar call. Churr... churr... churr.';
        const u = new SpeechSynthesisUtterance(fallbackText);
        u.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        setAudioStatus('Playing fallback (spoken) sample.');
      } else {
        setAudioStatus('No audio available.');
      }
    }
  });

  audioPause && audioPause.addEventListener('click', ()=>{
    if(audioAvailable){
      if(audioPlayer.paused) audioPlayer.play(); else audioPlayer.pause();
    } else {
      if(window.speechSynthesis.speaking){
        if(window.speechSynthesis.paused) window.speechSynthesis.resume(); else window.speechSynthesis.pause();
      }
    }
  });

  audioStop && audioStop.addEventListener('click', ()=>{
    if(audioAvailable){
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setAudioStatus('Stopped.');
    } else {
      window.speechSynthesis.cancel();
      setAudioStatus('Stopped fallback.');
    }
  });

  // if audio ends, update status
  audioPlayer.addEventListener('ended', ()=>{ setAudioStatus('Playback finished.'); });

  // Speech: speak a random front-card text
  const speakBtn = document.getElementById('speakBtn');
  function randomFact(){
    const fronts = cards.map(c => c.querySelector('.card__face--front').innerText.trim());
    return fronts[Math.floor(Math.random()*fronts.length)];
  }

  speakBtn && speakBtn.addEventListener('click', ()=>{
    const text = randomFact();
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } else {
      alert('Speech synthesis not supported in this browser.');
    }
  });

  // --- Distribution map (Leaflet) ---
  try {
    if(typeof L !== 'undefined'){
      const mapEl = document.getElementById('map');
      if(mapEl){
        // Center on northern South America by default (illustrative)
        const map = L.map('map', { scrollWheelZoom: true }).setView([-6.0, -60], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        // Sulawesi-focused polygon (reflects user-provided range: Sulawesi, Indonesia)
        const rangeCoords = [
          [2.5, 119.0],
          [3.5, 122.0],
          [1.5, 124.5],
          [-2.0, 125.0],
          [-4.0, 122.0],
          [-3.5, 119.0],
          [-1.0, 118.5],
          [1.0, 118.8]
        ];

        // Read accent colors with fallback
        const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ff7a18').trim() || '#ff7a18';
        const accent2 = (getComputedStyle(document.documentElement).getPropertyValue('--accent-2') || '#ff9a49').trim() || '#ff9a49';

        const range = L.polygon(rangeCoords, {
          color: accent,
          weight: 2,
          fillColor: accent,
          fillOpacity: 0.28,
          dashArray: '4 6'
        }).addTo(map);
        range.bindPopup('<strong>Range (Sulawesi)</strong><br>The Satanic Nightjar is endemic to Sulawesi — this shaded area shows an illustrative island distribution.');

        // Sample sighting markers within Sulawesi (illustrative)
        const samplePoints = [
          { lat: 0.5, lng: 123.0, name: 'Central Sulawesi (illustrative) '},
          { lat: -1.5, lng: 121.5, name: 'South Sulawesi (illustrative)'},
          { lat: 1.5, lng: 124.8, name: 'North Sulawesi (illustrative)'}
        ];

        samplePoints.forEach(p=>{
          L.circleMarker([p.lat, p.lng], { radius:6, color: accent2, fillColor: accent2, fillOpacity: 0.95 }).addTo(map).bindPopup(p.name);
        });

        // Fit the map to the polygon bounds with a small padding and center on Sulawesi
        const bounds = range.getBounds();
        if(bounds.isValid()){
          map.fitBounds(bounds.pad(0.2));
        } else {
          map.setView([ -0.5, 121.0 ], 6);
        }

        // Add a small legend control
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function (){
          const div = L.DomUtil.create('div', 'map-legend');
          div.innerHTML = `<div><span class="legend-swatch" style="background:${accent}"></span> Sulawesi range (illustrative)</div><div><span class="legend-point" style="background:${accent2}"></span> Sample sightings</div>`;
          return div;
        };
        legend.addTo(map);
      }
    }
  } catch(err){
    // if anything fails, don't break the rest of the script
    console.warn('Map initialization failed:', err);
  }

  // Initial setup
  applyAccent();

})();
