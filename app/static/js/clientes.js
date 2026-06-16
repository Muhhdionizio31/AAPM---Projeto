function abrirModalNovo() {
  const modal = document.getElementById('modal');
  const titulo = document.getElementById('modalTitulo');
  const form = document.getElementById('formCliente');

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

  titulo.textContent = 'Editar Cliente';
  form.action = `/clientes/${id}/editar`;

  document.getElementById('inputNome').value = nome || '';
  document.getElementById('inputMatricula').value = matricula || '';
  document.getElementById('inputTelefone').value = telefone || '';
  document.getElementById('inputAssociado').checked = associado === true;

  modal.classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('aberto');
}

const modalCliente = document.getElementById('modal');

if (modalCliente) {
  modalCliente.addEventListener('click', function (event) {
    if (event.target === modalCliente) {
      fecharModal();
    }
  });
}