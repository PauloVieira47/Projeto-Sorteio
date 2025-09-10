
    const channel = new BroadcastChannel('sorteio-channel');
    const $ = (s)=>document.querySelector(s);
    const num = $('#num');
    const name = $('#name');

    let rollingTimer = null;
    function startRolling(){
      clearInterval(rollingTimer);
      num.classList.add('rolling');
      let t = 0;
      rollingTimer = setInterval(()=>{
        const fake = String(Math.floor(Math.random()*10000)).padStart(4,'0');
        num.textContent = fake.split('').join(' ');
        t += 1;
        if(t > 30) clearInterval(rollingTimer);
      }, 40);
    }
    function stopRolling(){ clearInterval(rollingTimer); num.classList.remove('rolling'); }

    channel.onmessage = (e)=>{
      const { type, payload } = e.data || {};
      if(type === 'DRAW_START'){
        name.textContent = 'Sorteando…';
        startRolling();
      }
      if(type === 'DRAW_RESULT'){
        stopRolling();
        num.textContent = (payload.number||'#0000').replace('#','').split('').join(' ');
        name.textContent = payload.name || '—';
      }
      if(type === 'DRAW_REVEAL'){
        num.textContent = (payload.number||'#0000').replace('#','').split('').join(' ');
        name.textContent = payload.name || '—';
      }
    };