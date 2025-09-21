const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const btnStart = document.getElementById('btnStart');
const startScr = document.getElementById('start');

const btnFlip  = document.getElementById('btnFlip');
const btnShot  = document.getElementById('btnShot');
const btnAgain = document.getElementById('btnAgain');
const btnSave  = document.getElementById('btnSave');

const shootArea  = document.getElementById('shootArea');
const resultArea = document.getElementById('resultArea');
const overlayImg = document.getElementById('overlay');

let stream, facing = 'environment';
let lastBlob = null;

const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
const isIOS = /iPad|iPhone|iPod/i.test(ua);
const isInApp = /(FBAN|FBAV|Instagram|Line|Twitter|Snapchat|TikTok)/i.test(ua);

/* mostra moldura se existir */
fetch('moldura.png', { method:'HEAD' })
  .then(r => { if (r.ok) overlayImg.classList.remove('hidden'); })
  .catch(()=>{});

/* fluxo inicial */
async function openCameraFromStart() {
  if (startScr.classList.contains('busy')) return;
  startScr.classList.add('busy');
  try {
    await startCamera();
    startScr.classList.add('hidden');
  } catch (e) {
    alert('Não foi possível acessar a câmera. Verifique permissões.');
  } finally {
    startScr.classList.remove('busy');
  }
}
btnStart.addEventListener('click', (ev) => { ev.stopPropagation(); openCameraFromStart(); });
startScr.addEventListener('click', openCameraFromStart);

/* câmera */
async function startCamera(){
  if (stream) stream.getTracks().forEach(t=>t.stop());
  const constraints = {
    audio:false,
    video:{
      facingMode: { ideal: facing },
      width: { ideal: 1920 },
      height:{ ideal: 1080 },
      aspectRatio: { ideal: 9/16 }
    }
  };
  const newStream = await navigator.mediaDevices.getUserMedia(constraints);
  stream = newStream;
  video.srcObject = stream;
  video.classList.toggle('mirror', facing === 'user');
  await video.play();
}
btnFlip.onclick = async () => {
  facing = (facing === 'user') ? 'environment' : 'user';
  await startCamera();
};

/* tirar foto */
btnShot.onclick = async () => {
  if (!video.videoWidth) return;
  const W = canvas.width, H = canvas.height;
  const vw = video.videoWidth, vh = video.videoHeight;
  const videoRatio = vw / vh, canvasRatio = W / H;
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
};

/* refazer */
btnAgain.onclick = ()=>{
  lastBlob = null;
  resultArea.classList.add('hidden');
  shootArea.classList.remove('hidden');
};

/* salvar */
btnSave.onclick = async ()=>{
  if (!lastBlob) return;
  const filename = `foto-${Date.now()}.jpg`;

  const doDownload = () => {
    const url = URL.createObjectURL(lastBlob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  if (isInApp && navigator.canShare && window.File) {
    try {
      const file = new File([lastBlob], filename, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto' });
        return;
      }
    } catch {}
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
    } catch {}
  }

  if (navigator.canShare && window.File) {
    try {
      const file = new File([lastBlob], filename, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto' });
        return;
      }
    } catch {}
  }

  if (isIOS) {
    const url = URL.createObjectURL(lastBlob);
    const win = window.open(url, '_blank');
    if (!win) window.location.href = url;
    setTimeout(()=> URL.revokeObjectURL(url), 15000);
    return;
  }

  doDownload();
};

/* util */
function drawOverlay(img, W, H){
  return new Promise((resolve)=>{
    if (!img || img.classList.contains('hidden')) return resolve();
    const tmp = new Image();
    tmp.onload = ()=>{ ctx.drawImage(tmp,0,0,W,H); resolve(); };
    tmp.onerror = ()=>resolve();
    tmp.src = img.src;
  });
}
