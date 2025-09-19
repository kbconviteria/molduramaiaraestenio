const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const btnStart = document.getElementById('btnStart');
const startScr = document.getElementById('start');

const btnFlip   = document.getElementById('btnFlip');
const btnOrient = document.getElementById('btnOrient');
const btnShot   = document.getElementById('btnShot');
const btnAgain  = document.getElementById('btnAgain');
const btnSave   = document.getElementById('btnSave');

const shootArea  = document.getElementById('shootArea');
const resultArea = document.getElementById('resultArea');
const overlayImg = document.getElementById('overlay');

let stream, facing = 'environment', lastBlob = null;
let orientation = 'portrait'; // 'portrait' ou 'landscape'

const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
const isIOS     = /iPad|iPhone|iPod/i.test(ua);

/* mostra moldura inicial (retrato) */
checkAndSetOverlaySrc('portrait');

/* fluxo inicial */
async function openCameraFromStart() {
  if (startScr.classList.contains('busy')) return;
  startScr.classList.add('busy');
  try { await startCamera(); startScr.classList.add('hidden'); }
  catch { alert('Não foi possível acessar a câmera. Verifique permissões.'); }
  finally { startScr.classList.remove('busy'); }
}
btnStart.addEventListener('click', (ev) => { ev.stopPropagation(); openCameraFromStart(); });
startScr.addEventListener('click', openCameraFromStart);

/* alternar orientação */
btnOrient.addEventListener('click', async () => {
  orientation = (orientation === 'portrait') ? 'landscape' : 'portrait';
  await applyOrientationChange();
});

/* virar câmera */
btnFlip.addEventListener('click', async () => {
  facing = (facing === 'user') ? 'environment' : 'user';
  await startCamera();
});

/* aplicar troca de orientação */
async function applyOrientationChange(){
  await checkAndSetOverlaySrc(orientation);
  if (orientation === 'portrait') {
    canvas.width = 1080; canvas.height = 1920;
  } else {
    canvas.width = 1920; canvas.height = 1080;
  }
  await startCamera();
}

/* checa moldura conforme orientação */
async function checkAndSetOverlaySrc(mode){
  const candidates = (mode === 'portrait')
    ? ['moldura.png']
    : ['moldura-horizontal.png','moldura horizontal.png'];

  let found = null;
  for (const src of candidates){
    if (await headExists(src)) { found = src; break; }
  }

  if (found){
    overlayImg.src = found;
    overlayImg.classList.remove('hidden');
  } else {
    overlayImg.classList.add('hidden');
  }
}

/* câmera */
async function startCamera(){
  if (stream) stream.getTracks().forEach(t=>t.stop());
  const ar = (orientation === 'portrait') ? 9/16 : 16/9;
  const constraints = {
    audio:false,
    video:{
      facingMode: { ideal: facing },
      width:  { ideal: 1920 },
      height: { ideal: 1080 },
      aspectRatio: { ideal: ar }
    }
  };
  const newStream = await navigator.mediaDevices.getUserMedia(constraints);
  stream = newStream;
  video.srcObject = stream;
  video.classList.toggle('mirror', facing === 'user');
  await video.play();
}

/* tirar foto */
btnShot.addEventListener('click', async () => {
  if (!video.videoWidth) return;
  const W = canvas.width, H = canvas.height;
  const vw = video.videoWidth, vh = video.videoHeight;
  const videoRatio  = vw / vh;
  const canvasRatio = W / H;
  let sx, sy, sw, sh;
  if (canvasRatio > videoRatio){
    sw = vw; sh = vw / canvasRatio; sx = 0; sy = (vh - sh) / 2;
  } else {
    sh = vh; sw = vh * canvasRatio; sy = 0; sx = (vw - sw) / 2;
  }
  ctx.clearRect(0,0,W,H);
  if (facing === 'user') {
    ctx.save(); ctx.translate(W,0); ctx.scale(-1,1);
    ctx.drawImage(video, sx,sy,sw,sh, 0,0,W,H); ctx.restore();
  } else {
    ctx.drawImage(video, sx,sy,sw,sh, 0,0,W,H);
  }
  await drawOverlay(overlayImg, W, H);
  lastBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
  shootArea.classList.add('hidden');
  resultArea.classList.remove('hidden');
});

/* refazer */
btnAgain.addEventListener('click', () => {
  lastBlob = null;
  resultArea.classList.add('hidden');
  shootArea.classList.remove('hidden');
});

/* salvar (share → file picker → aba iOS → download) */
btnSave.addEventListener('click', async () => {
  if (!lastBlob) return;
  const filename = `foto-${Date.now()}.jpg`;

  if (navigator.canShare && window.File) {
    try {
      const file = new File([lastBlob], filename, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto com Moldura' });
        return;
      }
    } catch (e) {}
  }

  if (isAndroid && 'showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Imagem JPEG', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(lastBlob);
      await writable.close();
      return;
    } catch (e) {}
  }

  if (isIOS) {
    const url = URL.createObjectURL(lastBlob);
    const win = window.open(url, '_blank');
    if (!win) window.location.href = url;
    setTimeout(()=> URL.revokeObjectURL(url), 15000);
    return;
  }

  const url = URL.createObjectURL(lastBlob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.target = '_blank';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
});

/* utils */
function headExists(url){
  return fetch(url, { method:'HEAD' }).then(r => r.ok).catch(()=>false);
}
function drawOverlay(img, W, H){
  return new Promise((resolve)=>{
    if (!img || img.classList.contains('hidden')) return resolve();
    const tmp = new Image();
    tmp.onload = ()=>{ ctx.drawImage(tmp,0,0,W,H); resolve(); };
    tmp.onerror = ()=>resolve();
    tmp.src = img.src;
  });
}
