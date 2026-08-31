/* =========================================================
   AAPM SENAI Francisco Matarazzo — Controle de Estoque
   JavaScript completo e independente para gestão de produtos,
   modais, variações de grade de tamanhos, filtros e toasts.
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
   Gerenciamento da Grade Dinâmica de Tamanhos
--------------------------------------------------------- */
function somarGradeNaTela(containerId, estoqueId) {
  const container = document.getElementById(containerId);
  const campoEstoque = document.getElementById(estoqueId);
  if (!container || !campoEstoque) return;

  const inputsQtd = container.querySelectorAll('.grade-qtd');
  let soma = 0;
  inputsQtd.forEach(input => {
    soma += parseInt(input.value, 10) || 0;
  });
  campoEstoque.value = soma;
}

function adicionarLinha(containerId, estoqueId, tamanhoVal = '', qtdVal = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const novaLinha = document.createElement('div');
  novaLinha.className = 'linha-grade';
  novaLinha.innerHTML = `
    <input type="text" class="grade-tamanho" placeholder="Ex: P, M, G, 42" value="${tamanhoVal}" style="flex: 2; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
    <input type="number" class="grade-qtd" placeholder="Qtd" min="0" value="${qtdVal}" style="flex: 1; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem;">
    <button type="button" class="btn-remover-grade" title="Remover tamanho">✕</button>
  `;

  const inputQtd = novaLinha.querySelector('.grade-qtd');
  if (inputQtd) {
    inputQtd.addEventListener('input', () => somarGradeNaTela(containerId, estoqueId));
  }

  const btnRemover = novaLinha.querySelector('.btn-remover-grade');
  if (btnRemover) {
    btnRemover.addEventListener('click', () => {
      if (container.children.length > 1) {
        novaLinha.remove();
        somarGradeNaTela(containerId, estoqueId);
      } else {
        mostrarToast('Produtos com grade exigem ao menos uma variação.', 'erro');
      }
    });
  }

  container.appendChild(novaLinha);
  somarGradeNaTela(containerId, estoqueId);
}

function gerenciarExibicaoGrade(selectId, grupoId, estoqueId, containerId) {
  const select = document.getElementById(selectId);
  const grupo = document.getElementById(grupoId);
  const estoque = document.getElementById(estoqueId);
  const container = document.getElementById(containerId);

  if (!select || !grupo || !estoque) return;

  const textoCategoria = (select.options[select.selectedIndex]?.text || '').toLowerCase();
  const usaGrade = textoCategoria.includes('uniforme') || textoCategoria.includes('vestuário') || textoCategoria.includes('camisa') || textoCategoria.includes('calça') || select.value === '1' || select.value === '10';

  if (usaGrade) {
    grupo.style.display = 'block';
    estoque.readOnly = true;
    estoque.style.backgroundColor = '#f1f5f9';
    if (container && container.children.length === 0) {
      adicionarLinha(containerId, estoqueId, 'P', 0);
      adicionarLinha(containerId, estoqueId, 'M', 0);
      adicionarLinha(containerId, estoqueId, 'G', 0);
    }
    somarGradeNaTela(containerId, estoqueId);
  } else {
    grupo.style.display = 'none';
    estoque.readOnly = false;
    estoque.style.backgroundColor = '#ffffff';
  }
}

function capturarDadosGrade(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const lines = container.querySelectorAll('.linha-grade');
  const variacoes = [];
  lines.forEach(linha => {
    const tam = (linha.querySelector('.grade-tamanho')?.value || '').trim();
    const qtd = parseInt(linha.querySelector('.grade-qtd')?.value, 10) || 0;
    if (tam) {
      variacoes.push({ tamanho: tam, estoque_atual: qtd });
    }
  });
  return variacoes;
}

/* ---------------------------------------------------------
   Modal 1: Novo Produto
--------------------------------------------------------- */
function abrirModalNovo() {
  const form = document.getElementById('formNovoProduto');
  if (form) form.reset();

  const container = document.getElementById('containerGradesNovo');
  if (container) container.innerHTML = '';

  const grupoGrade = document.getElementById('grupoGradeNovo');
  if (grupoGrade) grupoGrade.style.display = 'none';

  const campoEstoque = document.getElementById('novoEstoque');
  if (campoEstoque) {
    campoEstoque.readOnly = false;
    campoEstoque.style.backgroundColor = '#ffffff';
  }

  abrirModal('modalNovoSobreposicao');
  setTimeout(() => {
    const input = document.getElementById('novoNome');
    if (input) input.focus();
  }, 100);
}

function fecharModalNovo() {
  fecharModal('modalNovoSobreposicao');
}

function fecharModalNovoClique(event) {
  fecharModalFora(event, 'modalNovoSobreposicao');
}

async function submeterNovoProduto(event) {
  event.preventDefault();
  const form = document.getElementById('formNovoProduto');
  if (!form) return;

  const nome = document.getElementById('novoNome')?.value.trim();
  const categoria = document.getElementById('novoCategoria')?.value;
  const preco = document.getElementById('novoPreco')?.value;

  if (!nome) {
    mostrarToast('Informe o nome do produto.', 'erro');
    return;
  }
  if (!categoria) {
    mostrarToast('Selecione uma categoria.', 'erro');
    return;
  }
  if (!preco) {
    mostrarToast('Informe o preço do produto.', 'erro');
    return;
  }

  const formData = new FormData(form);
  const variacoes = capturarDadosGrade('containerGradesNovo');
  if (variacoes.length > 0) {
    formData.set('variacoes_json', JSON.stringify(variacoes));
  }

  try {
    const res = await fetch('/produtos/novo', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      window.location.href = '/produtos?criado=ok';
    } else {
      const erro = await res.json().catch(() => ({ detail: 'Erro ao cadastrar produto.' }));
      mostrarToast(erro.detail || 'Erro ao cadastrar produto.', 'erro');
    }
  } catch (e) {
    form.submit();
  }
}

/* ---------------------------------------------------------
   Modal 2: Ver Detalhes do Produto
--------------------------------------------------------- */
async function abrirModalVer(dados) {
  if (!dados) return;

  const id = dados.id;
  const nome = dados.nome;
  const categoria = dados.categoria;
  const preco = dados.preco;
  const estoque = dados.estoque;
  const ativa = dados.ativa === true || dados.ativa === 'true';
  const imagemUrl = dados.imagemUrl || 'https://placehold.co/300x300?text=Sem+Imagem';
  const descricao = dados.descricao || '';

  const titulo = document.getElementById('detalheProdutoTitulo');
  const sub = document.getElementById('detalheProdutoSub');
  const conteudo = document.getElementById('conteudoDetalheProduto');

  if (titulo) titulo.textContent = nome || 'Produto';
  if (sub) sub.textContent = (categoria && categoria !== '—') ? `Categoria: ${categoria}` : 'Sem categoria';

  let statusBadge = !ativa
    ? '<span class="tag-tipo cinza"><span class="ponto-status"></span> Inativo</span>'
    : '<span class="tag-tipo verde"><span class="ponto-status"></span> Ativo</span>';

  let html = `
    <div class="detalhe-produto-header">
      <img src="${imagemUrl}" alt="${nome}" class="detalhe-produto-img" onerror="this.src='https://placehold.co/300x300?text=Sem+Imagem'" />
      <div>
        <h4 style="font-family: 'Montserrat', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827; margin-bottom: 4px;">${nome}</h4>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${statusBadge}
          <span style="font-weight: 700; font-size: 0.88rem; color: #475569;">${categoria || 'Geral'}</span>
        </div>
      </div>
    </div>

    <div class="detalhe-grade">
      <div class="detalhe-item">
        <span class="detalhe-label">Preço Unitário</span>
        <span class="detalhe-valor" style="color: #c8102e;">R$ ${parseFloat(preco || 0).toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Estoque Total</span>
        <span class="detalhe-valor">${estoque} un.</span>
      </div>
      <div class="detalhe-item detalhe-item-completo">
        <span class="detalhe-label">Descrição</span>
        <span class="detalhe-valor" style="font-weight: 500; font-size: 0.88rem; color: #475569;">${descricao || 'Nenhuma descrição cadastrada.'}</span>
      </div>
    </div>
  `;

  // Buscar variações via API
  let variacoesHtml = '';
  try {
    const res = await fetch(`/produtos/${id}/variacoes`);
    if (res.ok) {
      const variacoes = await res.json();
      if (variacoes && variacoes.length > 0) {
        variacoesHtml = `
          <div class="detalhe-item detalhe-item-completo" style="margin-top: 4px;">
            <span class="detalhe-label">Grade de Tamanhos & Estoque por Variação</span>
            <table class="tabela-mini-variacoes">
              <thead>
                <tr>
                  <th>Tamanho / Variação</th>
                  <th style="text-align: right;">Quantidade em Estoque</th>
                </tr>
              </thead>
              <tbody>
                ${variacoes.map(v => `
                  <tr>
                    <td><strong>${v.tamanho}</strong></td>
                    <td style="text-align: right; font-weight: 700;">${v.estoque_atual} un.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  } catch (e) {
    console.error('Erro ao buscar variações:', e);
  }

  if (conteudo) conteudo.innerHTML = html + variacoesHtml;

  const btnEditar = document.getElementById('btnDetalheEditarProduto');
  if (btnEditar) {
    btnEditar.onclick = () => {
      fecharModalDetalhe();
      abrirModalEditar(dados);
    };
  }

  abrirModal('modalDetalheProduto');
}

function fecharModalDetalhe() {
  fecharModal('modalDetalheProduto');
}

function fecharModalDetalheClique(event) {
  fecharModalFora(event, 'modalDetalheProduto');
}

function abrirModalVerBtn(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;
  abrirModalVer({
    id: b.getAttribute('data-id'),
    nome: b.getAttribute('data-nome'),
    categoria: b.getAttribute('data-categoria-nome'),
    categoriaId: b.getAttribute('data-categoria-id'),
    preco: b.getAttribute('data-preco'),
    estoque: b.getAttribute('data-estoque'),
    ativa: b.getAttribute('data-ativa') === 'true',
    imagemUrl: b.getAttribute('data-imagem-url'),
    descricao: b.getAttribute('data-descricao')
  });
}

/* ---------------------------------------------------------
   Modal 3: Editar Produto
--------------------------------------------------------- */
async function abrirModalEditar(dados) {
  if (!dados) return;

  const id = dados.id;
  const form = document.getElementById('formEditarProduto');
  if (!form) return;

  form.action = `/produtos/${id}/editar`;

  const inputId = document.getElementById('editarProdutoId');
  const inputNome = document.getElementById('editarNome');
  const selectCat = document.getElementById('editarCategoria');
  const inputPreco = document.getElementById('editarPreco');
  const inputEstoque = document.getElementById('editarEstoque');
  const container = document.getElementById('containerGradesEditar');

  if (inputId) inputId.value = id;
  if (inputNome) inputNome.value = dados.nome || '';
  if (selectCat) selectCat.value = dados.categoriaId || '';
  if (inputPreco) inputPreco.value = dados.preco || '';
  if (inputEstoque) inputEstoque.value = dados.estoque || '0';
  if (container) container.innerHTML = '';

  try {
    const res = await fetch(`/produtos/${id}/variacoes`);
    if (res.ok) {
      const variacoes = await res.json();
      if (variacoes && variacoes.length > 0) {
        variacoes.forEach(v => {
          adicionarLinha('containerGradesEditar', 'editarEstoque', v.tamanho, v.estoque_atual);
        });
      }
    }
  } catch (e) {
    console.error('Erro ao carregar grade na edição:', e);
  }

  gerenciarExibicaoGrade('editarCategoria', 'grupoGradeEditar', 'editarEstoque', 'containerGradesEditar');

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

function abrirModalEditarBtn(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;
  abrirModalEditar({
    id: b.getAttribute('data-id'),
    nome: b.getAttribute('data-nome'),
    categoria: b.getAttribute('data-categoria-nome'),
    categoriaId: b.getAttribute('data-categoria-id'),
    preco: b.getAttribute('data-preco'),
    estoque: b.getAttribute('data-estoque'),
    ativa: b.getAttribute('data-ativa') === 'true',
    imagemUrl: b.getAttribute('data-imagem-url'),
    descricao: b.getAttribute('data-descricao')
  });
}

async function submeterEdicaoProduto(event) {
  event.preventDefault();
  const form = document.getElementById('formEditarProduto');
  if (!form) return;

  const id = document.getElementById('editarProdutoId')?.value;
  const formData = new FormData(form);
  const variacoes = capturarDadosGrade('containerGradesEditar');

  if (variacoes.length > 0) {
    formData.set('variacoes_json', JSON.stringify(variacoes));
  }

  try {
    const res = await fetch(`/produtos/${id}/editar`, {
      method: 'POST',
      body: formData
    });

    if (res.ok || res.redirected) {
      window.location.href = '/produtos?editado=ok';
    } else {
      const erro = await res.json().catch(() => ({ detail: 'Erro ao editar produto.' }));
      mostrarToast(erro.detail || 'Erro ao salvar alterações.', 'erro');
    }
  } catch (e) {
    form.submit();
  }
}

/* ---------------------------------------------------------
   Modal 4: Alterar Status (Ativar / Desativar)
--------------------------------------------------------- */
function abrirModalToggle(id, nome, acao) {
  const form = document.getElementById('formToggleProduto');
  if (!form) return;

  const isDesativar = (acao === 'desativar');
  form.action = isDesativar ? `/produtos/${id}/desativar` : `/produtos/${id}/ativar`;

  const titulo = document.getElementById('modalToggleTitulo');
  const msg = document.getElementById('modalToggleMensagem');
  const btn = document.getElementById('btnConfirmarToggle');

  if (titulo) {
    titulo.textContent = isDesativar ? 'Desativar Produto' : 'Reativar Produto';
  }
  if (msg) {
    msg.textContent = isDesativar
      ? `Deseja desativar "${nome}"? O item não aparecerá mais no catálogo e no PDV para novas vendas.`
      : `Deseja reativar "${nome}"? O item voltará a ficar disponível para consulta e vendas.`;
  }
  if (btn) {
    btn.textContent = isDesativar ? 'Desativar Produto' : 'Reativar Produto';
    btn.style.background = isDesativar ? '#d97706' : '#16a34a';
  }

  abrirModal('modalToggleSobreposicao');
}

function fecharModalToggle() {
  fecharModal('modalToggleSobreposicao');
}

function fecharModalToggleClique(event) {
  fecharModalFora(event, 'modalToggleSobreposicao');
}

function abrirModalToggleBtn(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;
  abrirModalToggle(
    b.getAttribute('data-id'),
    b.getAttribute('data-nome'),
    b.getAttribute('data-acao') || 'desativar'
  );
}

/* ---------------------------------------------------------
   Modal 5: Excluir Produto Definitivamente
--------------------------------------------------------- */
function abrirModalExcluir(id, nome) {
  const form = document.getElementById('formExcluirProduto');
  if (!form) return;

  form.action = `/produtos/${id}/excluir`;

  const msg = document.getElementById('modalExcluirMensagem');
  if (msg) {
    msg.innerHTML = `Tem certeza que deseja excluir <strong>"${nome}"</strong> permanentemente? Todo o histórico deste produto e suas variações serão apagados.`;
  }

  abrirModal('modalExcluirSobreposicao');
}

function fecharModalExcluir() {
  fecharModal('modalExcluirSobreposicao');
}

function fecharModalExcluirClique(event) {
  fecharModalFora(event, 'modalExcluirSobreposicao');
}

function abrirModalExcluirBtn(btn) {
  const b = btn ? (btn.closest('button') || btn) : null;
  if (!b) return;
  abrirModalExcluir(
    b.getAttribute('data-id'),
    b.getAttribute('data-nome')
  );
}

/* ---------------------------------------------------------
   Exposição Global no Window
--------------------------------------------------------- */
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;
window.mostrarToast = mostrarToast;
window.adicionarLinha = adicionarLinha;
window.gerenciarExibicaoGrade = gerenciarExibicaoGrade;
window.somarGradeNaTela = somarGradeNaTela;
window.abrirModalNovo = abrirModalNovo;
window.fecharModalNovo = fecharModalNovo;
window.fecharModalNovoClique = fecharModalNovoClique;
window.submeterNovoProduto = submeterNovoProduto;
window.abrirModalVer = abrirModalVer;
window.abrirModalVerBtn = abrirModalVerBtn;
window.fecharModalDetalhe = fecharModalDetalhe;
window.fecharModalDetalheClique = fecharModalDetalheClique;
window.abrirModalEditar = abrirModalEditar;
window.abrirModalEditarBtn = abrirModalEditarBtn;
window.fecharModalEditar = fecharModalEditar;
window.fecharModalEditarClique = fecharModalEditarClique;
window.submeterEdicaoProduto = submeterEdicaoProduto;
window.abrirModalToggle = abrirModalToggle;
window.abrirModalToggleBtn = abrirModalToggleBtn;
window.fecharModalToggle = fecharModalToggle;
window.fecharModalToggleClique = fecharModalToggleClique;
window.abrirModalExcluir = abrirModalExcluir;
window.abrirModalExcluirBtn = abrirModalExcluirBtn;
window.fecharModalExcluir = fecharModalExcluir;
window.fecharModalExcluirClique = fecharModalExcluirClique;

/* ---------------------------------------------------------
   Inicialização e Eventos DOM
--------------------------------------------------------- */
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
  if (params.get('criado') === 'ok') mostrarToast('Produto cadastrado com sucesso!', 'sucesso');
  else if (params.get('editado') === 'ok') mostrarToast('Produto atualizado com sucesso!', 'sucesso');
  else if (params.get('desativado') === 'ok') mostrarToast('Produto desativado do catálogo.', 'sucesso');
  else if (params.get('ativado') === 'ok') mostrarToast('Produto reativado com sucesso!', 'sucesso');
  else if (params.get('excluido') === 'ok') mostrarToast('Produto excluído definitivamente.', 'sucesso');
  else if (params.get('erro')) mostrarToast(params.get('erro'), 'erro');

  // Listeners para selects de categoria (Novo e Edição)
  const selNovoCat = document.getElementById('novoCategoria');
  if (selNovoCat) {
    selNovoCat.addEventListener('change', () => {
      gerenciarExibicaoGrade('novoCategoria', 'grupoGradeNovo', 'novoEstoque', 'containerGradesNovo');
    });
  }

  const selEditCat = document.getElementById('editarCategoria');
  if (selEditCat) {
    selEditCat.addEventListener('change', () => {
      gerenciarExibicaoGrade('editarCategoria', 'grupoGradeEditar', 'editarEstoque', 'containerGradesEditar');
    });
  }

  // Busca em tempo real na tabela da página atual
  const busca = document.getElementById('buscaProduto');
  const tabela = document.getElementById('tabelaProdutos');
  const estadoVazio = document.getElementById('estadoVazio');
  const todasLinhas = tabela ? Array.from(tabela.querySelectorAll('tr[data-status]')) : [];
  let statusAtivo = '';

  function atualizarMetricasNaTela() {
    const elTotal = document.getElementById('metricaTotalValor');
    const elItens = document.getElementById('metricaTotalItens');
    const elInativos = document.getElementById('metricaInativosValor');

    const chipTodos = document.getElementById('chipContadorTodos');
    const chipAtivos = document.getElementById('chipContadorAtivos');
    const chipInat = document.getElementById('chipContadorInativos');

    if (!todasLinhas || todasLinhas.length === 0) return;

    let tot = todasLinhas.length;
    let ativos = 0;
    let inat = 0;
    let somaItens = 0;

    todasLinhas.forEach(linha => {
      const st = linha.getAttribute('data-status') || '';
      const qtd = parseInt(linha.getAttribute('data-estoque'), 10) || 0;
      if (st === 'ativo' || linha.getAttribute('data-ativa') === 'true') {
        somaItens += qtd;
        ativos++;
      } else {
        inat++;
      }
    });

    if (elTotal && (!elTotal.textContent.trim() || elTotal.textContent.trim() === '')) elTotal.textContent = tot;
    if (elItens && (!elItens.textContent.trim() || elItens.textContent.trim() === '')) elItens.textContent = somaItens;
    if (elInativos && (!elInativos.textContent.trim() || elInativos.textContent.trim() === '')) elInativos.textContent = inat;

    if (chipTodos && !chipTodos.textContent.trim()) chipTodos.textContent = tot;
    if (chipAtivos && !chipAtivos.textContent.trim()) chipAtivos.textContent = ativos;
    if (chipInat && !chipInat.textContent.trim()) chipInat.textContent = inat;
  }

  atualizarMetricasNaTela();

  // Sincronizar contagens de inativos, ativos e total em segundo plano sem alterar o controller
  async function carregarContagensGlobais() {
    try {
      const elTotal = document.getElementById('metricaTotalValor');
      const elItens = document.getElementById('metricaTotalItens');
      const elInativos = document.getElementById('metricaInativosValor');
      const chipTodos = document.getElementById('chipContadorTodos');
      const chipAtivos = document.getElementById('chipContadorAtivos');
      const chipInat = document.getElementById('chipContadorInativos');

      const [resTodos, resAtivos, resInat] = await Promise.all([
        fetch('/produtos?status=todos'),
        fetch('/produtos?status=ativos'),
        fetch('/produtos?status=inativos')
      ]);

      if (resTodos.ok) {
        const htmlTodos = await resTodos.text();
        const doc = new DOMParser().parseFromString(htmlTodos, 'text/html');
        const count = parseInt(doc.getElementById('chipContadorTodos')?.textContent || doc.getElementById('metricaTotalValor')?.textContent, 10);
        if (!isNaN(count)) {
          if (elTotal) elTotal.textContent = count;
          if (chipTodos) chipTodos.textContent = count;
        }
      }

      if (resAtivos.ok) {
        const htmlAtivos = await resAtivos.text();
        const doc = new DOMParser().parseFromString(htmlAtivos, 'text/html');
        const count = parseInt(doc.getElementById('chipContadorAtivos')?.textContent || doc.getElementById('metricaTotalValor')?.textContent, 10);
        if (!isNaN(count)) {
          if (chipAtivos) chipAtivos.textContent = count;
        }
      }

      if (resInat.ok) {
        const htmlInat = await resInat.text();
        const doc = new DOMParser().parseFromString(htmlInat, 'text/html');
        const count = parseInt(doc.getElementById('chipContadorInativos')?.textContent || doc.getElementById('metricaInativosValor')?.textContent, 10);
        if (!isNaN(count)) {
          if (elInativos) elInativos.textContent = count;
          if (chipInat) chipInat.textContent = count;
        }
      }
    } catch (e) {
      console.warn('Erro ao sincronizar métricas:', e);
    }
  }

  carregarContagensGlobais();

  function filtrarTabelaLocal() {
    const termo = (busca && busca.value ? busca.value : '').toLowerCase().trim();
    let visiveis = 0;

    todasLinhas.forEach(linha => {
      const textoLinha = linha.textContent.toLowerCase();
      const matchTexto = !termo || textoLinha.includes(termo);

      if (matchTexto) {
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

  // Tecla ESC fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModalNovo();
      fecharModalDetalhe();
      fecharModalEditar();
      fecharModalToggle();
      fecharModalExcluir();
    }
  });
});