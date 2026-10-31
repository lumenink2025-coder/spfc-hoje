/* Arena Tricolor · one audio context, original procedural sounds, no audio downloads. */
(() => {
  'use strict';
  const KEY = 'mt_arena_audio_v1';
  const defaults = { enabled: true, effects: .7, music: .18, crowd: .2 };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
  const settings = { ...defaults };
  if (typeof saved.enabled === 'boolean') settings.enabled = saved.enabled;
  for (const k of ['effects', 'music', 'crowd']) if (Number.isFinite(saved[k])) settings[k] = Math.max(0, Math.min(1, saved[k]));
  let ctx, master, buses, noiseBuffer, crowdSource, crowdGain, musicLoop;
  let sceneActive = false, unlocked = false, chord = 0;
  const playing = new Set();

  function notify() {
    document.querySelectorAll('[data-arena-mute]').forEach(el => {
      el.textContent = settings.enabled ? '♪' : '♪̸';
      el.setAttribute('aria-label', settings.enabled ? 'Silenciar áudio' : 'Ativar áudio');
      el.setAttribute('aria-pressed', String(!settings.enabled));
      el.classList.toggle('is-muted', !settings.enabled);
    });
    window.dispatchEvent(new Event('arena-audio-change'));
  }
  function gainTo(node, value) {
    if (!node || !ctx) return;
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.setTargetAtTime(value, ctx.currentTime, .025);
  }
  function apply() {
    gainTo(master, settings.enabled && !document.hidden ? .65 : 0);
    if (buses) for (const k of ['effects', 'music', 'crowd']) gainTo(buses[k], k === 'music' && !sceneActive ? 0 : settings[k]);
    notify();
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {} }
  async function unlock() {
    try {
      if (!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        ctx = new AudioContext();
        master = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -10; limiter.ratio.value = 8;
        master.connect(limiter); limiter.connect(ctx.destination);
        buses = {};
        for (const k of ['effects', 'music', 'crowd']) { buses[k] = ctx.createGain(); buses[k].connect(master); }
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) { last = (last + Math.random() * .04 - .02) / 1.02; data[i] = last * 12; }
      }
      if (ctx.state === 'suspended' && !document.hidden) await ctx.resume();
      unlocked = ctx.state === 'running';
      apply(); updateBed();
      return unlocked;
    } catch { return false; }
  }
  function track(source, gain, end) {
    playing.add(source);
    source.onended = () => { playing.delete(source); source.disconnect(); gain.disconnect(); };
    source.stop(end);
  }
  function tone(freq, duration, volume = .2, delay = 0, type = 'sine', bus = 'effects', endFreq) {
    if (!ctx || ctx.state !== 'running' || !settings.enabled || document.hidden) return;
    const t = ctx.currentTime + delay, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), t + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain); gain.connect(buses[bus]); osc.start(t); track(osc, gain, t + duration + .02);
  }
  function noise(duration, volume, frequency = 900, delay = 0) {
    if (!ctx || ctx.state !== 'running' || !settings.enabled || document.hidden) return;
    const t = ctx.currentTime + delay, src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = noiseBuffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .6;
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    src.connect(filter); filter.connect(gain); gain.connect(buses.effects); src.start(t);
    playing.add(src); src.onended = () => { playing.delete(src); src.disconnect(); filter.disconnect(); gain.disconnect(); }; src.stop(t + duration + .01);
  }
  function play(name, value = 0) {
    if (!unlocked || !settings.enabled || document.hidden || !ctx || ctx.state !== 'running') return;
    switch (name) {
      case 'tap': tone(440, .07, .1, 0, 'triangle', 'effects', 180); break;
      case 'tick': tone(value <= 2 ? 850 : 620, .1, .12); break;
      case 'start': [196, 293.66, 392, 587.33].forEach((f, i) => tone(f, .35, .2, i * .11, 'triangle')); noise(.3, .25, 1400); break;
      case 'correct': {
        const lift = Math.min(5, Math.max(0, value - 1)) * 20;
        tone(98, .18, .45, 0, 'sine', 'effects', 46);
        [392 + lift, 493.88 + lift, 587.33 + lift].forEach((f, i) => tone(f, .25, .16, .04 + i * .07, 'triangle'));
        noise(.45, .2, 1200, .07); break;
      }
      case 'wrong': tone(130, .26, .24, 0, 'triangle', 'effects', 55); noise(.16, .18, 300); break;
      case 'level': [293.66, 392, 493.88, 587.33].forEach((f, i) => tone(f, .4, .2, i * .09, 'triangle')); noise(.5, .25, 1600, .15); break;
      case 'end': [196, 164.81, 146.83].forEach((f, i) => tone(f, .35, .18, i * .14, 'triangle')); break;
      case 'victory': [293.66, 392, 493.88, 587.33, 783.99].forEach((f, i) => tone(f, .6, .2, i * .12, 'triangle')); noise(.9, .3, 1800, .15); break;
    }
  }
  function musicPhrase() {
    if (!settings.music || !sceneActive || !settings.enabled || document.hidden) return;
    const progression = [[146.83, 220, 293.66], [130.81, 196, 261.63], [116.54, 174.61, 233.08], [130.81, 196, 261.63]];
    const notes = progression[chord++ % progression.length];
    notes.forEach((f, i) => tone(f, 2.2, .12, i * .06, 'sine', 'music'));
    tone(notes[0] / 2, .7, .2, 0, 'sine', 'music');
    tone(notes[0] / 2, .55, .13, 1.2, 'sine', 'music');
  }
  function stopBed() {
    clearInterval(musicLoop); musicLoop = null;
    if (crowdSource) { try { crowdSource.stop(); } catch {} crowdSource.disconnect(); crowdSource = null; }
    if (crowdGain) { crowdGain.disconnect(); crowdGain = null; }
  }
  function updateBed() {
    if (!ctx || !unlocked || ctx.state !== 'running' || !sceneActive || !settings.enabled || document.hidden) { stopBed(); return; }
    if (!crowdSource) {
      crowdSource = ctx.createBufferSource(); crowdSource.buffer = noiseBuffer; crowdSource.loop = true;
      crowdGain = ctx.createBiquadFilter(); crowdGain.type = 'lowpass'; crowdGain.frequency.value = 720;
      crowdSource.connect(crowdGain); crowdGain.connect(buses.crowd); crowdSource.start();
    }
    if (!musicLoop) { musicPhrase(); musicLoop = setInterval(musicPhrase, 2400); }
  }
  function set(key, value) {
    if (!(key in settings)) return;
    settings[key] = key === 'enabled' ? Boolean(value) : Math.max(0, Math.min(1, Number(value) || 0));
    persist(); apply(); updateBed();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopBed(); playing.forEach(source => { try { source.stop(); } catch {} }); gainTo(master, 0); if (ctx?.state === 'running') ctx.suspend().catch(() => {}); }
    else if (unlocked) unlock();
  });
  window.addEventListener('pagehide', () => { stopBed(); if (ctx?.state === 'running') ctx.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { if (unlocked && !document.hidden) unlock(); });
  window.ArenaAudio = {
    unlock, play, set, get settings() { return { ...settings }; },
    scene(active) { sceneActive = Boolean(active); apply(); updateBed(); },
    async toggleMute() { set('enabled', !settings.enabled); if (settings.enabled) await unlock(); },
    async preview() { if (!settings.enabled) set('enabled', true); if (await unlock()) play('correct', 3); },
    get diagnostics() { return { contexts: ctx ? 1 : 0, state: ctx?.state || 'uninitialized', activeSources: playing.size, ambience: Boolean(crowdSource), enabled: settings.enabled }; }
  };
})();
