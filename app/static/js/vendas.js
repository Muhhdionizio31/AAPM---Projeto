// ── Catálogo de produtos (mesmo do estoque) ──────────────────────
  const catalogo = [
    { nome: 'Caderno Universitário SENAI', preco: 18.90 },
    { nome: 'Lápis HB Faber-Castell',      preco: 2.50  },
    { nome: 'Caneta Azul Bic',              preco: 3.00  },
    { nome: 'Mochila Escolar SENAI',        preco: 89.90 },
    { nome: 'Régua 30cm',                   preco: 4.50  },
    { nome: 'Kit Estojo Completo',          preco: 22.00 },
    { nome: 'Apostila Técnica SENAI',       preco: 35.00 },
    { nome: 'Camiseta Uniforme SENAI',      preco: 59.90 },
    { nome: 'Calça Uniforme SENAI',         preco: 79.90 },
    { nome: 'Jaleco Branco SENAI',          preco: 69.90 },
  ];

  // ── Vendas iniciais ──────────────────────────────────────────────
  let vendas = [
    { id: 'V-001', cliente: 'Ana Paula Silva',    itens: [{nome:'Caderno Universitário SENAI',qtd:2,preco:18.90},{nome:'Caneta Azul Bic',qtd:3,preco:3.00}], pagamento:'PIX',            status:'concluido', data:'2026-06-01' },
    { id: 'V-002', cliente: 'Bruno Mendes',        itens: [{nome:'Camiseta Uniforme SENAI',qtd:1,preco:59.90},{nome:'Calça Uniforme SENAI',qtd:1,preco:79.90}], pagamento:'Cartão de Crédito', status:'concluido', data:'2026-06-01' },
    { id: 'V-003', cliente: 'Carla Ferreira',      itens: [{nome:'Apostila Técnica SENAI',qtd:2,preco:35.00}], pagamento:'Dinheiro',        status:'pendente',  data:'2026-06-02' },
    { id: 'V-004', cliente: 'Diego Souza',         itens: [{nome:'Mochila Escolar SENAI',qtd:1,preco:89.90},{nome:'Régua 30cm',qtd:1,preco:4.50}], pagamento:'PIX',            status:'concluido', data:'2026-06-02' },
    { id: 'V-005', cliente: 'Eduarda Lima',        itens: [{nome:'Kit Estojo Completo',qtd:2,preco:22.00},{nome:'Lápis HB Faber-Castell',qtd:5,preco:2.50}], pagamento:'Cartão de Débito', status:'concluido', data:'2026-06-03' },
    { id: 'V-006', cliente: 'Felipe Torres',       itens: [{nome:'Jaleco Branco SENAI',qtd:1,preco:69.90}], pagamento:'PIX',            status:'cancelado', data:'2026-06-03' },
    { id: 'V-007', cliente: 'Gabriela Rocha',      itens: [{nome:'Caderno Universitário SENAI',qtd:3,preco:18.90},{nome:'Caneta Azul Bic',qtd:2,preco:3.00}], pagamento:'Dinheiro',        status:'concluido', data:'2026-06-04' },
    { id: 'V-008', cliente: 'Henrique Alves',      itens: [{nome:'Camiseta Uniforme SENAI',qtd:2,preco:59.90}], pagamento:'Cartão de Crédito', status:'pendente',  data:'2026-06-04' },
    { id: 'V-009', cliente: 'Isabela Costa',       itens: [{nome:'Apostila Técnica SENAI',qtd:1,preco:35.00},{nome:'Régua 30cm',qtd:2,preco:4.50}], pagamento:'PIX',            status:'concluido', data:'2026-06-05' },
    { id: 'V-010', cliente: 'João Pedro Nunes',    itens: [{nome:'Calça Uniforme SENAI',qtd:2,preco:79.90},{nome:'Jaleco Branco SENAI',qtd:1,preco:69.90}], pagamento:'Cartão de Débito', status:'concluido', data:'2026-06-05' },
    { id: 'V-011', cliente: 'Karen Batista',       itens: [{nome:'Mochila Escolar SENAI',qtd:1,preco:89.90}], pagamento:'PIX',            status:'concluido', data:'2026-06-06' },
    { id: 'V-012', cliente: 'Lucas Martins',       itens: [{nome:'Kit Estojo Completo',qtd:3,preco:22.00},{nome:'Caneta Azul Bic',qtd:4,preco:3.00}], pagamento:'Dinheiro',        status:'pendente',  data:'2026-06-06' },
  ];

  let proximoNumVenda = 13;
  let paginaAtual = 1;
  const itensPorPagina = 8;
  let idEdicao = null;

  // ── Helpers ─────────────────────────────────────────────────────
  const totalVenda = v => v.itens.reduce((s, i) => s + i.qtd * i.preco, 0);
  const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const fmtData = d => d.split('-').reverse().join('/');

  function vendasFiltradas() {
    const mes = document.getElementById('filtroMes').value;
    const busca = document.getElementById('campoBusca').value.toLowerCase();
    return vendas.filter(v => {
      const correspMes   = !mes || v.data.startsWith(mes);
      const correspBusca = !busca || v.cliente.toLowerCase().includes(busca) || v.id.toLowerCase().includes(busca);
      return correspMes && correspBusca;
    });
  }

  // ── Resumo ───────────────────────────────────────────────────────
  function renderizarResumo() {
    const lista = vendasFiltradas();
    const concluidas = lista.filter(v => v.status === 'concluido');
    const pendentes  = lista.filter(v => v.status === 'pendente');
    const faturamento = concluidas.reduce((s, v) => s + totalVenda(v), 0);
    const clientesUnicos = new Set(lista.map(v => v.cliente)).size;

    document.getElementById('resumoFaturamento').textContent = fmt(faturamento);
    document.getElementById('resumoConcluidas').textContent  = concluidas.length;
    document.getElementById('resumoPendentes').textContent   = pendentes.length;
    document.getElementById('resumoClientes').textContent    = clientesUnicos;
  }

  // ── Tabela ───────────────────────────────────────────────────────
  function renderizarTabela() {
    const lista = vendasFiltradas();
    const total = Math.max(1, Math.ceil(lista.length / itensPorPagina));
    if (paginaAtual > total) paginaAtual = total;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const paginados = lista.slice(inicio, inicio + itensPorPagina);

    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    if (paginados.length === 0) {
      corpo.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#aaa;font-size:0.88rem;">Nenhuma venda encontrada.</td></tr>`;
    } else {
      paginados.forEach((v, i) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${i * 0.03}s`;
        const nItens = v.itens.reduce((s, it) => s + it.qtd, 0);
        tr.innerHTML = `
          <td class="celula-codigo">${v.id}</td>
          <td class="celula-cliente">
            <strong>${v.cliente}</strong>
            <span>${fmtData(v.data)}</span>
          </td>
          <td style="font-size:0.82rem;color:#888;">${nItens} item(ns)</td>
          <td style="font-size:0.82rem;">${fmtData(v.data)}</td>
          <td class="celula-valor">${fmt(totalVenda(v))}</td>
          <td style="font-size:0.82rem;">${v.pagamento}</td>
          <td><span class="badge-status ${v.status}">${v.status.charAt(0).toUpperCase()+v.status.slice(1)}</span></td>
          <td>
            <div class="acoes-tabela">
              <button class="btn-acao btn-ver"     onclick="verDetalhe('${v.id}')" title="Ver detalhe">
                <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="btn-acao btn-editar"  onclick="editarVenda('${v.id}')" title="Editar">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-acao btn-excluir" onclick="excluirVenda('${v.id}')" title="Excluir">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        `;
        corpo.appendChild(tr);
      });
    }

    document.getElementById('infoTabela').textContent = `${lista.length} venda${lista.length !== 1 ? 's' : ''}`;
    renderizarPaginacao(total, lista.length);
  }

  // ── Paginação ────────────────────────────────────────────────────
  function renderizarPaginacao(total) {
    const cont = document.getElementById('paginacao');
    cont.innerHTML = '';

    const btnAnt = document.createElement('button');
    btnAnt.className = 'btn-pagina';
    btnAnt.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`;
    btnAnt.disabled = paginaAtual === 1;
    btnAnt.style.opacity = paginaAtual === 1 ? '0.35' : '1';
    btnAnt.onclick = () => { if (paginaAtual > 1) { paginaAtual--; renderizarTabela(); } };
    cont.appendChild(btnAnt);

    for (let i = 1; i <= total; i++) {
      const btn = document.createElement('button');
      btn.className = 'btn-pagina' + (i === paginaAtual ? ' ativo' : '');
      btn.textContent = i;
      btn.onclick = () => { paginaAtual = i; renderizarTabela(); };
      cont.appendChild(btn);
    }

    const btnProx = document.createElement('button');
    btnProx.className = 'btn-pagina';
    btnProx.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`;
    btnProx.disabled = paginaAtual === total;
    btnProx.style.opacity = paginaAtual === total ? '0.35' : '1';
    btnProx.onclick = () => { if (paginaAtual < total) { paginaAtual++; renderizarTabela(); } };
    cont.appendChild(btnProx);
  }

  // ── Mais vendidos ────────────────────────────────────────────────
  function renderizarMaisVendidos() {
    const contagem = {};
    vendasFiltradas().filter(v => v.status !== 'cancelado').forEach(v => {
      v.itens.forEach(it => {
        contagem[it.nome] = (contagem[it.nome] || 0) + it.qtd;
      });
    });

    const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxQtd = ordenados[0]?.[1] || 1;
    const cont = document.getElementById('listaMaisVendidos');
    cont.innerHTML = '';

    if (ordenados.length === 0) {
      cont.innerHTML = `<div style="padding:20px;text-align:center;color:#aaa;font-size:0.82rem;">Sem dados</div>`;
      return;
    }

    ordenados.forEach(([nome, qtd], idx) => {
      const classes = ['top1','top2','top3','',''][idx] || '';
      cont.innerHTML += `
        <div class="item-top">
          <span class="ranking-numero ${classes}">${idx + 1}</span>
          <div class="item-top-info">
            <strong>${nome}</strong>
            <small>${qtd} unidade${qtd !== 1 ? 's' : ''} vendida${qtd !== 1 ? 's' : ''}</small>
          </div>
          <span class="item-top-qtd">${qtd}x</span>
        </div>
        <div class="barra-progresso-wrap">
          <div class="barra-progresso">
            <div class="barra-progresso-fill" style="width:${(qtd/maxQtd*100).toFixed(0)}%"></div>
          </div>
        </div>
      `;
    });
  }

  // ── Métodos de pagamento ─────────────────────────────────────────
  function renderizarPagamentos() {
    const concluidasLista = vendasFiltradas().filter(v => v.status === 'concluido');
    const totais = {};
    const valores = {};
    concluidasLista.forEach(v => {
      totais[v.pagamento]  = (totais[v.pagamento]  || 0) + 1;
      valores[v.pagamento] = (valores[v.pagamento] || 0) + totalVenda(v);
    });

    const icones = {
      'PIX':               { svg: `<svg viewBox="0 0 24 24"><path d="M4 4l16 16"/><path d="M20 4L4 20"/></svg>`, classe: 'verde'   },
      'Cartão de Crédito': { svg: `<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`, classe: 'azul'    },
      'Cartão de Débito':  { svg: `<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`, classe: 'amarelo' },
      'Dinheiro':          { svg: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`, classe: 'vermelho' },
    };

    const totalGeral = Object.values(valores).reduce((s, v) => s + v, 0);
    const cont = document.getElementById('listaPagamentos');
    cont.innerHTML = '';

    if (Object.keys(totais).length === 0) {
      cont.innerHTML = `<div style="padding:20px;text-align:center;color:#aaa;font-size:0.82rem;">Sem dados</div>`;
      return;
    }

    Object.entries(totais).sort((a, b) => b[1] - a[1]).forEach(([metodo, qtd]) => {
      const icone = icones[metodo] || icones['Dinheiro'];
      const perc  = totalGeral > 0 ? ((valores[metodo] / totalGeral) * 100).toFixed(0) : 0;
      cont.innerHTML += `
        <div class="item-pagamento">
          <div class="pagamento-esquerda">
            <div class="pagamento-icone ${icone.classe}">${icone.svg}</div>
            <div>
              <div class="pagamento-nome">${metodo}</div>
              <div class="pagamento-perc">${qtd} venda${qtd !== 1 ? 's' : ''} · ${perc}%</div>
            </div>
          </div>
          <span class="pagamento-valor">${fmt(valores[metodo])}</span>
        </div>
      `;
    });
  }

  // ── Renderizar tudo ──────────────────────────────────────────────
  function renderizarTudo() {
    paginaAtual = 1;
    renderizarResumo();
    renderizarTabela();
    renderizarMaisVendidos();
    renderizarPagamentos();
  }

  // ── Modal nova venda ─────────────────────────────────────────────
  function abrirModalVenda() {
    idEdicao = null;
    document.getElementById('modalTitulo').textContent = 'Nova Venda';
    document.getElementById('modalCliente').value  = '';
    document.getElementById('modalData').value     = new Date().toISOString().split('T')[0];
    document.getElementById('modalPagamento').value = 'PIX';
    document.getElementById('modalStatus').value   = 'concluido';
    document.getElementById('listaItensModal').innerHTML = '';
    adicionarLinhaItem();
    calcularTotal();
    document.getElementById('modalVenda').classList.add('aberto');
  }

  function editarVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;
    idEdicao = id;
    document.getElementById('modalTitulo').textContent = 'Editar Venda';
    document.getElementById('modalCliente').value   = venda.cliente;
    document.getElementById('modalData').value      = venda.data;
    document.getElementById('modalPagamento').value = venda.pagamento;
    document.getElementById('modalStatus').value    = venda.status;
    document.getElementById('listaItensModal').innerHTML = '';
    venda.itens.forEach(it => adicionarLinhaItem(it));
    calcularTotal();
    document.getElementById('modalVenda').classList.add('aberto');
  }

  // ── Itens do modal ───────────────────────────────────────────────
  function adicionarLinhaItem(item = null) {
    const lista = document.getElementById('listaItensModal');
    const div = document.createElement('div');
    div.className = 'item-modal-linha';

    const opcoes = catalogo.map(p =>
      `<option value="${p.nome}" data-preco="${p.preco}" ${item && item.nome === p.nome ? 'selected' : ''}>${p.nome}</option>`
    ).join('');

    div.innerHTML = `
      <select onchange="calcularTotal()">
        ${opcoes}
      </select>
      <input type="number" value="${item ? item.qtd : 1}" min="1" placeholder="Qtd" oninput="calcularTotal()"/>
      <input type="number" value="${item ? item.preco.toFixed(2) : catalogo[0].preco.toFixed(2)}" min="0" step="0.01" placeholder="Preço" oninput="calcularTotal()"/>
      <button class="btn-remover-item" onclick="this.closest('.item-modal-linha').remove(); calcularTotal()">✕</button>
    `;

    // Ao trocar o produto, atualiza o preço automaticamente
    div.querySelector('select').addEventListener('change', function() {
      const prod = catalogo.find(p => p.nome === this.value);
      if (prod) div.querySelectorAll('input')[1].value = prod.preco.toFixed(2);
      calcularTotal();
    });

    lista.appendChild(div);
    calcularTotal();
  }

  function calcularTotal() {
    let total = 0;
    document.querySelectorAll('.item-modal-linha').forEach(linha => {
      const qtd   = parseFloat(linha.querySelectorAll('input')[0].value) || 0;
      const preco = parseFloat(linha.querySelectorAll('input')[1].value) || 0;
      total += qtd * preco;
    });
    document.getElementById('totalModal').textContent = fmt(total);
  }

  function salvarVenda() {
    const cliente   = document.getElementById('modalCliente').value.trim();
    const data      = document.getElementById('modalData').value;
    const pagamento = document.getElementById('modalPagamento').value;
    const status    = document.getElementById('modalStatus').value;

    if (!cliente || !data) {
      exibirToast('Preencha cliente e data.', false);
      return;
    }

    const linhas = document.querySelectorAll('.item-modal-linha');
    if (linhas.length === 0) {
      exibirToast('Adicione ao menos um item.', false);
      return;
    }

    const itens = [];
    linhas.forEach(linha => {
      const nome  = linha.querySelector('select').value;
      const qtd   = parseInt(linha.querySelectorAll('input')[0].value) || 1;
      const preco = parseFloat(linha.querySelectorAll('input')[1].value) || 0;
      itens.push({ nome, qtd, preco });
    });

    if (idEdicao) {
      const idx = vendas.findIndex(v => v.id === idEdicao);
      vendas[idx] = { ...vendas[idx], cliente, data, pagamento, status, itens };
      exibirToast('Venda atualizada com sucesso!');
    } else {
      const novoId = 'V-' + String(proximoNumVenda++).padStart(3, '0');
      vendas.unshift({ id: novoId, cliente, data, pagamento, status, itens });
      exibirToast('Venda registrada com sucesso!');
    }

    fecharModal('modalVenda');
    renderizarTudo();
  }

  // ── Detalhe ──────────────────────────────────────────────────────
  function verDetalhe(id) {
    const v = vendas.find(v => v.id === id);
    if (!v) return;
    const totalV = totalVenda(v);
    let itensHtml = v.itens.map(it => `
      <div class="detalhe-linha">
        <span>${it.nome} × ${it.qtd}</span>
        <span>${fmt(it.qtd * it.preco)}</span>
      </div>
    `).join('');

    document.getElementById('conteudoDetalhe').innerHTML = `
      <div class="detalhe-secao">
        <h3>Informações</h3>
        <div class="detalhe-linha"><span>Código</span><span>${v.id}</span></div>
        <div class="detalhe-linha"><span>Cliente</span><span>${v.cliente}</span></div>
        <div class="detalhe-linha"><span>Data</span><span>${fmtData(v.data)}</span></div>
        <div class="detalhe-linha"><span>Pagamento</span><span>${v.pagamento}</span></div>
        <div class="detalhe-linha"><span>Status</span><span><span class="badge-status ${v.status}">${v.status.charAt(0).toUpperCase()+v.status.slice(1)}</span></span></div>
      </div>
      <div class="detalhe-secao">
        <h3>Itens</h3>
        ${itensHtml}
      </div>
      <div class="detalhe-total">
        <span class="rotulo">Total</span>
        <span class="valor">${fmt(totalV)}</span>
      </div>
    `;
    document.getElementById('modalDetalhe').classList.add('aberto');
  }

  // ── Excluir ──────────────────────────────────────────────────────
  function excluirVenda(id) {
    if (!confirm('Deseja realmente excluir esta venda?')) return;
    vendas = vendas.filter(v => v.id !== id);
    renderizarTudo();
    exibirToast('Venda removida.');
  }

  // ── Modal helpers ────────────────────────────────────────────────
  function fecharModal(id) {
    document.getElementById(id).classList.remove('aberto');
  }

  function fecharModalFora(e, id) {
    if (e.target === document.getElementById(id)) fecharModal(id);
  }

  // ── Toast ────────────────────────────────────────────────────────
  function exibirToast(mensagem, sucesso = true) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-icone').style.background = sucesso ? '#22c55e' : '#ef4444';
    document.getElementById('toastMensagem').textContent = mensagem;
    toast.classList.add('visivel');
    setTimeout(() => toast.classList.remove('visivel'), 3000);
  }

  // ── Init ─────────────────────────────────────────────────────────
  document.getElementById('filtroMes').value = new Date().toISOString().slice(0, 7);
  renderizarTudo();