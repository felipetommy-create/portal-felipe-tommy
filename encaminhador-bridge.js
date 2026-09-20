/* Ponte restrita: roda na origem do painel, nunca dentro de web.whatsapp.com. */
(() => {
  'use strict';
  const protocol='ft-forward-bridge-v1',origin='https://web.whatsapp.com';
  const token=new URLSearchParams(location.hash.slice(1)).get('token');
  const sender=window.opener,status=document.getElementById('status');
  const say=text=>{status.textContent=text;};
  if(!sender||!token||!/^[a-zA-Z0-9-]{20,100}$/.test(token)){say('Abra esta janela pelo botão Iniciar do encaminhador.');return;}
  // Não deixa o identificador temporário visível no endereço/histórico.
  history.replaceState(null,'',location.pathname);
  const reply=data=>sender.postMessage({protocol,token,...data},origin);
  const idsOK=ids=>Array.isArray(ids)&&ids.length<=500&&ids.every(id=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id));
  let queue=Promise.resolve();
  window.addEventListener('message',event=>{
    const m=event.data;
    if(event.origin!==origin||event.source!==sender||m?.protocol!==protocol||m.token!==token)return;
    if(m.kind==='ping'){reply({kind:'ready'});return;}
    if(typeof m.id!=='string'||m.id.length>100)return;
    queue=queue.then(async()=>{
      try{
        if(!['load','sync'].includes(m.kind)||typeof m.slug!=='string'||!/^canal-[A-Za-z0-9%_-]{1,220}$/.test(m.slug))throw Error('Pedido de sincronização inválido.');
        const cfg=JSON.parse(localStorage.getItem('ft_sb_cfg')||'null');
        if(!cfg?.url||!cfg?.key)throw Error('Conecte o painel ao Supabase neste navegador e tente Iniciar novamente.');
        const base=new URL(cfg.url);
        if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Endereço Supabase do painel inválido.');
        if(new URL(m.project).origin!==base.origin)throw Error('O projeto do painel difere do código copiado. Copie um código novo.');
        const headers={apikey:cfg.key,Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'};
        let path='encaminhamentos?select=grupo_id&feito=eq.true&materia_slug=eq.'+encodeURIComponent(m.slug);
        const options={method:'GET',headers,signal:AbortSignal.timeout(12000)};
        if(m.kind==='sync'){
          if(!idsOK(m.ids)||!m.ids.length)throw Error('Destinos inválidos na sincronização.');
          path='encaminhamentos?on_conflict=materia_slug,grupo_id';
          options.method='POST';headers.Prefer='resolution=merge-duplicates,return=minimal';
          options.body=JSON.stringify([...new Set(m.ids)].map(id=>({materia_slug:m.slug,grupo_id:id,feito:true})));
        }
        say(m.kind==='load'?'Consultando progresso…':'Salvando progresso…');
        const response=await fetch(base.origin+'/rest/v1/'+path,options);
        if(!response.ok)throw Error('Supabase respondeu HTTP '+response.status+'. O encaminhador preservou o progresso local.');
        let rows=[];
        if(m.kind==='load'){
          const data=await response.json();
          if(!Array.isArray(data))throw Error('Resposta de progresso inválida.');
          rows=data.filter(r=>typeof r.grupo_id==='string').map(r=>({grupo_id:r.grupo_id}));
        }
        reply({kind:'result',id:m.id,ok:true,rows});say('Sincronizado. Deixe esta janela aberta durante os envios.');
      }catch(error){
        const message=error?.name==='TypeError'?'Não foi possível acessar o Supabase pelo painel. Confira a conexão do painel.':String(error.message||error);
        say(message);reply({kind:'result',id:m.id,ok:false,error:message});
      }
    });
  });
  reply({kind:'ready'});
})();
