    let clientes = [
      { id: 1, nome: 'Ana Paula Ferreira', tipo: 'PF', categoria: 'Material Escolar', doc: 'CPF: 123.456.789-00', total: 'R$ 189,90', ativo: true },
      { id: 2, nome: 'Tech Soluções LTDA', tipo: 'PJ', categoria: 'Uniforme', doc: 'CNPJ: 12.345.678/0001-90', total: 'R$ 1.250,00', ativo: true },
      { id: 3, nome: 'Carlos Eduardo Lima', tipo: 'PF', categoria: 'Apostila', doc: 'CPF: 987.654.321-00', total: 'R$ 70,00', ativo: true },
      { id: 4, nome: 'Escola Estadual Bandeirante', tipo: 'PJ', categoria: 'Material Escolar', doc: 'CNPJ: 98.765.432/0001-10', total: 'R$ 3.420,00', ativo: true },
      { id: 5, nome: 'Fernanda Oliveira Costa', tipo: 'PF', categoria: 'Uniforme', doc: 'CPF: 456.123.789-00', total: 'R$ 239,70', ativo: false },
      { id: 6, nome: 'Grupo Educacional Alfa', tipo: 'PJ', categoria: 'Apostila', doc: 'CNPJ: 55.444.333/0001-22', total: 'R$ 875,00', ativo: true },
      { id: 7, nome: 'Roberto Alves Santos', tipo: 'PF', categoria: 'Material Escolar', doc: 'CPF: 321.654.987-00', total: 'R$ 95,50', ativo: true },
      { id: 8, nome: 'Instituto de Formação SENAI', tipo: 'PJ', categoria: 'Uniforme', doc: 'CNPJ: 11.222.333/0001-44', total: 'R$ 5.990,00', ativo: false },
      { id: 9, nome: 'Mariana Souza Pires', tipo: 'PF', categoria: 'Apostila', doc: 'CPF: 741.852.963-00', total: 'R$ 105,00', ativo: true },
      { id: 10, nome: 'Centro de Treinamento Avante', tipo: 'PJ', categoria: 'Material Escolar', doc: 'CNPJ: 77.888.999/0001-55', total: 'R$ 2.100,00', ativo: true },
    ];

    let filtroAtual = 'Todos';
    let editandoId = null;
    let proximoId = 11;

    function setFiltro(filtro, el) {
      filtroAtual = filtro;
      document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      el.classList.add('ativo');
      renderClientes();
    }

    function renderClientes() {
      const busca = document.getElementById('inputBusca').value.toLowerCase();
      const grade = document.getElementById('gradeClientes');

      const filtrados = clientes.filter(c => {
        const matchFiltro =
          filtroAtual === 'Todos' ||
          (filtroAtual === 'PF' && c.tipo === 'PF') ||
          (filtroAtual === 'PJ' && c.tipo === 'PJ') ||
          (filtroAtual === 'Inativo' && !c.ativo);
        const matchBusca = c.nome.toLowerCase().includes(busca) || c.doc.toLowerCase().includes(busca);
        return matchFiltro && matchBusca;
      });

      if (filtrados.length === 0) {
        grade.innerHTML = `
          <div class="estado-vazio">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Nenhum cliente encontrado.
          </div>`;
        return;
      }

      grade.innerHTML = filtrados.map((c, i) => `
        <div class="cartao-produto">
          <div class="produto-info">
            <div class="produto-numero">${i + 1}</div>
            <div class="produto-detalhes">
              <h3>${c.nome}</h3>
              <div class="produto-meta">
                <span>
                  <span class="tag-categoria">${c.categoria}</span>
                  ${!c.ativo ? '<span class="tag-inativo">Inativo</span>' : ''}
                </span>
                <span>${c.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} &nbsp;·&nbsp; ${c.doc}</span>
              </div>
            </div>
          </div>
          <div class="produto-direita">
            <div class="produto-preco">${c.total}</div>
            <div class="acoes-produto">
              <button class="btn-acao btn-editar" title="Editar" onclick="editarCliente(${c.id})">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-acao btn-excluir" title="Excluir" onclick="excluirCliente(${c.id})">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    function abrirModal(id = null) {
      editandoId = id;
      const modal = document.getElementById('modal');
      if (id) {
        const c = clientes.find(x => x.id === id);
        document.getElementById('modalTitulo').textContent = 'Editar Cliente';
        document.getElementById('inputNome').value = c.nome;
        document.getElementById('inputTipo').value = c.tipo;
        document.getElementById('inputCategoria').value = c.categoria;
        document.getElementById('inputDoc').value = c.doc.replace(/^(CPF|CNPJ): /, '');
        document.getElementById('inputTotal').value = c.total.replace('R$ ', '');
        document.getElementById('inputStatus').value = c.ativo ? 'ativo' : 'inativo';
      } else {
        document.getElementById('modalTitulo').textContent = 'Novo Cliente';
        document.getElementById('inputNome').value = '';
        document.getElementById('inputDoc').value = '';
        document.getElementById('inputTotal').value = '';
        document.getElementById('inputTipo').value = 'PF';
        document.getElementById('inputCategoria').value = 'Material Escolar';
        document.getElementById('inputStatus').value = 'ativo';
      }
      modal.classList.add('aberto');
    }

    function fecharModal() {
      document.getElementById('modal').classList.remove('aberto');
      editandoId = null;
    }

    function editarCliente(id) { abrirModal(id); }

    function excluirCliente(id) {
      clientes = clientes.filter(c => c.id !== id);
      renderClientes();
      mostrarToast('Cliente removido com sucesso!');
    }

    function salvarCliente() {
      const nome = document.getElementById('inputNome').value.trim();
      if (!nome) { alert('Informe o nome do cliente.'); return; }
      const tipo = document.getElementById('inputTipo').value;
      const categoria = document.getElementById('inputCategoria').value;
      const docRaw = document.getElementById('inputDoc').value.trim();
      const doc = (tipo === 'PF' ? 'CPF: ' : 'CNPJ: ') + docRaw;
      const totalRaw = document.getElementById('inputTotal').value.trim();
      const total = 'R$ ' + totalRaw;
      const ativo = document.getElementById('inputStatus').value === 'ativo';

      if (editandoId) {
        const idx = clientes.findIndex(c => c.id === editandoId);
        clientes[idx] = { ...clientes[idx], nome, tipo, categoria, doc, total, ativo };
        mostrarToast('Cliente atualizado com sucesso!');
      } else {
        clientes.push({ id: proximoId++, nome, tipo, categoria, doc, total, ativo });
        mostrarToast('Cliente cadastrado com sucesso!');
      }
      fecharModal();
      renderClientes();
    }

    function mostrarToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toastMensagem').textContent = msg;
      toast.classList.add('visivel');
      setTimeout(() => toast.classList.remove('visivel'), 3000);
    }

    // Fechar modal clicando fora
    document.getElementById('modal').addEventListener('click', function (e) {
      if (e.target === this) fecharModal();
    });

    renderClientes();
