// elementos
const telaInicial   = document.getElementById('tela-inicial');
const app           = document.getElementById('app');
const video         = document.getElementById('video');
const canvas        = document.getElementById('canvas');
const ctx           = canvas.getContext('2d');
const molduraImg    = document.getElementById('moldura');

const btnTrocar     = document.getElementById('btn-trocar');
const btnFoto       = document.getElementById('btn-foto');
const btnRefazer    = document.getElementById('btn-refazer');
const btnSalvar     = document.getElementById('btn-salvar');

const acaoFoto      = document.getElementById('acao-foto');
const acaoResultado = document.getElementById('acao-resultado');

let stream = null;
let usandoFrontal = true;
let ultimaBlob = null;

// inicia app ao tocar na tela inicial (sem botão extra)
telaInicial.addEventListener('click', async () => {
  telaInicial.classList.add('hidden');
  app.classList.remove('hidden');
  await iniciarCamera();
});

// liga a câmera
async function iniciarCamera(){
  try{
    if(stream) stream.getTracks().forEach(t => t.stop());

    stream = await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode: usandoFrontal ? 'user' : 'environment',
        width: { ideal: 1080 },
        height:{ ideal: 1920 }
      }
    });

    video.srcObject = stream;
    await video.play();

    // garante estado inicial dos botões
    acaoResultado.classList.add('hidden');
    acaoFoto.classList.remove('hidden');
    canvas.classList.add('hidden');
  }catch(e){
    alert('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
    console.error(e);
  }
}

// trocar câmera
btnTrocar.addEventListener('click', async ()=>{
  usandoFrontal = !usandoFrontal;
  await iniciarCamera();
});

// tirar foto (faz "cover" no canvas 1080x1920)
btnFoto.addEventListener('click', async ()=>{
  const W = canvas.width  = 1080;
  const H = canvas.height = 1920;

  const vw = video.videoWidth, vh = video.videoHeight;
  if(!vw || !vh) return;

  const videoRatio  = vw / vh;
  const canvasRatio = W / H;

  let sx, sy, sw, sh;
  if(canvasRatio > videoRatio){
    sw = vw;
    sh = vw / canvasRatio;
    sx = 0;
    sy = (vh - sh) / 2;
  }else{
    sh = vh;
    sw = vh * canvasRatio;
    sy = 0;
    sx = (vw - sw) / 2;
  }

  ctx.clearRect(0,0,W,H);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);

  // sobrepõe a moldura
  await desenharOverlay(molduraImg, W, H);

  // guarda para salvar
  ultimaBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));

  canvas.classList.remove('hidden');
  acaoFoto.classList.add('hidden');
  acaoResultado.classList.remove('hidden');
});

// refazer
btnRefazer.addEventListener('click', ()=>{
  ultimaBlob = null;
  canvas.classList.add('hidden');
  acaoResultado.classList.add('hidden');
  acaoFoto.classList.remove('hidden');
});

// salvar (share se possível, senão download)
btnSalvar.addEventListener('click', async ()=>{
  if(!ultimaBlob) return;

  const arquivo = new File([ultimaBlob], `foto-${Date.now()}.jpg`, { type:'image/jpeg' });

  try{
    if(navigator.canShare && navigator.canShare({ files:[arquivo] })){
      await navigator.share({ files:[arquivo], title:'Foto com Moldura' });
      return;
    }
  }catch(_){/* usuário pode cancelar o share */}

  const url = URL.createObjectURL(ultimaBlob);
  const a = document.createElement('a');
  a.href = url; a.download = arquivo.name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// util para desenhar a moldura garantindo que carregou
function desenharOverlay(img, W, H){
  return new Promise((resolve)=>{
    if(!img || !img.src) return resolve();
    const tmp = new Image();
    tmp.onload  = ()=>{ ctx.drawImage(tmp, 0, 0, W, H); resolve(); };
    tmp.onerror = ()=>resolve();
    tmp.src = img.src;
  });
}
