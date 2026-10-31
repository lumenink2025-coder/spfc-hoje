/* Presentation and match feedback. Existing quiz/account/ranking rules stay in quiz.html. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const format = n => Math.round(Number(n) || 0).toLocaleString('pt-BR');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let run = null, lastResult = null, continuation = null, continueTimer = null, readyAt = 0, initialized = false;
  const safeGet = (key, fallback = null) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const reduced = () => document.body.classList.contains('arena-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function xpProgress(xp) {
    const info = getLevelInfo(xp);
    const base = XP_TITLES[info.level - 1]?.min || 0;
    return { ...info, percent: info.nextXP ? Math.max(0, Math.min(100, (xp - base) / (info.nextXP - base) * 100)) : 100 };
  }
  function syncPlayer() {
    if (!$('arenaPlayerName')) return;
    const name = STATE.avatar?.name || STATE.user?.displayName || 'Torcedor visitante';
    $('arenaPlayerName').textContent = name;
    const xp = STATE.userData?.xp || 0;
    const info = xpProgress(xp);
    $('arenaHomeXPFill').style.width = info.percent + '%';
    $('arenaHomeXPFill').parentElement.setAttribute('aria-label', `Nível ${info.level}: ${format(xp)} XP`);
  }
  function syncMissions() {
    const list = $('arenaMissionList'); if (!list) return;
    let missions;
    try { missions = getDailyMissions(); } catch { list.textContent = 'Ative o armazenamento local para acompanhar suas missões.'; return; }
    const complete = missions.filter(m => m.completed).length;
    $('missionCount').textContent = `${complete} / ${missions.length}`;
    $('missionFill').style.width = (missions.length ? missions.reduce((s, m) => s + Math.min(1, (m.progress || 0) / Math.max(1, m.target)), 0) / missions.length * 100 : 0) + '%';
    list.innerHTML = missions.map(m => `<div class="arena-mission${m.completed ? ' completed' : ''}"><span class="arena-mission-check" aria-hidden="true">${m.completed ? '✓' : '·'}</span><div><strong>${esc(m.label)}</strong><span>${format(m.progress)} / ${format(m.target)}</span></div><b>${m.completed ? 'CONCLUÍDA' : '+' + format(Math.max(1, Math.floor(m.xp / XP_DIVISOR))) + ' XP'}</b></div>`).join('');
  }
  function startRound() {
    const bestKey = 'mt_arena_best_' + (STATE.user?.uid || 'guest');
    run = { attempts: 0, correct: 0, bestCombo: 0, elapsed: 0, questionStarted: performance.now(), startXP: STATE.userData?.xp || 0, bestKey, previousBest: Math.max(Number(safeGet(bestKey, 0)) || 0, STATE.totalScore || 0), finished: false };
    lastResult = null;
    ArenaAudio.unlock();
  }
  function cancelFeedback() {
    clearTimeout(continueTimer); continueTimer = null; continuation = null;
    if ($('arenaContinue')) $('arenaContinue').disabled = true;
  }
  function screen(id) {
    cancelFeedback();
    const match = ['screen-quiz','screen-levelup','screen-tematico'].includes(id);
    document.body.classList.toggle('arena-in-match', match);
    document.body.classList.toggle('arena-in-result', ['screen-gameover','screen-victory'].includes(id));
    ArenaAudio.scene(match);
    if (id === 'screen-home') { run = null; syncPlayer(); }
    const nav = $('bottomNav'); if (nav) nav.classList.toggle('hidden', match);
  }
  function question(q) {
    cancelFeedback();
    $('arenaAnswerFeedback').hidden = true;
    $('arenaAnswerFeedback').className = 'arena-answer-feedback';
    $('screen-quiz').classList.remove('arena-answer-correct','arena-answer-wrong');
    $('arenaStreak').textContent = comboCount;
    $('arenaComboBonus').textContent = comboCount >= 3 ? '+20% ATIVO' : '3 seguidos = +20%';
    $('arenaComboBonus').classList.toggle('active', comboCount >= 3);
    $('qCategory').textContent = STATE.level === 6 ? 'A PERGUNTA FINAL' : 'HISTÓRIA TRICOLOR';
    if (run) run.questionStarted = performance.now();
    const view = $('screen-quiz'); view.scrollTop = 0;
    if (!reduced() && $('qText').animate) $('qText').animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    $('qText').focus({ preventScroll: true });
  }
  function answer(correct, q, points, callback, timeout = false) {
    if (!run) return;
    run.attempts++; if (correct) run.correct++;
    run.bestCombo = Math.max(run.bestCombo, comboCount);
    run.elapsed += Math.max(0, Math.min(LEVELS_INFO[STATE.level - 1].time, (performance.now() - run.questionStarted) / 1000));
    continuation = callback;
    readyAt = performance.now() + 500;
    const panel = $('arenaAnswerFeedback'); panel.hidden = false;
    panel.classList.toggle('is-correct', correct);
    $('screen-quiz').classList.add(correct ? 'arena-answer-correct' : 'arena-answer-wrong');
    $('arenaFeedbackLabel').textContent = correct ? `+${format(points)} PONTOS` : timeout ? 'TEMPO ESGOTADO' : 'RESPOSTA INCORRETA';
    $('arenaFeedbackTitle').textContent = correct ? comboCount >= 3 ? 'A TORCIDA VEIO JUNTO.' : 'BELA JOGADA.' : 'ESSA FICA PARA A PRÓXIMA.';
    $('arenaFeedbackDetail').textContent = correct ? `Acerto: ${format(LEVELS_INFO[STATE.level - 1].pts)} · Tempo: ${format(Math.floor(STATE.timeLeft * 10))}${comboCount >= 3 ? ' · Bônus de sequência: +20%' : ''}` : 'Resposta correta: ' + q.o[q.c];
    const explanation = q.explanation || q.explicacao;
    if (typeof explanation === 'string' && explanation.trim()) $('arenaFeedbackDetail').textContent += '\n' + explanation.trim();
    $('arenaContinue').innerHTML = correct ? (STATE.level === 6 ? 'VER CONQUISTA' : STATE.questionIdx === 4 ? 'AVANÇAR DE NÍVEL' : 'PRÓXIMA PERGUNTA') + ' <span>→</span>' : 'VER RESULTADO <span>→</span>';
    $('arenaContinue').disabled = true;
    continueTimer = setTimeout(() => { if (continuation) $('arenaContinue').disabled = false; }, 520);
    $('arenaStreak').textContent = comboCount;
    $('arenaComboBonus').textContent = comboCount >= 3 ? '+20% ATIVO' : '3 seguidos = +20%';
    $('arenaComboBonus').classList.toggle('active', comboCount >= 3);
    document.querySelectorAll('#qOptions .q-opt').forEach(btn => {
      if (!btn.classList.contains('correct') && !btn.classList.contains('wrong')) return;
      const mark = document.createElement('span'); mark.className = 'arena-answer-status';
      mark.textContent = btn.classList.contains('correct') ? '✓' : '×'; mark.setAttribute('aria-hidden','true'); btn.appendChild(mark);
      btn.setAttribute('aria-label', btn.textContent.trim() + (btn.classList.contains('correct') ? ', resposta correta' : ', resposta incorreta'));
    });
    if (!reduced() && $('quizScoreBadge').animate && correct) $('quizScoreBadge').animate([{ transform:'scale(1)' },{ transform:'scale(1.12)' },{ transform:'scale(1)' }], { duration: 330 });
    requestAnimationFrame(() => panel.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'instant' : 'smooth' }));
    renderHomeXP();
  }
  function next() {
    if (!continuation || performance.now() < readyAt) return;
    const proceed = continuation; cancelFeedback();
    ArenaAudio.play('tap'); proceed();
  }
  function result(won) {
    if (!run || run.finished) return;
    run.finished = true;
    const prefix = won ? 'vic' : 'go', xp = STATE.userData?.xp || 0;
    const info = xpProgress(xp), before = xpProgress(run.startXP);
    const accuracy = run.attempts ? Math.round(run.correct / run.attempts * 100) : 0;
    const xpGain = Math.max(0, xp - run.startXP);
    const average = run.attempts ? (run.elapsed / run.attempts).toFixed(1).replace('.', ',') : '—';
    const newBest = STATE.score > run.previousBest;
    safeSet(run.bestKey, Math.max(run.previousBest, STATE.score));
    $(prefix + 'Record').hidden = !newBest;
    $(prefix + 'Score').textContent = format(STATE.score);
    $(prefix + 'ArenaStats').innerHTML = `<div><strong>${run.correct}<small>/${run.attempts}</small></strong><span>ACERTOS</span></div><div><strong>${accuracy}<small>%</small></strong><span>PRECISÃO</span></div><div><strong>${run.bestCombo}</strong><span>MELHOR SEQUÊNCIA</span></div><div><strong>${average}<small>s</small></strong><span>TEMPO MÉDIO</span></div>`;
    $(prefix + 'ArenaXP').textContent = '+' + format(xpGain) + ' XP';
    const fill = $(prefix + 'XPFill'); fill.style.transition = 'none'; fill.style.width = (before.level === info.level ? before.percent : 0) + '%';
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transition = reduced() ? 'none' : 'width 900ms cubic-bezier(.2,.7,.2,1)'; fill.style.width = info.percent + '%'; }));
    $(prefix + 'XPDetail').textContent = `Nível ${info.level} · ${format(xp)} XP${info.nextXP ? ' · ' + format(info.nextXP - xp) + ' para evoluir' : ' · nível máximo'}`;
    if (won) $('vicTryAgain').disabled = !hasDailyAttemptsLeft();
    lastResult = { score: STATE.score, correct: run.correct, attempts: run.attempts, bestCombo: run.bestCombo, accuracy, xpGain, won, name: STATE.avatar?.name || STATE.user?.displayName || 'Torcedor tricolor' };
    syncPlayer();
  }
  async function share() {
    if (!lastResult) return;
    const r = { ...lastResult }, canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const c = canvas.getContext('2d'); if (!c) return;
    c.fillStyle = '#0d0d0d'; c.fillRect(0,0,1080,1350);
    c.fillStyle = '#a60000'; c.fillRect(0,0,1080,14); c.fillRect(72,220,8,200);
    c.fillStyle = '#888'; c.font = 'bold 22px Arial'; c.fillText('MAGAZINE TRICOLOR / GAMING',72,110);
    c.fillStyle = '#fff'; c.font = '900 94px Arial'; c.fillText('ARENA',110,300);
    c.fillStyle = '#bd1010'; c.fillText('TRICOLOR',110,402);
    c.fillStyle = '#ccc'; c.font = '28px Arial'; c.fillText(r.name.slice(0,38),72,520);
    c.fillStyle = '#fff'; c.font = '900 150px Arial'; c.fillText(format(r.score),72,730,936);
    c.fillStyle = '#aaa'; c.font = 'bold 25px Arial'; c.fillText('PONTOS NO DESAFIO CLÁSSICO',78,785);
    c.strokeStyle = '#333'; c.beginPath(); c.moveTo(72,850); c.lineTo(1008,850); c.stroke();
    [['ACERTOS',r.correct + '/' + r.attempts],['PRECISÃO',r.accuracy + '%'],['SEQUÊNCIA',String(r.bestCombo)]].forEach(([label,value],i) => { const x=72+i*330; c.fillStyle='#fff'; c.font='bold 65px Arial'; c.fillText(value,x,960); c.fillStyle='#999'; c.font='20px Arial'; c.fillText(label,x,1008); });
    c.fillStyle='#a60000'; c.fillRect(72,1100,936,100); c.fillStyle='#fff'; c.font='bold 30px Arial'; c.fillText(r.won ? 'SEIS NÍVEIS. HISTÓRIA DOMINADA.' : 'O MANTO É SEU. PROVE.',105,1163);
    c.fillStyle='#999'; c.font='23px Arial'; c.fillText('Quiz da Magazine Tricolor',72,1285);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const file = new File([blob], 'arena-tricolor-resultado.png', { type:'image/png' });
    try {
      if (navigator.canShare?.({ files:[file] })) { await navigator.share({ files:[file], title:'Meu resultado na Arena Tricolor', text:`Fiz ${format(r.score)} pontos no quiz da Magazine Tricolor!` }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url; a.download=file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),30000);
    toast('Card pronto', 'Seu resultado foi preparado como imagem para compartilhar.');
  }
  function refreshSettings() {
    const settings = ArenaAudio.settings;
    $('arenaSoundEnabled').checked = settings.enabled;
    for (const [key,label] of [['effects','Effects'],['music','Music'],['crowd','Crowd']]) { $('arena' + label + 'Volume').value = Math.round(settings[key] * 100); $('arena' + label + 'Value').textContent = Math.round(settings[key] * 100) + '%'; }
  }
  function openSettings() { refreshSettings(); $('arenaSettings').showModal(); }
  function init() {
    if (initialized) return; initialized = true;
    const motion = safeGet('mt_arena_reduce_motion');
    const reduce = motion === null ? matchMedia('(prefers-reduced-motion: reduce)').matches : motion === 'true';
    document.body.classList.toggle('arena-reduce-motion', reduce); $('arenaReduceMotion').checked = reduce;
    $('arenaReduceMotion').addEventListener('change', e => { document.body.classList.toggle('arena-reduce-motion',e.target.checked); safeSet('mt_arena_reduce_motion',e.target.checked); });
    $('arenaSoundEnabled').addEventListener('change', e => { ArenaAudio.set('enabled',e.target.checked); if (e.target.checked) ArenaAudio.unlock(); });
    for (const [key,label] of [['effects','Effects'],['music','Music'],['crowd','Crowd']]) $('arena'+label+'Volume').addEventListener('input', e => { ArenaAudio.set(key,Number(e.target.value)/100); refreshSettings(); });
    window.addEventListener('arena-audio-change', refreshSettings);
    // Unlock from an actual gesture in any mode, including Wondler and Sexta Temática.
    document.addEventListener('pointerdown', () => { if (ArenaAudio.diagnostics.state !== 'running') ArenaAudio.unlock(); }, { passive:true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof refreshCountdown === 'function') refreshCountdown(); });
    document.addEventListener('keydown', e => {
      if (!e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey && ArenaAudio.diagnostics.state !== 'running') ArenaAudio.unlock();
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || document.querySelector('dialog[open], .modal-overlay.open')) return;
      if (!$('screen-quiz').classList.contains('active')) return;
      if (e.key === 'Enter' && continuation) { e.preventDefault(); next(); }
      if (/^[1-4]$/.test(e.key) && !answerLocked) { e.preventDefault(); const button = $('qOptions').children[Number(e.key)-1]; if (button && !button.disabled) button.click(); }
    });
    $('arenaSettings').addEventListener('click', e => { if (e.target === $('arenaSettings')) { const r=e.target.getBoundingClientRect(); if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) e.target.close(); } });
    refreshSettings(); syncPlayer(); syncMissions();
  }
  window.Arena = { init, startRound, screen, question, answer, next, result, share, syncPlayer, syncMissions, openSettings };
})();
