/* =============================================================
   CATEGORIAS.JS
   AAPM SENAI Francisco Matarazzo — Gestão de Categorias
   Script completo e independente para modais, filtros em tempo real,
   contagem de métricas e toasts.
   ============================================================= */

/* -------------------------------------------------------------
   Utilitários de Modal
------------------------------------------------------------- */
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

/* -------------------------------------------------------------
   Menu Mobile
------------------------------------------------------------- */
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

/* -------------------------------------------------------------
   Toast
------------------------------------------------------------- */
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

/* -------------------------------------------------------------
   Modal 1: Nova Categoria
------------------------------------------------------------- */
function abrirModalCategoriaNova() {
  const form = document.getElementById('formNovaCategoria');
  if (form) form.reset();

  const campoNome = document.getElementById('novoNomeCategoria');
  const campoAtiva = document.getElementById('novaAtivaCategoria');
  if (campoAtiva) campoAtiva.checked = true;

  abrirModal('modalNovaCategoriaSobreposicao');
  setTimeout(() => {
    if (campoNome) campoNome.focus();
  }, 100);
}

function fecharModalCategoriaNova() {
  fecharModal('modalNovaCategoriaSobreposicao');
}

function fecharModalCategoriaNovaClique(event) {
  fecharModalFora(event, 'modalNovaCategoriaSobreposicao');
}

/* -------------------------------------------------------------
   Modal 2: Ver Detalhes da Categoria
------------------------------------------------------------- */
function abrirModalCategoriaVer(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;

  const id = b.getAttribute('data-id');
  const nome = b.getAttribute('data-nome');
  const ativa = b.getAttribute('data-ativa') === 'true';
  let produtos = [];

  try {
    produtos = JSON.parse(b.getAttribute('data-produtos') || '[]');
  } catch (e) {
    produtos = [];
  }

  const titulo = document.getElementById('detalheCategoriaTitulo');
  const badgeStatus = document.getElementById('detalheCategoriaStatus');
  const contagem = document.getElementById('detalheCategoriaTotalProdutos');
  const lista = document.getElementById('detalheCategoriaListaProdutos');

  if (titulo) titulo.textContent = nome || 'Categoria';
  if (badgeStatus) {
    badgeStatus.className = 'tag-tipo ' + (ativa ? 'verde' : 'cinza');
    badgeStatus.innerHTML = `<span class="ponto-status"></span> ${ativa ? 'Ativa' : 'Inativa'}`;
  }
  if (contagem) {
    contagem.textContent = `${produtos.length} produto${produtos.length !== 1 ? 's' : ''} vinculado${produtos.length !== 1 ? 's' : ''}`;
  }

  if (lista) {
    if (produtos.length === 0) {
      lista.innerHTML = '<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 0.85rem;">Nenhum produto vinculado a esta categoria ainda.</div>';
    } else {
      lista.innerHTML = produtos.map(p => `
        <div class="cat-item-produto">
          <span>${p.nome}</span>
          <span>R$ ${parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}</span>
        </div>
      `).join('');
    }
  }

  const btnEditar = document.getElementById('btnDetalheEditarCategoria');
  if (btnEditar) {
    btnEditar.onclick = () => {
      fecharModal('modalDetalheCategoriaSobreposicao');
      abrirModalCategoriaEditar(btn);
    };
  }

  abrirModal('modalDetalheCategoriaSobreposicao');
}

function fecharModalCategoriaDetalhe() {
  fecharModal('modalDetalheCategoriaSobreposicao');
}

function fecharModalCategoriaDetalheClique(event) {
  fecharModalFora(event, 'modalDetalheCategoriaSobreposicao');
}

/* -------------------------------------------------------------
   Modal 3: Editar Categoria
------------------------------------------------------------- */
function abrirModalCategoriaEditar(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;

  const id = b.getAttribute('data-id');
  const nome = b.getAttribute('data-nome');
  const ativa = b.getAttribute('data-ativa') === 'true';
  let produtos = [];

  try {
    produtos = JSON.parse(b.getAttribute('data-produtos') || '[]');
  } catch (e) {
    produtos = [];
  }

  const form = document.getElementById('formEditarCategoria');
  const inputId = document.getElementById('editarCategoriaId');
  const inputNome = document.getElementById('editarNomeCategoria');
  const inputAtiva = document.getElementById('editarAtivaCategoria');
  const blocoProdutos = document.getElementById('editarBlocoProdutos');
  const listaProdutos = document.getElementById('editarListaProdutos');
  const badgeProdutos = document.getElementById('editarBadgeCount');

  if (form) form.action = `/categorias/${id}/editar`;
  if (inputId) inputId.value = id;
  if (inputNome) inputNome.value = nome || '';
  if (inputAtiva) inputAtiva.checked = ativa;

  if (blocoProdutos && listaProdutos && badgeProdutos) {
    if (produtos.length > 0) {
      blocoProdutos.style.display = 'block';
      badgeProdutos.textContent = `${produtos.length} ativo${produtos.length !== 1 ? 's' : ''}`;
      listaProdutos.innerHTML = produtos.map(p => `
        <div class="cat-item-produto">
          <span>${p.nome}</span>
          <span>R$ ${parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}</span>
        </div>
      `).join('');
    } else {
      blocoProdutos.style.display = 'none';
    }
  }

  abrirModal('modalEditarCategoriaSobreposicao');
  setTimeout(() => {
    if (inputNome) inputNome.focus();
  }, 100);
}

function fecharModalCategoriaEditar() {
  fecharModal('modalEditarCategoriaSobreposicao');
}

function fecharModalCategoriaEditarClique(event) {
  fecharModalFora(event, 'modalEditarCategoriaSobreposicao');
}

/* -------------------------------------------------------------
   Modal 4: Confirmar Toggle Status (Ativar / Desativar)
------------------------------------------------------------- */
function abrirModalCategoriaToggle(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;

  const id = b.getAttribute('data-id');
  const nome = b.getAttribute('data-nome');
  const ativa = b.getAttribute('data-ativa') === 'true';

  const form = document.getElementById('formToggleCategoria');
  const titulo = document.getElementById('modalToggleCategoriaTitulo');
  const msg = document.getElementById('modalToggleCategoriaMensagem');
  const btnSubmit = document.getElementById('btnConfirmarToggleCategoria');

  if (form) form.action = `/categorias/${id}/toggle-ativo`;

  if (titulo) {
    titulo.textContent = ativa ? 'Desativar Categoria' : 'Reativar Categoria';
  }

  if (msg) {
    msg.innerHTML = ativa
      ? `Deseja desativar a categoria <strong>"${nome}"</strong>? Categorias inativas não aparecem para novos produtos no catálogo.`
      : `Deseja reativar a categoria <strong>"${nome}"</strong>? Ela voltará a ficar disponível para vínculo de produtos.`;
  }

  if (btnSubmit) {
    btnSubmit.textContent = ativa ? 'Desativar' : 'Reativar';
    btnSubmit.style.background = ativa ? '#d97706' : '#16a34a';
  }

  abrirModal('modalToggleCategoriaSobreposicao');
}

function fecharModalCategoriaToggle() {
  fecharModal('modalToggleCategoriaSobreposicao');
}

function fecharModalCategoriaToggleClique(event) {
  fecharModalFora(event, 'modalToggleCategoriaSobreposicao');
}

/* -------------------------------------------------------------
   Modal 5: Confirmar Exclusão
------------------------------------------------------------- */
function abrirModalCategoriaExcluir(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;

  const id = b.getAttribute('data-id');
  const nome = b.getAttribute('data-nome');
  const produtosCount = parseInt(b.getAttribute('data-produtos-count') || '0', 10);

  const form = document.getElementById('formExcluirCategoria');
  const msg = document.getElementById('modalExcluirCategoriaMensagem');

  if (form) form.action = `/categorias/${id}/deletar`;

  if (msg) {
    if (produtosCount > 0) {
      msg.innerHTML = `Atenção: A categoria <strong>"${nome}"</strong> possui <strong>${produtosCount} produto(s) vinculado(s)</strong>. É necessário remover ou mover os produtos antes de excluir.`;
    } else {
      msg.innerHTML = `Tem certeza que deseja excluir <strong>"${nome}"</strong> permanentemente? Esta ação não poderá ser desfeita.`;
    }
  }

  abrirModal('modalExcluirCategoriaSobreposicao');
}

function fecharModalCategoriaExcluir() {
  fecharModal('modalExcluirCategoriaSobreposicao');
}

function fecharModalCategoriaExcluirClique(event) {
  fecharModalFora(event, 'modalExcluirCategoriaSobreposicao');
}

/* -------------------------------------------------------------
   Exposição Global no Window
------------------------------------------------------------- */
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;
window.mostrarToast = mostrarToast;
window.abrirModalCategoriaNova = abrirModalCategoriaNova;
window.fecharModalCategoriaNova = fecharModalCategoriaNova;
window.fecharModalCategoriaNovaClique = fecharModalCategoriaNovaClique;
window.abrirModalCategoriaVer = abrirModalCategoriaVer;
window.fecharModalCategoriaDetalhe = fecharModalCategoriaDetalhe;
window.fecharModalCategoriaDetalheClique = fecharModalCategoriaDetalheClique;
window.abrirModalCategoriaEditar = abrirModalCategoriaEditar;
window.fecharModalCategoriaEditar = fecharModalCategoriaEditar;
window.fecharModalCategoriaEditarClique = fecharModalCategoriaEditarClique;
window.abrirModalCategoriaToggle = abrirModalCategoriaToggle;
window.fecharModalCategoriaToggle = fecharModalCategoriaToggle;
window.fecharModalCategoriaToggleClique = fecharModalCategoriaToggleClique;
window.abrirModalCategoriaExcluir = abrirModalCategoriaExcluir;
window.fecharModalCategoriaExcluir = fecharModalCategoriaExcluir;
window.fecharModalCategoriaExcluirClique = fecharModalCategoriaExcluirClique;

/* -------------------------------------------------------------
   Inicialização e Eventos DOM
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Data atual no topo
  const elData = document.getElementById('dataAtual');
  if (elData) {
    const hoje = new Date();
    elData.textContent = hoje.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  // Toasts via Query Params
  const params = new URLSearchParams(window.location.search);
  if (params.get('criado') === 'ok') mostrarToast('Categoria cadastrada com sucesso!', 'sucesso');
  else if (params.get('editado') === 'ok') mostrarToast('Categoria atualizada com sucesso!', 'sucesso');
  else if (params.get('deletado') === 'ok') mostrarToast('Categoria excluída com sucesso!', 'sucesso');
  else if (params.get('erro') === 'produtos_vinculados') {
    const cat = params.get('categoria') || '';
    mostrarToast(`Não é possível desativar "${cat}" pois possui produtos ativos vinculados.`, 'erro');
  } else if (params.get('erro') === 'possui_produtos') {
    mostrarToast('Não é possível excluir: existem produtos vinculados a esta categoria.', 'erro');
  } else if (params.get('erro')) {
    mostrarToast(params.get('erro'), 'erro');
  }

  // Filtros em tempo real
  const busca = document.getElementById('buscaCategoria');
  const grupoChips = document.getElementById('grupoFiltroStatus');
  const tabela = document.getElementById('corpoTabela');
  const estadoVazio = document.getElementById('estadoVazio');
  const todasLinhas = tabela ? Array.from(tabela.querySelectorAll('tr[data-status]')) : [];
  let statusAtivo = 'todos';

  function atualizarMetricasNaTela() {
    const elTotal = document.getElementById('metricaTotalCategorias');
    const elAtivas = document.getElementById('metricaCategoriasAtivas');
    const elInativas = document.getElementById('metricaCategoriasInativas');
    const chipTodas = document.getElementById('chipContadorTodas');
    const chipAtivas = document.getElementById('chipContadorAtivas');
    const chipInativas = document.getElementById('chipContadorInativas');

    if (!todasLinhas || todasLinhas.length === 0) return;

    let tot = todasLinhas.length;
    let ativas = 0;
    let inativas = 0;

    todasLinhas.forEach(linha => {
      const st = linha.getAttribute('data-status');
      if (st === 'ativa') ativas++;
      else inativas++;
    });

    if (elTotal) elTotal.textContent = tot;
    if (elAtivas) elAtivas.textContent = ativas;
    if (elInativas) elInativas.textContent = inativas;

    if (chipTodas) chipTodas.textContent = tot;
    if (chipAtivas) chipAtivas.textContent = ativas;
    if (chipInativas) chipInativas.textContent = inativas;
  }

  atualizarMetricasNaTela();

  function filtrarTabelaLocal() {
    const termo = (busca && busca.value ? busca.value : '').toLowerCase().trim();
    let visiveis = 0;

    todasLinhas.forEach(linha => {
      const statusLinha = linha.getAttribute('data-status');
      const textoLinha = linha.textContent.toLowerCase();

      const matchStatus = (statusAtivo === 'todos' || statusLinha === statusAtivo);
      const matchTexto = (!termo || textoLinha.includes(termo));

      if (matchStatus && matchTexto) {
        linha.style.display = '';
        visiveis++;
      } else {
        linha.style.display = 'none';
      }
    });

    if (estadoVazio) {
      estadoVazio.style.display = (visiveis === 0) ? 'flex' : 'none';
    }
  }

  if (busca) busca.addEventListener('input', filtrarTabelaLocal);

  if (grupoChips) {
    grupoChips.addEventListener('click', (e) => {
      const botao = e.target.closest('.btn-filtro');
      if (!botao) return;
      grupoChips.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      statusAtivo = botao.getAttribute('data-status') || 'todos';
      filtrarTabelaLocal();
    });
  }

  // Clique nos cards filtra automaticamente
  document.querySelectorAll('.card-metrica[data-filtro-status]').forEach(card => {
    card.addEventListener('click', () => {
      const st = card.getAttribute('data-filtro-status') || 'todos';
      if (grupoChips) {
        grupoChips.querySelectorAll('.btn-filtro').forEach(b => {
          b.classList.toggle('ativo', (b.getAttribute('data-status') || 'todos') === st);
        });
      }
      statusAtivo = st;
      filtrarTabelaLocal();
    });
  });

  // Tecla ESC fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModalCategoriaNova();
      fecharModalCategoriaDetalhe();
      fecharModalCategoriaEditar();
      fecharModalCategoriaToggle();
      fecharModalCategoriaExcluir();
    }
  });
});