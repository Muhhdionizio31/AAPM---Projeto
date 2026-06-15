function abrirModalNovo() {
  const modal = document.getElementById('modal');
  const titulo = document.getElementById('modalTitulo');
  const form = document.getElementById('formCliente');

  if (!modal || !titulo || !form) {
    return;
  }

  titulo.textContent = 'Novo Cliente';
  form.action = '/clientes/novo';

  document.getElementById('inputNome').value = '';
  document.getElementById('inputMatricula').value = '';
  document.getElementById('inputTelefone').value = '';
  document.getElementById('inputAssociado').checked = false;

  modal.classList.add('aberto');
}

function abrirModalEditar(id, nome, matricula, telefone, associado) {
  const modal = document.getElementById('modal');
  const titulo = document.getElementById('modalTitulo');
  const form = document.getElementById('formCliente');

  if (!modal || !titulo || !form) {
    return;
  }

  titulo.textContent = 'Editar Cliente';
  form.action = `/clientes/${id}/editar`;

  document.getElementById('inputNome').value = nome || '';
  document.getElementById('inputMatricula').value = matricula || '';
  document.getElementById('inputTelefone').value = telefone || '';
  document.getElementById('inputAssociado').checked = associado === true;

  modal.classList.add('aberto');
}

function fecharModal() {
  const modal = document.getElementById('modal');

  if (modal) {
    modal.classList.remove('aberto');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('modal');

  if (!modal) {
    return;
  }

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      fecharModal();
    }
  });
});