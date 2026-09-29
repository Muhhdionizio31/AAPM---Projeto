/* =========================================================
   AAPM SENAI — Clientes e Associados
   Interações: Modais (Novo, Editar, Ver Detalhes, Toggle Ativo,
   Excluir), Busca/Filtros dinâmicos, Toasts e Validações.
   ========================================================= */

/* ---------------------------------------------------------
   Utilitários de Modal
--------------------------------------------------------- */
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.error('Modal não encontrado:', id);
    return;
  }
  modal.style.setProperty('display', 'flex', 'important');
  modal.classList.add('visivel');
  modal.classList.add('aberto');
  document.body.classList.add('modal-aberto-body');
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.setProperty('display', 'none', 'important');
  modal.classList.remove('visivel');
  modal.classList.remove('aberto');
  document.body.classList.remove('modal-aberto-body');
}

function fecharModalFora(event, id) {
  if (event && event.target && event.target.id === id) {
    fecharModal(id);
  }
}

/* ---------------------------------------------------------
   Menu Mobile
--------------------------------------------------------- */
function abrirMenuMobile() {
  const lateral = document.getElementById('barraLateral');
  const sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.add('aberta');
  if (sobreposicao) sobreposicao.classList.add('visivel');
}

function fecharMenuMobile() {
  const lateral = document.getElementById('barraLateral');
  const sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.remove('aberta');
  if (sobreposicao) sobreposicao.classList.remove('visivel');
}

/* ---------------------------------------------------------
   Toast de feedback
--------------------------------------------------------- */
let toastTimeout;
function mostrarToast(mensagem, tipo = 'sucesso') {
  const toast = document.getElementById('toast');
  const texto = document.getElementById('toastTexto');
  if (!toast || !texto) return;

  texto.textContent = mensagem;
  toast.classList.toggle('erro', tipo === 'erro');
  toast.classList.add('visivel');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visivel');
  }, 4000);
}

/* ---------------------------------------------------------
   Modal: Novo Cliente
--------------------------------------------------------- */
function abrirModalNovo() {
  const form = document.getElementById('formNovoCliente');
  if (form) {
    form.reset();
    const campoNome = document.getElementById('campoNomeNovo');
    if (campoNome) campoNome.classList.remove('invalido');
  }
  abrirModal('modalNovoSobreposicao');
  setTimeout(() => {
    const input = document.getElementById('nomeNovo');
    if (input) input.focus();
  }, 100);
}

function fecharModalNovo() {
  fecharModal('modalNovoSobreposicao');
}

function fecharModalNovoClique(event) {
  fecharModalFora(event, 'modalNovoSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Editar Cliente
--------------------------------------------------------- */
function abrirModalEditar(id, nome, matricula, telefone, associado) {
  const form = document.getElementById('formEditarCliente');
  if (!form) return;

  const inputId = document.getElementById('editarClienteId');
  const inputNome = document.getElementById('editarNome');
  const inputMatricula = document.getElementById('editarMatricula');
  const inputTelefone = document.getElementById('editarTelefone');
  const inputAssociado = document.getElementById('editarAssociado');

  if (inputId) inputId.value = id;
  if (inputNome) inputNome.value = nome || '';
  if (inputMatricula) inputMatricula.value = (matricula && matricula !== 'Nao informada' && matricula !== '-') ? matricula : '';
  if (inputTelefone) inputTelefone.value = (telefone && telefone !== 'Nao informado' && telefone !== '-') ? telefone : '';
  if (inputAssociado) inputAssociado.checked = (associado === true || associado === 'true');

  form.action = '/clientes/' + encodeURIComponent(id) + '/editar';
  abrirModal('modalEditarSobreposicao');

  setTimeout(() => {
    if (inputNome) inputNome.focus();
  }, 100);
}

function fecharModalEditar() {
  fecharModal('modalEditarSobreposicao');
}

function fecharModalEditarClique(event) {
  fecharModalFora(event, 'modalEditarSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Detalhe do Cliente ("Ver")
--------------------------------------------------------- */
function abrirModalVer(dados) {
  if (!dados) return;
  const { id, nome, matricula, telefone, associado, ativo, vendasQtd } = dados;

  const titulo = document.getElementById('detalheClienteTitulo');
  const sub = document.getElementById('detalheClienteSub');
  const conteudo = document.getElementById('conteudoDetalheCliente');

  if (titulo) titulo.textContent = nome || 'Cliente';
  if (sub) sub.textContent = (associado === true || associado === 'true') ? 'Associado AAPM SENAI' : 'Cliente Comum / Aluno';

  const isAssoc = (associado === true || associado === 'true');
  const isAtivo = (ativo === true || ativo === 'true');

  let html = `
    <div class="detalhe-grade">
      <div class="detalhe-item">
        <span class="detalhe-label">Tipo de Cadastro</span>
        <span class="chip-status ${isAssoc ? 'verde' : 'cinza'}">${isAssoc ? '⭐ Associado AAPM' : 'Cliente Comum'}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Status</span>
        <span class="chip-status ${isAtivo ? 'verde' : 'cinza'}">${isAtivo ? '🟢 Ativo' : '⚪ Inativo'}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Matrícula</span>
        <span class="detalhe-valor">${(matricula && matricula !== '-') ? matricula : 'Não informada'}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Telefone / Contato</span>
        <span class="detalhe-valor">${(telefone && telefone !== '-') ? telefone : 'Não informado'}</span>
      </div>
      <div class="detalhe-item detalhe-item-completo">
        <span class="detalhe-label">Histórico de Compras</span>
        <span class="detalhe-valor">${vendasQtd || 0} venda(s) realizada(s)</span>
      </div>
    </div>
  `;

  if (conteudo) conteudo.innerHTML = html;

  const btnEditarRapido = document.getElementById('btnDetalheEditar');
  if (btnEditarRapido) {
    btnEditarRapido.onclick = function() {
      fecharModalDetalhe();
      abrirModalEditar(id, nome, matricula, telefone, associado);
    };
  }

  abrirModal('modalDetalheCliente');
}

function fecharModalDetalhe() {
  fecharModal('modalDetalheCliente');
}

function fecharModalDetalheClique(event) {
  fecharModalFora(event, 'modalDetalheCliente');
}

/* ---------------------------------------------------------
   Modal: Confirmar Desativar / Reativar
--------------------------------------------------------- */
function abrirModalToggle(id, nome, acao) {
  const form = document.getElementById('formToggleCliente');
  if (!form) return;

  const inputId = document.getElementById('toggleClienteId');
  if (inputId) inputId.value = id;

  const titulo = document.getElementById('modalToggleTitulo');
  const msg = document.getElementById('modalToggleMensagem');

  const isDesativar = (acao === 'desativar');
  if (titulo) {
    titulo.textContent = isDesativar ? 'Desativar Cliente' : 'Reativar Cliente';
  }
  if (msg) {
    msg.textContent = isDesativar
      ? `Deseja desativar o cadastro de "${nome}"? Ele não aparecerá como opção ativa em novas vendas ou armários.`
      : `Deseja reativar o cadastro de "${nome}"? Ele voltará a ficar disponível no sistema.`;
  }

  form.action = '/clientes/' + encodeURIComponent(id) + '/toggle-ativo';
  abrirModal('modalToggleSobreposicao');
}

function fecharModalToggle() {
  fecharModal('modalToggleSobreposicao');
}

function fecharModalToggleClique(event) {
  fecharModalFora(event, 'modalToggleSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Confirmar Excluir Cliente
--------------------------------------------------------- */
function abrirModalExcluir(id, nome) {
  const form = document.getElementById('formExcluirCliente');
  if (!form) return;

  const inputId = document.getElementById('excluirClienteId');
  if (inputId) inputId.value = id;

  const titulo = document.getElementById('modalExcluirTitulo');
  if (titulo) {
    titulo.textContent = `Excluir "${nome}"?`;
  }

  const msg = document.getElementById('modalExcluirMensagem');
  if (msg) {
    msg.textContent = `O cadastro de "${nome}" será excluído permanentemente. Esta ação não poderá ser desfeita. (Nota: Se o cliente possuir vendas vinculadas, ele não poderá ser excluído, apenas desativado).`;
  }

  form.action = '/clientes/' + encodeURIComponent(id) + '/excluir';
  abrirModal('modalExcluirSobreposicao');
}

function fecharModalExcluir() {
  fecharModal('modalExcluirSobreposicao');
}

function fecharModalExcluirClique(event) {
  fecharModalFora(event, 'modalExcluirSobreposicao');
}

/* ---------------------------------------------------------
   Helpers para cliques em botões
--------------------------------------------------------- */
function abrirModalVerBtn(btn) {
  if (!btn) return;
  const b = btn.closest('button') || btn;
  abrirModalVer({
    id: b.getAttribute('data-id'),
    nome: b.getAttribute('data-nome'),
    matricula: b.getAttribute('data-matricula'),
    telefone: b.getAttribute('data-telefone'),
    associado: b.getAttribute('data-associado') === 'true',
    ativo: b.getAttribute('data-ativo') === 'true',
    vendasQtd: b.getAttribute('data-vendas-qtd') || '0'
  });
}

function abrirModalEditarBtn(btn) {
  if (!btn) return;
  const b = btn.closest('button') || btn;
  abrirModalEditar(
    b.getAttribute('data-id'),
    b.getAttribute('data-nome'),
    b.getAttribute('data-matricula'),
    b.getAttribute('data-telefone'),
    b.getAttribute('data-associado') === 'true'
  );
}

function abrirModalToggleBtn(btn) {
  if (!btn) return;
  const b = btn.closest('button') || btn;
  const id = b.getAttribute('data-id');
  const nome = b.getAttribute('data-nome');
  const acao = b.getAttribute('data-acao') || 'desativar';
  abrirModalToggle(id, nome, acao);
}

function abrirModalExcluirBtn(btn) {
  if (!btn) return;
  const b = btn.closest('button') || btn;
  abrirModalExcluir(b.getAttribute('data-id'), b.getAttribute('data-nome'));
}

/* ---------------------------------------------------------
   Expor funções no escopo global (Window)
--------------------------------------------------------- */
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.fecharModalFora = fecharModalFora;
window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;
window.mostrarToast = mostrarToast;
window.abrirModalNovo = abrirModalNovo;
window.fecharModalNovo = fecharModalNovo;
window.fecharModalNovoClique = fecharModalNovoClique;
window.abrirModalEditar = abrirModalEditar;
window.fecharModalEditar = fecharModalEditar;
window.fecharModalEditarClique = fecharModalEditarClique;
window.abrirModalVer = abrirModalVer;
window.fecharModalDetalhe = fecharModalDetalhe;
window.fecharModalDetalheClique = fecharModalDetalheClique;
window.abrirModalToggle = abrirModalToggle;
window.fecharModalToggle = fecharModalToggle;
window.fecharModalToggleClique = fecharModalToggleClique;
window.abrirModalExcluir = abrirModalExcluir;
window.fecharModalExcluir = fecharModalExcluir;
window.fecharModalExcluirClique = fecharModalExcluirClique;
window.abrirModalVerBtn = abrirModalVerBtn;
window.abrirModalEditarBtn = abrirModalEditarBtn;
window.abrirModalToggleBtn = abrirModalToggleBtn;
window.abrirModalExcluirBtn = abrirModalExcluirBtn;

/* ---------------------------------------------------------
   Data atual no cabeçalho
--------------------------------------------------------- */
function exibirDataAtual() {
  const elemento = document.getElementById('dataAtual');
  if (!elemento) return;
  const hoje = new Date();
  elemento.textContent = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

/* ---------------------------------------------------------
   Inicialização e Eventos
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  exibirDataAtual();

  // Feedback via URL Search Params
  const params = new URLSearchParams(window.location.search);
  if (params.get('criado') === 'ok') {
    mostrarToast('Cliente cadastrado com sucesso!', 'sucesso');
  } else if (params.get('editado') === 'ok') {
    mostrarToast('Cliente atualizado com sucesso!', 'sucesso');
  } else if (params.get('desativado') === 'ok') {
    mostrarToast('Cliente desativado com sucesso.', 'sucesso');
  } else if (params.get('reativado') === 'ok') {
    mostrarToast('Cliente reativado com sucesso!', 'sucesso');
  } else if (params.get('excluido') === 'ok') {
    mostrarToast('Cliente excluído com sucesso!', 'sucesso');
  } else if (params.get('erro') === 'matricula_duplicada') {
    mostrarToast('Já existe um cliente cadastrado com essa matrícula.', 'erro');
  } else if (params.get('erro') === 'possui_vendas') {
    mostrarToast('Não é possível excluir um cliente que possui vendas. Em vez disso, desative-o.', 'erro');
  } else if (params.get('erro') === 'nao_encontrado') {
    mostrarToast('Cliente não encontrado.', 'erro');
  } else if (params.get('erro')) {
    mostrarToast('Ocorreu um erro na operação.', 'erro');
  }

  /* ---------- Validação no submit do formulário Novo ---------- */
  const formNovo = document.getElementById('formNovoCliente');
  if (formNovo) {
    formNovo.addEventListener('submit', (evento) => {
      const nome = document.getElementById('nomeNovo');
      const campoNome = document.getElementById('campoNomeNovo');
      if (!nome || !nome.value.trim()) {
        evento.preventDefault();
        if (campoNome) campoNome.classList.add('invalido');
        if (nome) nome.focus();
      }
    });
  }

  /* ---------- Busca e filtro por status na tabela (client-side) ---------- */
  const busca = document.getElementById('buscaCliente');
  const grupoFiltroTipo = document.getElementById('grupoFiltroTipo');
  const tabela = document.getElementById('tabelaClientes');
  const estadoVazio = document.getElementById('estadoVazio');
  const estadoVazioTitulo = document.getElementById('estadoVazioTitulo');
  const estadoVazioSub = document.getElementById('estadoVazioSub');

  const todasLinhas = tabela ? Array.from(tabela.querySelectorAll('tr')) : [];
  let tipoAtivo = '';

  function filtrarTabela() {
    const termo = (busca && busca.value ? busca.value : '').toLowerCase().trim();
    let visiveis = 0;

    todasLinhas.forEach((linha) => {
      const tipoLinha = linha.getAttribute('data-tipo') || '';
      const textoLinha = linha.textContent.toLowerCase();

      const matchTipo = !tipoAtivo || tipoLinha === tipoAtivo;
      const matchTexto = !termo || textoLinha.includes(termo);

      if (matchTipo && matchTexto) {
        linha.style.display = '';
        visiveis++;
      } else {
        linha.style.display = 'none';
      }
    });

    if (estadoVazio) {
      if (todasLinhas.length === 0) {
        if (estadoVazioTitulo) estadoVazioTitulo.textContent = 'Nenhum cliente cadastrado';
        if (estadoVazioSub) estadoVazioSub.textContent = 'Clique em "+ Novo Cliente" para começar.';
        estadoVazio.style.display = 'flex';
      } else if (visiveis === 0) {
        if (estadoVazioTitulo) estadoVazioTitulo.textContent = 'Nenhum resultado encontrado';
        if (estadoVazioSub) estadoVazioSub.textContent = 'Tente ajustar a busca ou o filtro.';
        estadoVazio.style.display = 'flex';
      } else {
        estadoVazio.style.display = 'none';
      }
    }
  }

  if (busca) {
    busca.addEventListener('input', filtrarTabela);
  }

  if (grupoFiltroTipo) {
    grupoFiltroTipo.addEventListener('click', (event) => {
      const botao = event.target.closest('.btn-filtro');
      if (!botao) return;
      grupoFiltroTipo.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      tipoAtivo = botao.getAttribute('data-tipo') || '';
      filtrarTabela();
    });
  }

  /* ---------- Fecha modais com a tecla ESC ---------- */
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharModalNovo();
      fecharModalEditar();
      fecharModalDetalhe();
      fecharModalToggle();
      fecharModalExcluir();
    }
  });

  /* ---------- Event Delegation como fallback universal para botões ---------- */
  document.addEventListener('click', function(e) {
    const btnVer = e.target.closest('.btn-abrir-ver');
    if (btnVer) {
      e.preventDefault();
      abrirModalVerBtn(btnVer);
      return;
    }
    const btnEditar = e.target.closest('.btn-editar');
    if (btnEditar) {
      e.preventDefault();
      abrirModalEditarBtn(btnEditar);
      return;
    }
    const btnToggle = e.target.closest('.btn-toggle-desativar, .btn-toggle-ativar');
    if (btnToggle) {
      e.preventDefault();
      abrirModalToggleBtn(btnToggle);
      return;
    }
    const btnExcluir = e.target.closest('.btn-excluir');
    if (btnExcluir) {
      e.preventDefault();
      abrirModalExcluirBtn(btnExcluir);
      return;
    }
  });
});