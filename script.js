const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const btnFlip  = document.getElementById('btnFlip');
const btnShot  = document.getElementById('btnShot');
const btnAgain = document.getElementById('btnAgain');
const btnSave  = document.getElementById('btnSave');

const shootArea  = document.getElementById('shootArea');
const resultArea = document.getElementById('resultArea');
const overlayImg = document.getElementById('overlay');

let stream, facing = 'environment';
let lastBlob = null;

// exibe moldura se existir
fetch('moldura.png', { method:'HEAD' })
  .then(r => { if (r.ok) overlayImg.classList.remove('hidden'); })
  .catch(()=>{});

init();

// ---------- câmera ----------
async function init(){
  await startCamera();
}

async function startCamera(){
  if (stream) stream.getTracks().forEach(t=>t.stop());

  const constraints = {
    audio:false,
    video:{
      facingMode: { ideal: facing },
      width: { ideal: 1920 },
      height:{ ideal: 1080 },
      aspectRatio: { ideal: 9/16 },
      frameRate: { ideal: 30 }
    }
  };

  try{
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();
  }catch(err){
    alert('Permita o acesso à câmera para continuar.');
    console.error(err);
  }
}

// virar câmera
btnFlip.onclick = async () => {
  facing = (facing === 'user') ? 'environment' : 'user';
  await startCamera();
};

// ---------- foto ----------
btnShot.onclick = async () => {
  if (!video.videoWidth) return;

  const W = canvas.width;   // 1080
  const H = canvas.height;  // 1920

  // "cover" no canvas (sem tarja)
  const vw = video.videoWidth, vh = video.videoHeight;
  const videoRatio = vw / vh;
  const canvasRatio = W / H;

  let sx, sy, sw, sh;
  if (canvasRatio > videoRatio){
    sw = vw;
    sh = vw / canvasRatio;
    sx = 0;
    sy = (vh - sh) / 2;
  } else {
    sh = vh;
    sw = vh * canvasRatio;
    sy = 0;
    sx = (vw - sw) / 2;
  }

  ctx.clearRect(0,0,W,H);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);

  // sobrepor moldura se tiver
  await drawOverlay(overlayImg, W, H);

  lastBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));

  shootArea.classList.add('hidden');
  resultArea.classList.remove('hidden');
};

// refazer
btnAgain.onclick = ()=>{
  lastBlob = null;
  resultArea.classList.add('hidden');
  shootArea.classList.remove('hidden');
};

// salvar
btnSave.onclick = async ()=>{
  if (!lastBlob) return;

  // 1) tenta compartilhar (Android mostra opção "Fotos/Galeria")
  const file = new File([lastBlob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
  try{
    if (navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title:'Foto com Moldura' });
      return; // já foi para a galeria/app escolhida
    }
  }catch(e){
    // se o usuário cancelar o share, continua para o download
    console.warn('share cancelado/indisponível', e);
  }

  // 2) fallback: download
  const url = URL.createObjectURL(lastBlob);
  const a = document.createElement('a');
  a.href = url; a.download = `foto-${Date.now()}.jpg`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

// util
function drawOverlay(img, W, H){
  return new Promise((resolve)=>{
    if (img.classList.contains('hidden')) return resolve();
    const tmp = new Image();
    tmp.onload = ()=>{ ctx.drawImage(tmp, 0, 0, W, H); resolve(); };
    tmp.onerror = ()=>resolve();
    tmp.src = img.src;
  });
}
