const controls = document.getElementById('controls');
const btnFoto   = document.getElementById('btn-foto');
const btnSalvar = document.getElementById('btn-salvar');
const btnRefazer= document.getElementById('btn-refazer');

// Mostra apenas o botão Foto
function mostrarSoFoto() {
  controls.classList.remove('controls--double');
  controls.classList.add('controls--single');
  btnFoto.classList.remove('hide');
  btnSalvar.classList.add('hide');
  btnRefazer.classList.add('hide');
}

// Mostra Salvar e Refazer
function mostrarSalvarRefazer() {
  controls.classList.remove('controls--single');
  controls.classList.add('controls--double');
  btnFoto.classList.add('hide');
  btnSalvar.classList.remove('hide');
  btnRefazer.classList.remove('hide');
}

// Ao clicar em Foto
btnFoto?.addEventListener('click', () => {
  // Aqui entra a lógica para capturar foto (webcam/canvas/etc.)
  console.log("Foto tirada!");
  mostrarSalvarRefazer();
});

// Ao clicar em Salvar
btnSalvar?.addEventListener('click', () => {
  // Aqui entra a lógica para salvar a foto
  console.log("Foto salva!");
  mostrarSoFoto(); // volta ao início se quiser
});

// Ao clicar em Refazer
btnRefazer?.addEventListener('click', () => {
  // Aqui entra a lógica para limpar a foto/refazer
  console.log("Refazer!");
  mostrarSoFoto();
});

// Inicializa
mostrarSoFoto();
