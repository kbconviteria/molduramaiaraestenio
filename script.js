const telaInicial = document.getElementById("tela-inicial");
const app = document.getElementById("app");
const btnAbrir = document.getElementById("btn-abrir");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const btnFoto = document.getElementById("btn-foto");
const btnRefazer = document.getElementById("btn-refazer");
const btnSalvar = document.getElementById("btn-salvar");
const btnTrocar = document.getElementById("btn-trocar");

let stream;
let usandoFrontal = true;

// Abrir câmera
btnAbrir.addEventListener("click", async () => {
  telaInicial.classList.add("hidden");
  app.classList.remove("hidden");
  await iniciarCamera();
});

// Iniciar câmera
async function iniciarCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: { facingMode: usandoFrontal ? "user" : "environment" }
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (err) {
    alert("Erro ao acessar a câmera: " + err);
  }
}

// Tirar foto
btnFoto.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const moldura = document.getElementById("moldura");
  ctx.drawImage(moldura, 0, 0, canvas.width, canvas.height);
});

// Refazer foto
btnRefazer.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Salvar foto
btnSalvar.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "foto.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Trocar câmera
btnTrocar.addEventListener("click", () => {
  usandoFrontal = !usandoFrontal;
  iniciarCamera();
});
