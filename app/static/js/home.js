   // ── Dados iniciais ──────────────────────────────────────────────
        let produtos = [
            { id: 1, nome: 'Caderno Universitário SENAI', categoria: 'Material Escolar', preco: 18.90, quantidade: 100 },
            { id: 2, nome: 'Lápis HB Faber-Castell', categoria: 'Material Escolar', preco: 2.50, quantidade: 300 },
            { id: 3, nome: 'Caneta Azul Bic', categoria: 'Material Escolar', preco: 3.00, quantidade: 250 },
            { id: 4, nome: 'Mochila Escolar SENAI', categoria: 'Material Escolar', preco: 89.90, quantidade: 40 },
            { id: 5, nome: 'Régua 30cm', categoria: 'Material Escolar', preco: 4.50, quantidade: 60 },
            { id: 6, nome: 'Kit Estojo Completo', categoria: 'Uniforme', preco: 22.00, quantidade: 60 },
            { id: 7, nome: 'Apostila Técnica SENAI', categoria: 'Apostila', preco: 35.00, quantidade: 70 },
            { id: 8, nome: 'Camiseta Uniforme SENAI', categoria: 'Uniforme', preco: 59.90, quantidade: 80 },
            { id: 9, nome: 'Calça Uniforme SENAI', categoria: 'Uniforme', preco: 79.90, quantidade: 90 },
            { id: 10, nome: 'Jaleco Branco SENAI', categoria: 'Uniforme', preco: 69.90, quantidade: 40 },
        ];

        let proximoId = 11;
        let categoriaAtiva = 'todos';
        let termoBusca = '';
        let paginaAtual = 1;
        const itensPorPagina = 10;
        let indiceEdicao = null;

        // ── Renderizar produtos ─────────────────────────────────────────
        function produtosFiltrados() {
            return produtos.filter(p => {
                const correspondeCategoria = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
                const correspondeBusca = p.nome.toLowerCase().includes(termoBusca.toLowerCase());
                return correspondeCategoria && correspondeBusca;
            });
        }

        function renderizarProdutos() {
            const lista = produtosFiltrados();
            const totalPaginas = Math.max(1, Math.ceil(lista.length / itensPorPagina));
            if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

            const inicio = (paginaAtual - 1) * itensPorPagina;
            const paginados = lista.slice(inicio, inicio + itensPorPagina);

            const grade = document.getElementById('gradeProdutos');
            grade.innerHTML = '';

            if (paginados.length === 0) {
                grade.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:#aaa;font-size:0.92rem;">Nenhum produto encontrado.</div>`;
            } else {
                paginados.forEach((produto, i) => {
                    const numero = inicio + i + 1;
                    const card = document.createElement('div');
                    card.className = 'cartao-produto';
                    card.style.animationDelay = `${i * 0.04}s`;
                    card.innerHTML = `
          <div class="produto-info">
            <span class="produto-numero">${numero}</span>
            <div class="produto-detalhes">
              <h3>${produto.nome}</h3>
              <div class="produto-meta">
                <span><span class="tag-categoria">${produto.categoria}</span></span>
                <span>Qtd: <strong>${produto.quantidade}</strong></span>
              </div>
            </div>
          </div>
          <div class="produto-direita">
            <span class="produto-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
            <div class="acoes-produto">
              <button class="btn-acao btn-editar" onclick="abrirEdicao(${produto.id})" title="Editar">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-acao btn-excluir" onclick="excluirProduto(${produto.id})" title="Excluir">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        `;
                    grade.appendChild(card);
                });
            }

            renderizarPaginacao(totalPaginas);
        }

        // ── Paginação ───────────────────────────────────────────────────
        function renderizarPaginacao(total) {
            const cont = document.getElementById('paginacao');
            cont.innerHTML = '';

            // Anterior
            const btnAnterior = document.createElement('button');
            btnAnterior.className = 'btn-pagina';
            btnAnterior.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`;
            btnAnterior.disabled = paginaAtual === 1;
            btnAnterior.style.opacity = paginaAtual === 1 ? '0.35' : '1';
            btnAnterior.onclick = () => { if (paginaAtual > 1) { paginaAtual--; renderizarProdutos(); } };
            cont.appendChild(btnAnterior);

            for (let i = 1; i <= total; i++) {
                const btn = document.createElement('button');
                btn.className = 'btn-pagina' + (i === paginaAtual ? ' ativo' : '');
                btn.textContent = i;
                btn.onclick = () => { paginaAtual = i; renderizarProdutos(); };
                cont.appendChild(btn);
            }

            // Próximo
            const btnProximo = document.createElement('button');
            btnProximo.className = 'btn-pagina';
            btnProximo.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`;
            btnProximo.disabled = paginaAtual === total;
            btnProximo.style.opacity = paginaAtual === total ? '0.35' : '1';
            btnProximo.onclick = () => { if (paginaAtual < total) { paginaAtual++; renderizarProdutos(); } };
            cont.appendChild(btnProximo);
        }

        // ── Filtros ─────────────────────────────────────────────────────
        function filtrarCategoria(categoria, botao) {
            categoriaAtiva = categoria;
            paginaAtual = 1;
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');
            renderizarProdutos();
        }

        function filtrarProdutos() {
            termoBusca = document.getElementById('campoBusca').value;
            paginaAtual = 1;
            renderizarProdutos();
        }

        // ── Modal ───────────────────────────────────────────────────────
        function abrirModal() {
            indiceEdicao = null;
            document.getElementById('modalTitulo').textContent = 'Novo Produto';
            document.getElementById('modalNome').value = '';
            document.getElementById('modalCategoria').value = 'Material Escolar';
            document.getElementById('modalPreco').value = '';
            document.getElementById('modalQuantidade').value = '';
            document.getElementById('modalSobreposicao').classList.add('aberto');
        }

        function abrirEdicao(id) {
            const produto = produtos.find(p => p.id === id);
            if (!produto) return;
            indiceEdicao = id;
            document.getElementById('modalTitulo').textContent = 'Editar Produto';
            document.getElementById('modalNome').value = produto.nome;
            document.getElementById('modalCategoria').value = produto.categoria;
            document.getElementById('modalPreco').value = produto.preco;
            document.getElementById('modalQuantidade').value = produto.quantidade;
            document.getElementById('modalSobreposicao').classList.add('aberto');
        }

        function fecharModal() {
            document.getElementById('modalSobreposicao').classList.remove('aberto');
        }

        function fecharModalFora(e) {
            if (e.target === document.getElementById('modalSobreposicao')) fecharModal();
        }

        function salvarProduto() {
            const nome = document.getElementById('modalNome').value.trim();
            const categoria = document.getElementById('modalCategoria').value;
            const preco = parseFloat(document.getElementById('modalPreco').value);
            const quantidade = parseInt(document.getElementById('modalQuantidade').value);

            if (!nome || isNaN(preco) || isNaN(quantidade)) {
                exibirToast('Preencha todos os campos corretamente.', false);
                return;
            }

            if (indiceEdicao !== null) {
                const idx = produtos.findIndex(p => p.id === indiceEdicao);
                produtos[idx] = { ...produtos[idx], nome, categoria, preco, quantidade };
                exibirToast('Produto atualizado com sucesso!');
            } else {
                produtos.push({ id: proximoId++, nome, categoria, preco, quantidade });
                exibirToast('Produto adicionado com sucesso!');
            }

            fecharModal();
            renderizarProdutos();
        }

        // ── Excluir ─────────────────────────────────────────────────────
        function excluirProduto(id) {
            if (!confirm('Deseja realmente excluir este produto?')) return;
            produtos = produtos.filter(p => p.id !== id);
            renderizarProdutos();
            exibirToast('Produto removido do estoque.');
        }

        // ── Toast ────────────────────────────────────────────────────────
        function exibirToast(mensagem, sucesso = true) {
            const toast = document.getElementById('toast');
            const icone = toast.querySelector('.toast-icone');
            document.getElementById('toastMensagem').textContent = mensagem;
            icone.style.background = sucesso ? '#22c55e' : '#ef4444';
            toast.classList.add('visivel');
            setTimeout(() => toast.classList.remove('visivel'), 3000);
        }

        // ── Troca de seção (simulada) ────────────────────────────────────
        function trocarSecao(secao, elemento) {
            document.querySelectorAll('.barra-nav a').forEach(a => a.classList.remove('ativo'));
            elemento.classList.add('ativo');
            document.getElementById('tituloPagina').textContent =
                elemento.textContent.trim();

            if (secao === 'adicionar') {
                setTimeout(abrirModal, 100);
                // Volta o ativo para estoque visualmente
                document.querySelectorAll('.barra-nav a').forEach(a => {
                    if (a.textContent.trim() === 'Estoque') a.classList.add('ativo');
                });
                elemento.classList.remove('ativo');
                document.getElementById('tituloPagina').textContent = 'Estoque';
            }
        }

        // ── Init ─────────────────────────────────────────────────────────
        renderizarProdutos();