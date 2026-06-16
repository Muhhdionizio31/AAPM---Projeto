 // ── Filtro de status (client-side) ────────────────────────────────
  function filtrar(status, botao) {
    document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
    botao.classList.add('ativo');

    const linhas = document.querySelectorAll('#corpoTabela tr[data-status]');
    let visiveis = 0;

    linhas.forEach(tr => {
      const mostrar = status === 'todos' || tr.dataset.status === status;
      tr.style.display = mostrar ? '' : 'none';
      if (mostrar) visiveis++;
    });

    document.getElementById('infoTabela').textContent =
      visiveis + ' categoria' + (visiveis !== 1 ? 's' : '');
  }

  // ── Modais de confirmação ─────────────────────────────────────────
  function confirmarToggle(botao, nome) {
    // Sobe até o <form> que contém o botão e o submete ao confirmar
    const form = botao.closest('form');
    document.getElementById('nomeDesativar').textContent = '"' + nome + '"';
    document.getElementById('btnConfirmarDesativar').onclick = () => form.submit();
    document.getElementById('modalDesativar').classList.add('aberto');
  }

  function confirmarExclusao(botao, nome) {
    const form = botao.closest('form');
    document.getElementById('nomeExcluir').textContent = '"' + nome + '"';
    document.getElementById('btnConfirmarExcluir').onclick = () => form.submit();
    document.getElementById('modalExcluir').classList.add('aberto');
  }

  function fecharModal(id) {
    document.getElementById(id).classList.remove('aberto');
  }

  // Fecha ao clicar fora
  document.querySelectorAll('.sobreposicao-modal').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('aberto'); });
  });