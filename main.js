// main.js — full pedalboard defs
window.addEventListener('DOMContentLoaded', () => {
  const startBtn  = document.getElementById('startBtn');
  const container = document.getElementById('effectsContainer');
  const mic       = new Tone.UserMedia();

  /*───────────────────────────────────────────────────────────────
    Effect definitions – every built‑in Tone.js processor that’s
    even remotely guitar‑friendly. Only numeric parameters are
    exposed so they play nicely with <input type="range">.
  ───────────────────────────────────────────────────────────────*/
  const defs = [
    /* DRIVE / COLOR */
    { name:'Distortion',  C:Tone.Distortion,  params:['distortion','wet'],                                   defaults:{ distortion:0.4,  wet:0 } },
    { name:'BitCrusher',  C:Tone.BitCrusher,  params:['bits','wet'],                                         defaults:{ bits:4,          wet:0 } },
    { name:'Chebyshev',   C:Tone.Chebyshev,   params:['order','wet'],                                        defaults:{ order:50,        wet:0 } },

    /* MODULATION */
    { name:'Chorus',      C:Tone.Chorus,      params:['frequency','delayTime','depth','spread','wet'],       defaults:{ frequency:1.5,   delayTime:3.5, depth:0.5, spread:180, wet:0 } },
    { name:'Phaser',      C:Tone.Phaser,      params:['frequency','octaves','Q','baseFrequency','wet'],      defaults:{ frequency:0.5,   octaves:3, Q:10, baseFrequency:1000, wet:0 } },
    { name:'Tremolo',     C:Tone.Tremolo,     params:['frequency','depth','spread','wet'],                   defaults:{ frequency:5,     depth:0.5, spread:0, wet:0 } },
    { name:'Vibrato',     C:Tone.Vibrato,     params:['frequency','depth','wet'],                            defaults:{ frequency:5,     depth:0.1, wet:0 } },
    { name:'AutoWah',     C:Tone.AutoWah,     params:['baseFrequency','octaves','Q','sensitivity','wet'],    defaults:{ baseFrequency:200, octaves:2, Q:6, sensitivity:0, wet:0 } },
    { name:'AutoFilter',  C:Tone.AutoFilter,  params:['frequency','depth','baseFrequency','octaves','wet'],  defaults:{ frequency:1,     depth:1,  baseFrequency:200, octaves:2.6, wet:0 } },
    { name:'AutoPanner',  C:Tone.AutoPanner,  params:['frequency','depth','wet'],                            defaults:{ frequency:1,     depth:1, wet:0 } },

    /* AMBIENCE */
    { name:'Freeverb',    C:Tone.Freeverb,    params:['roomSize','dampening','wet'],                         defaults:{ roomSize:0.7,    dampening:3000,  wet:0 } },
    { name:'Reverb',      C:Tone.Reverb,      params:['decay','preDelay','wet'],                             defaults:{ decay:1.5,       preDelay:0.01,  wet:0 } },
    { name:'Convolver',   C:Tone.Convolver,   params:['wet'],                                               defaults:{ wet:0 } },

    /* DELAY / TIME */
    { name:'PingPongDelay', C:Tone.PingPongDelay, params:['delayTime','feedback','wet'],                     defaults:{ delayTime:0.25,  feedback:0.4, wet:0 } },
    { name:'FeedbackDelay', C:Tone.FeedbackDelay, params:['delayTime','feedback','wet'],                    defaults:{ delayTime:0.3,   feedback:0.5, wet:0 } },
    { name:'PitchShift',    C:Tone.PitchShift,    params:['pitch','windowSize','delayTime','feedback','wet'],defaults:{ pitch:0,         windowSize:0.1, delayTime:0, feedback:0, wet:0 } },

    /* STEREO & WIDTH */
    { name:'StereoWidener', C:Tone.StereoWidener, params:['width','wet'],                                    defaults:{ width:0,         wet:0 } },

    /* EQ & DYNAMICS */
    { name:'EQ3',        C:Tone.EQ3,          params:['low','mid','high','lowFrequency','highFrequency'],   defaults:{ low:0, mid:0, high:0, lowFrequency:400, highFrequency:2500 } },
    { name:'Compressor', C:Tone.Compressor,   params:['threshold','ratio','attack','release','knee'],       defaults:{ threshold:-24,   ratio:12, attack:0.003, release:0.25, knee:30 } },
    { name:'Limiter',    C:Tone.Limiter,      params:['threshold'],                                         defaults:{ threshold:-1 } }
  ];

  /*─────────────────────────────────────────────────────────*/
  /*  Build effect instances & UI                          */
  /*─────────────────────────────────────────────────────────*/
  const effects = defs.map(({ name, C, params, defaults }) => ({ name, params, fx: new C(defaults) }));
  buildUI();

  /*─────────────────────────────────────────────────────────*/
  /*  Audio routing on user gesture                         */
  /*─────────────────────────────────────────────────────────*/
  startBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    try { await mic.open(); }
    catch(err){ console.warn('Mic permission denied:', err); return; }
    startBtn.disabled = true;

    let node = mic;
    effects.forEach(({ fx }) => { node.connect(fx); node = fx; });
    node.toDestination();
  });

  /*─────────────────────────────────────────────────────────*/
  /*  UI builder                                            */
  /*─────────────────────────────────────────────────────────*/
  function buildUI(){
    effects.forEach(({ name, fx, params }) => {
      const card = document.createElement('div');
      card.className = 'effect-card';
      card.innerHTML = `<h3>${name}</h3>`;

      params.forEach(p => {
        if(!(p in fx)) return; // skip non‑existent params/boolean etc.
        const current = (typeof fx[p] === 'object' && 'value' in fx[p]) ? fx[p].value : fx[p];

        const label  = document.createElement('label');
        label.textContent = p;
        const slider = document.createElement('input');
        slider.type  = 'range';
        slider.min   = minVal(p);
        slider.max   = maxVal(p);
        slider.step  = stepVal(p);
        slider.value = current;
        slider.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          if(typeof fx[p]==='object' && 'value' in fx[p]) fx[p].value = v; else fx[p] = v;
        });
        label.appendChild(slider);
        card.appendChild(label);
      });
      container.appendChild(card);
    });
  }

  /*─────────────────────────────────────────────────────────*/
  /*  Slider heuristics                                     */
  /*─────────────────────────────────────────────────────────*/
  function minVal(p){
    switch(p){
      case 'wet': case 'depth': case 'distortion': case 'feedback': case 'width': return 0;
      case 'bits': return 1;
      case 'order': return 1;
      case 'delayTime': case 'windowSize': return 0;
      case 'frequency': case 'baseFrequency': case 'lowFrequency': case 'highFrequency': return 0;
      case 'low': case 'mid': case 'high': return -24;
      case 'pitch': return -24;
      case 'threshold': return -60;
      default: return 0;
    }
  }
  function maxVal(p){
    switch(p){
      case 'wet': case 'depth': case 'distortion': case 'feedback': case 'width': return 1;
      case 'bits': return 16;
      case 'order': return 100;
      case 'delayTime': return 1.5;
      case 'windowSize': return 1;
      case 'frequency': return 20;
      case 'baseFrequency': return 5000;
      case 'lowFrequency': return 1000;
      case 'highFrequency': return 10000;
      case 'low': case 'mid': case 'high': return 24;
      case 'pitch': return 24;
      case 'threshold': return 0;
      case 'roomSize': return 1;
      case 'dampening': return 6000;
      case 'spread': return 360;
      case 'ratio': return 20;
      case 'attack': case 'release': case 'decay': case 'preDelay': return 1;
      case 'Q': return 20;
      case 'octaves': return 6;
      case 'sensitivity': return 100;
      default: return 10;
    }
  }
  function stepVal(p){
    const span = maxVal(p)-minVal(p);
    return span<=1 ? 0.01 : span<=10 ? 0.1 : 1;
  }
});

