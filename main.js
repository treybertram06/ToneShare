// main.js (patched)
window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const container = document.getElementById('effectsContainer');
  const mic = new Tone.UserMedia();

  /* -----------------------------------------------------------------
     1) Effect definitions — use parameters that actually exist 😊
     -----------------------------------------------------------------*/
  const defs = [
    { name: 'Distortion', C: Tone.Distortion,  params:['distortion','wet'],                          defaults:{ distortion:0.4,   wet:0 } },
    { name: 'Chorus',     C: Tone.Chorus,      params:['frequency','depth','wet'],                   defaults:{ frequency:1.5,    depth:0.5, wet:0 } },
    { name: 'Freeverb',   C: Tone.Freeverb,    params:['roomSize','dampening','wet'],                defaults:{ roomSize:0.7,     dampening:3000, wet:0 } },
    { name: 'PingPong',   C: Tone.PingPongDelay,params:['delayTime','feedback','wet'],               defaults:{ delayTime:0.25,   feedback:0.4,  wet:0 } },
    { name: 'AutoWah',    C: Tone.AutoWah,     params:['baseFrequency','octaves','Q','sensitivity','wet'], defaults:{ baseFrequency:200, octaves:2, Q:6, sensitivity:20, wet:0 } },
    { name: 'Phaser',     C: Tone.Phaser,      params:['frequency','octaves','Q','wet'],            defaults:{ frequency:0.5,    octaves:3, Q:10, wet:0 } }
  ];

  const effects = defs.map(({ name, C, params, defaults }) => ({ name, params, fx: new C(defaults) }));

  /* -----------------------------------------------------------------
     2) Build the UI immediately (no mic permission required)
     -----------------------------------------------------------------*/
  buildUI();

  /* -----------------------------------------------------------------
     3) Start audio routing on user gesture
     -----------------------------------------------------------------*/
  startBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    try { await mic.open(); }
    catch(err){ console.warn('Mic permission denied:', err); return; }
    startBtn.disabled = true;

    let node = mic;
    effects.forEach(({ fx }) => { node.connect(fx); node = fx; });
    node.toDestination();
  });

  /* -----------------------------------------------------------------
     4) UI helper
     -----------------------------------------------------------------*/
  function buildUI(){
    effects.forEach(({ name, fx, params }) => {
      const card = document.createElement('div');
      card.className = 'effect-card';
      card.innerHTML = `<h3>${name}</h3>`;

      params.forEach(p => {
        if(!(p in fx)) return; // skip params that don't exist on this effect
        const valObj = fx[p];
        const curVal  = typeof valObj === 'object' && 'value' in valObj ? valObj.value : valObj;

        const label = document.createElement('label');
        label.textContent = p;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min  = minVal(p);
        slider.max  = maxVal(p);
        slider.step = stepVal(p);
        slider.value = curVal;
        slider.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          if(typeof fx[p] === 'object' && 'value' in fx[p]) fx[p].value = v; else fx[p] = v;
        });
        label.appendChild(slider);
        card.appendChild(label);
      });
      container.appendChild(card);
    });
  }

  /* -----------------------------------------------------------------
     5) Slider ranges (quick‑and‑dirty heuristics)
     -----------------------------------------------------------------*/
  function minVal(p){
    return 0;
  }
  function maxVal(p){
    switch(p){
      case 'wet':
      case 'depth':
      case 'distortion':
      case 'feedback':
      case 'octaves': return 1;
      case 'delayTime': return 1.5;
      case 'frequency': return 10;
      case 'roomSize': return 1;
      case 'dampening': return 6000;
      case 'baseFrequency': return 2000;
      case 'Q': return 20;
      case 'sensitivity': return 100;
      default: return 10;
    }
  }
  function stepVal(p){ return (maxVal(p)-minVal(p)<=1) ? 0.01 : 0.1; }
});

/* style.css remains the same */
