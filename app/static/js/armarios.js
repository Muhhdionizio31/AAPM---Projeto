/* =========================================================
   AAPM SENAI — Armários
   Toda a interação (abrir/fechar modais, cadastrar, alugar,
   editar, desativar/reativar, excluir, liberar, ver detalhes)
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
   Modal: Novo Armário
--------------------------------------------------------- */
function abrirModalNovo() {
  const form = document.getElementById('formNovoArmario');
  if (form) {
    const num = document.getElementById('numeroNovo');
    const loc = document.getElementById('localizacaoNovo');
    const obs = document.getElementById('observacaoNovo');
    if (num) num.value = '';
    if (loc) loc.value = '';
    if (obs) obs.value = '';
    const campoNumero = document.getElementById('campoNumeroNovo');
    if (campoNumero) campoNumero.classList.remove('invalido');
  }
  abrirModal('modalNovoSobreposicao');
  setTimeout(() => {
    const campo = document.getElementById('numeroNovo');
    if (campo) campo.focus();
  }, 100);
}

function fecharModalNovo() {
  fecharModal('modalNovoSobreposicao');
}

function fecharModalNovoClique(event) {
  fecharModalFora(event, 'modalNovoSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Alugar Armário
--------------------------------------------------------- */
function abrirModalAlugar(id, numero, localizacao) {
  const form = document.getElementById('formAlugarArmario');
  const titulo = document.getElementById('modalAlugarTitulo');
  const sub = document.getElementById('modalAlugarSub');
  const locatarioSelect = document.getElementById('locatario_nome_modal');
  const semestreInput = document.getElementById('semestre_modal');
  const obsInput = document.getElementById('observacao_modal');

  if (!form) return;

  form.action = '/armarios/' + encodeURIComponent(id) + '/alugar';
  if (titulo) titulo.textContent = 'Alugar Armário #' + (numero || id);
  if (sub) sub.textContent = (localizacao && localizacao !== '-') ? localizacao : 'Localização não informada';
  if (locatarioSelect) locatarioSelect.value = '';
  if (semestreInput) semestreInput.value = '';
  if (obsInput) obsInput.value = '';

  const campoLocatario = document.getElementById('campoLocatarioModal');
  const campoSemestre = document.getElementById('campoSemestreModal');
  if (campoLocatario) campoLocatario.classList.remove('invalido');
  if (campoSemestre) campoSemestre.classList.remove('invalido');

  abrirModal('modalAlugarSobreposicao');
  setTimeout(() => {
    if (locatarioSelect) locatarioSelect.focus();
  }, 100);
}

function fecharModalAlugar() {
  fecharModal('modalAlugarSobreposicao');
}

function fecharModalAlugarClique(event) {
  fecharModalFora(event, 'modalAlugarSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Editar Armário
--------------------------------------------------------- */
function abrirModalEditar(id, numero, localizacao, observacao) {
  const form = document.getElementById('formEditarArmario');
  if (!form) return;

  const inputId = document.getElementById('editarArmarioId');
  const inputNum = document.getElementById('editarNumero');
  const inputLoc = document.getElementById('editarLocalizacao');
  const inputObs = document.getElementById('editarObservacao');

  if (inputId) inputId.value = id;
  if (inputNum) inputNum.value = numero || '';
  if (inputLoc) inputLoc.value = (localizacao && localizacao !== '-') ? localizacao : '';
  if (inputObs) inputObs.value = (observacao && observacao !== '-') ? observacao : '';
  form.action = '/armarios/' + encodeURIComponent(id) + '/editar';

  abrirModal('modalEditarSobreposicao');
  setTimeout(() => {
    if (inputNum) inputNum.focus();
  }, 100);
}

function fecharModalEditar() {
  fecharModal('modalEditarSobreposicao');
}

function fecharModalEditarClique(event) {
  fecharModalFora(event, 'modalEditarSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Confirmar Desativar / Reativar
--------------------------------------------------------- */
function abrirModalToggle(id, numero, mensagem) {
  const form = document.getElementById('formToggleArmario');
  if (!form) return;

  const inputId = document.getElementById('toggleArmarioId');
  if (inputId) inputId.value = id;

  const msgEl = document.getElementById('modalToggleMensagem');
  if (msgEl) {
    msgEl.textContent = mensagem || ('Deseja alterar o estado do armário #' + numero + '?');
  }
  form.action = '/armarios/' + encodeURIComponent(id) + '/toggle-ativo';

  const titulo = document.getElementById('modalToggleTitulo');
  if (titulo) {
    titulo.textContent = (mensagem && mensagem.toLowerCase().includes('reativar'))
      ? 'Reativar Armário'
      : 'Desativar Armário';
  }

  abrirModal('modalToggleSobreposicao');
}

function fecharModalToggle() {
  fecharModal('modalToggleSobreposicao');
}

function fecharModalToggleClique(event) {
  fecharModalFora(event, 'modalToggleSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Confirmar Excluir Armário
--------------------------------------------------------- */
function abrirModalExcluir(id, numero) {
  const form = document.getElementById('formExcluirArmario');
  if (!form) return;

  const inputId = document.getElementById('excluirArmarioId');
  if (inputId) inputId.value = id;

  const titulo = document.getElementById('modalExcluirTitulo');
  if (titulo) {
    titulo.textContent = 'Excluir Armário #' + (numero || id) + '?';
  }

  const msg = document.getElementById('modalExcluirMensagem');
  if (msg) {
    msg.textContent = `O armário #${numero || id} será excluído permanentemente do banco de dados. Esta ação não poderá ser desfeita.`;
  }

  form.action = '/armarios/' + encodeURIComponent(id) + '/excluir';
  abrirModal('modalExcluirSobreposicao');
}

function fecharModalExcluir() {
  fecharModal('modalExcluirSobreposicao');
}

function fecharModalExcluirClique(event) {
  fecharModalFora(event, 'modalExcluirSobreposicao');
}

/* ---------------------------------------------------------
   Modal: Detalhe do Armário ("Ver")
--------------------------------------------------------- */
function abrirArmario(dados) {
  if (!dados) return;
  const { id, numero, localizacao, locatario, semestre, alugadoEm, observacao, status } = dados;

  const titulo = document.getElementById('detalheArmarioTitulo');
  const sub = document.getElementById('detalheArmarioSub');
  const iconeHeader = document.getElementById('detalheArmarioIcone');
  const conteudo = document.getElementById('conteudoDetalheArmario');
  const btnConfirmar = document.getElementById('btnConfirmarDevolucao');
  const inputId = document.getElementById('devolucaoArmarioId');
  const formDevolucao = document.getElementById('formDevolucao');

  const rotulos = {
    disponivel: { texto: 'Disponível', classe: 'verde' },
    alugado: { texto: 'Alugado', classe: 'azul' },
    inativo: { texto: 'Inativo', classe: 'cinza' }
  };
  const rotulo = rotulos[status] || { texto: status || 'Desconhecido', classe: 'cinza' };

  if (titulo) titulo.textContent = 'Armário #' + (numero || id);
  if (sub) sub.textContent = (localizacao && localizacao !== '-') ? localizacao : 'Localização não informada';
  if (iconeHeader) {
    iconeHeader.className = 'modal-cabecalho-icone ' + (rotulo.classe || 'azul');
  }

  let html = `
    <div class="detalhe-grade">
      <div class="detalhe-item">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Status
        </span>
        <div>
          <span class="chip-status ${rotulo.classe}">${rotulo.texto}</span>
        </div>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Localização
        </span>
        <span class="detalhe-valor">${(localizacao && localizacao !== '-') ? localizacao : '—'}</span>
      </div>
  `;

  if (status === 'alugado') {
    html += `
      <div class="detalhe-item detalhe-item-completo">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Locatário
        </span>
        <span class="detalhe-valor">${(locatario && locatario !== '-') ? locatario : '—'}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Semestre
        </span>
        <span class="detalhe-valor">${(semestre && semestre !== '-') ? semestre : '—'}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Alugado em
        </span>
        <span class="detalhe-valor">${(alugadoEm && alugadoEm !== '-') ? alugadoEm : '—'}</span>
      </div>
    `;
  }

  if (observacao && observacao !== '-') {
    html += `
      <div class="detalhe-item detalhe-item-completo">
        <span class="detalhe-label">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Observação
        </span>
        <span class="detalhe-valor">${observacao}</span>
      </div>
    `;
  }

  html += `</div>`;
  if (conteudo) conteudo.innerHTML = html;

  if (formDevolucao && inputId && btnConfirmar) {
    if (status === 'alugado') {
      inputId.value = id;
      formDevolucao.action = '/armarios/' + encodeURIComponent(id) + '/liberar';
      formDevolucao.style.display = 'block';
      btnConfirmar.textContent = 'Liberar Armário';
      btnConfirmar.className = 'btn-principal';
      btnConfirmar.style.display = 'inline-block';
      btnConfirmar.onclick = null;
      btnConfirmar.type = 'submit';
    } else if (status === 'disponivel') {
      formDevolucao.style.display = 'block';
      formDevolucao.removeAttribute('action');
      btnConfirmar.textContent = 'Alugar este Armário';
      btnConfirmar.className = 'btn-principal';
      btnConfirmar.style.display = 'inline-block';
      btnConfirmar.type = 'button';
      btnConfirmar.onclick = function (ev) {
        ev.preventDefault();
        fecharModalDetalhe();
        abrirModalAlugar(id, numero, localizacao);
      };
    } else if (status === 'inativo') {
      formDevolucao.style.display = 'block';
      formDevolucao.removeAttribute('action');
      btnConfirmar.textContent = 'Reativar Armário';
      btnConfirmar.className = 'btn-principal';
      btnConfirmar.style.display = 'inline-block';
      btnConfirmar.type = 'button';
      btnConfirmar.onclick = function (ev) {
        ev.preventDefault();
        fecharModalDetalhe();
        abrirModalToggle(id, numero, 'Reativar o armário #' + numero + '? Ele voltará a ficar disponível.');
      };
    } else {
      formDevolucao.style.display = 'block';
      formDevolucao.removeAttribute('action');
      btnConfirmar.style.display = 'none';
    }
  }

  abrirModal('modalDetalheArmario');
}

function fecharModalDetalhe() {
  fecharModal('modalDetalheArmario');
}

function fecharModalDetalheClique(event) {
  fecharModalFora(event, 'modalDetalheArmario');
}

/* ---------------------------------------------------------
   Helpers para cliques em botões com atributos data-*
--------------------------------------------------------- */
function abrirModalVerBtn(btn) {
  if (!btn) return;
  abrirArmario({
    id: btn.dataset.id || btn.dataset.armarioId,
    numero: btn.dataset.numero || btn.dataset.armarioNumero,
    localizacao: btn.dataset.localizacao || btn.dataset.armarioLocalizacao,
    locatario: btn.dataset.locatario || btn.dataset.armarioLocatario,
    semestre: btn.dataset.semestre || btn.dataset.armarioSemestre,
    alugadoEm: btn.dataset.alugadoEm || btn.dataset.armarioAlugadoEm,
    observacao: btn.dataset.observacao || btn.dataset.armarioObservacao,
    status: btn.dataset.status || btn.dataset.armarioStatus
  });
}

function abrirModalAlugarBtn(btn) {
  if (!btn) return;
  abrirModalAlugar(
    btn.dataset.id || btn.dataset.armarioId,
    btn.dataset.numero || btn.dataset.armarioNumero,
    btn.dataset.localizacao || btn.dataset.armarioLocalizacao
  );
}

function abrirModalEditarBtn(btn) {
  if (!btn) return;
  abrirModalEditar(
    btn.dataset.id || btn.dataset.armarioId,
    btn.dataset.numero || btn.dataset.armarioNumero,
    btn.dataset.localizacao || btn.dataset.armarioLocalizacao,
    btn.dataset.observacao || btn.dataset.armarioObservacao
  );
}

function abrirModalToggleBtn(btn) {
  if (!btn) return;
  const id = btn.dataset.id || btn.dataset.armarioId;
  const numero = btn.dataset.numero || btn.dataset.armarioNumero;
  const texto = btn.textContent.trim();
  const mensagem = (texto === 'Desativar' || btn.dataset.acao === 'desativar')
    ? `Desativar o armário #${numero}? Ele deixará de aparecer como disponível para aluguel.`
    : `Reativar o armário #${numero}? Ele voltará a ficar disponível para aluguel.`;
  abrirModalToggle(id, numero, mensagem);
}

function abrirModalExcluirBtn(btn) {
  if (!btn) return;
  abrirModalExcluir(
    btn.dataset.id || btn.dataset.armarioId,
    btn.dataset.numero || btn.dataset.armarioNumero
  );
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
window.abrirModalAlugar = abrirModalAlugar;
window.fecharModalAlugar = fecharModalAlugar;
window.fecharModalAlugarClique = fecharModalAlugarClique;
window.abrirModalEditar = abrirModalEditar;
window.fecharModalEditar = fecharModalEditar;
window.fecharModalEditarClique = fecharModalEditarClique;
window.abrirModalToggle = abrirModalToggle;
window.fecharModalToggle = fecharModalToggle;
window.fecharModalToggleClique = fecharModalToggleClique;
window.abrirModalExcluir = abrirModalExcluir;
window.fecharModalExcluir = fecharModalExcluir;
window.fecharModalExcluirClique = fecharModalExcluirClique;
window.abrirArmario = abrirArmario;
window.fecharModalDetalhe = fecharModalDetalhe;
window.fecharModalDetalheClique = fecharModalDetalheClique;
window.abrirModalVerBtn = abrirModalVerBtn;
window.abrirModalAlugarBtn = abrirModalAlugarBtn;
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

  // Verifica parâmetros de URL para exibir feedback
  const params = new URLSearchParams(window.location.search);
  if (params.get('criado') === 'ok') {
    mostrarToast('Armário cadastrado com sucesso!', 'sucesso');
  } else if (params.get('alugado') === 'ok') {
    mostrarToast('Armário alugado com sucesso!', 'sucesso');
  } else if (params.get('editado') === 'ok') {
    mostrarToast('Armário atualizado com sucesso!', 'sucesso');
  } else if (params.get('liberado') === 'ok') {
    mostrarToast('Armário liberado com sucesso!', 'sucesso');
  } else if (params.get('desativado') === 'ok') {
    mostrarToast('Armário desativado.', 'sucesso');
  } else if (params.get('reativado') === 'ok') {
    mostrarToast('Armário reativado com sucesso!', 'sucesso');
  } else if (params.get('excluido') === 'ok') {
    mostrarToast('Armário excluído com sucesso!', 'sucesso');
  } else if (params.get('erro') === 'ja_alugado') {
    mostrarToast('Este armário já está alugado.', 'erro');
  } else if (params.get('erro') === 'desativar_alugado') {
    mostrarToast('Não é possível desativar um armário alugado. Libere-o primeiro.', 'erro');
  } else if (params.get('erro') === 'excluir_alugado') {
    mostrarToast('Não é possível excluir um armário alugado. Libere-o primeiro.', 'erro');
  } else if (params.get('erro') === 'ja_existe' || params.get('erro') === 'numero_duplicado') {
    mostrarToast('Já existe um armário cadastrado com esse número.', 'erro');
  } else if (params.get('erro') === 'nao_encontrado') {
    mostrarToast('Armário não encontrado.', 'erro');
  } else if (params.get('erro')) {
    mostrarToast('Ocorreu um erro na operação.', 'erro');
  }

  /* ---------- Validação no submit do formulário Novo Armário ---------- */
  const formNovo = document.getElementById('formNovoArmario');
  if (formNovo) {
    formNovo.addEventListener('submit', (evento) => {
      const numero = document.getElementById('numeroNovo');
      const campoNumero = document.getElementById('campoNumeroNovo');
      if (!numero || !numero.value.trim()) {
        evento.preventDefault();
        if (campoNumero) campoNumero.classList.add('invalido');
        if (numero) numero.focus();
      }
    });
  }

  /* ---------- Validação no submit do formulário Alugar Armário ---------- */
  const formAlugar = document.getElementById('formAlugarArmario');
  if (formAlugar) {
    formAlugar.addEventListener('submit', (evento) => {
      const nome = document.getElementById('locatario_nome_modal');
      const semestre = document.getElementById('semestre_modal');
      let valido = true;

      if (!nome || !nome.value.trim()) {
        const c = document.getElementById('campoLocatarioModal');
        if (c) c.classList.add('invalido');
        valido = false;
      } else {
        const c = document.getElementById('campoLocatarioModal');
        if (c) c.classList.remove('invalido');
      }

      if (!semestre || !semestre.value.trim()) {
        const c = document.getElementById('campoSemestreModal');
        if (c) c.classList.add('invalido');
        valido = false;
      } else {
        const c = document.getElementById('campoSemestreModal');
        if (c) c.classList.remove('invalido');
      }

      if (!valido) {
        evento.preventDefault();
      }
    });
  }

  /* ---------- Validação no submit do formulário Editar Armário ---------- */
  const formEditar = document.getElementById('formEditarArmario');
  if (formEditar) {
    formEditar.addEventListener('submit', (evento) => {
      const numero = document.getElementById('editarNumero');
      if (!numero || !numero.value.trim()) {
        evento.preventDefault();
        if (numero) numero.focus();
      }
    });
  }

  /* ---------- Confirmação no submit do formulário Liberar na tabela ---------- */
  document.querySelectorAll('.form-acao-inline').forEach((form) => {
    form.addEventListener('submit', (evento) => {
      const msg = form.dataset.confirmMsg || 'Confirmar esta ação?';
      if (!confirm(msg)) {
        evento.preventDefault();
      }
    });
  });

  /* ---------- Event Listeners para botões da tabela ---------- */
  document.querySelectorAll('.btn-abrir-ver').forEach((btn) => {
    btn.addEventListener('click', () => {
      abrirArmario({
        id: btn.dataset.id || btn.dataset.armarioId,
        numero: btn.dataset.numero || btn.dataset.armarioNumero,
        localizacao: btn.dataset.localizacao || btn.dataset.armarioLocalizacao,
        locatario: btn.dataset.locatario || btn.dataset.armarioLocatario,
        semestre: btn.dataset.semestre || btn.dataset.armarioSemestre,
        alugadoEm: btn.dataset.alugadoEm || btn.dataset.armarioAlugadoEm,
        observacao: btn.dataset.observacao || btn.dataset.armarioObservacao,
        status: btn.dataset.status || btn.dataset.armarioStatus
      });
    });
  });

  document.querySelectorAll('.btn-abrir-alugar').forEach((btn) => {
    btn.addEventListener('click', () => {
      abrirModalAlugar(
        btn.dataset.id || btn.dataset.armarioId,
        btn.dataset.numero || btn.dataset.armarioNumero,
        btn.dataset.localizacao || btn.dataset.armarioLocalizacao
      );
    });
  });

  document.querySelectorAll('.btn-abrir-editar').forEach((btn) => {
    btn.addEventListener('click', () => {
      abrirModalEditar(
        btn.dataset.id || btn.dataset.armarioId,
        btn.dataset.numero || btn.dataset.armarioNumero,
        btn.dataset.localizacao || btn.dataset.armarioLocalizacao,
        btn.dataset.observacao || btn.dataset.armarioObservacao
      );
    });
  });

  document.querySelectorAll('.btn-abrir-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const numero = btn.dataset.numero || btn.dataset.armarioNumero;
      const texto = btn.textContent.trim();
      const mensagem = (texto === 'Desativar' || btn.dataset.acao === 'desativar')
        ? `Desativar o armário #${numero}? Ele deixará de aparecer como disponível para aluguel.`
        : `Reativar o armário #${numero}? Ele voltará a ficar disponível para aluguel.`;
      abrirModalToggle(btn.dataset.id || btn.dataset.armarioId, numero, mensagem);
    });
  });

  /* ---------- Busca e filtro por status na tabela (client-side) ---------- */
  const busca = document.getElementById('buscaArmario');
  const grupoFiltroStatus = document.getElementById('grupoFiltroStatus');
  const tabela = document.getElementById('tabelaArmarios');
  const estadoVazio = document.getElementById('estadoVazio');
  const estadoVazioTitulo = document.getElementById('estadoVazioTitulo');
  const estadoVazioSub = document.getElementById('estadoVazioSub');

  const todasLinhas = tabela ? Array.from(tabela.querySelectorAll('tr')) : [];
  let statusAtivo = '';

  function filtrarTabela() {
    const termo = (busca && busca.value ? busca.value : '').toLowerCase().trim();
    let visiveis = 0;

    todasLinhas.forEach((linha) => {
      const statusLinha = linha.dataset.status || '';
      const textoLinha = linha.textContent.toLowerCase();

      const matchStatus = !statusAtivo || statusLinha === statusAtivo;
      const matchTexto = !termo || textoLinha.includes(termo);

      if (matchStatus && matchTexto) {
        linha.style.display = '';
        visiveis++;
      } else {
        linha.style.display = 'none';
      }
    });

    if (estadoVazio) {
      if (todasLinhas.length === 0) {
        if (estadoVazioTitulo) estadoVazioTitulo.textContent = 'Nenhum armário cadastrado';
        if (estadoVazioSub) estadoVazioSub.textContent = 'Clique em "+ Novo Armário" para começar.';
        estadoVazio.style.display = 'flex';
      } else if (visiveis === 0) {
        if (estadoVazioTitulo) estadoVazioTitulo.textContent = 'Nenhum resultado encontrado';
        if (estadoVazioSub) estadoVazioSub.textContent = 'Tente ajustar a busca ou o filtro de status.';
        estadoVazio.style.display = 'flex';
      } else {
        estadoVazio.style.display = 'none';
      }
    }
  }

  if (busca) {
    busca.addEventListener('input', filtrarTabela);
  }

  if (grupoFiltroStatus) {
    grupoFiltroStatus.addEventListener('click', (event) => {
      const botao = event.target.closest('.btn-filtro');
      if (!botao) return;
      grupoFiltroStatus.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      statusAtivo = botao.dataset.status || '';
      filtrarTabela();
    });
  }

  /* ---------- Fecha modais com a tecla ESC ---------- */
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharModalNovo();
      fecharModalAlugar();
      fecharModalEditar();
      fecharModalToggle();
      fecharModalExcluir();
      fecharModalDetalhe();
    }
  });
});