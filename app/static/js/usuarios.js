/* =========================================================
   AAPM SENAI — Módulo de Usuários
   Data no cabeçalho e filtro de busca em tempo real na tabela
   ========================================================= */

// ── DATA NO CABEÇALHO ──
function exibirDataAtual() {
  const dataEl = document.getElementById('dataAtual');
  if (dataEl) {
    const agora = new Date();
    dataEl.textContent = agora.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}

// ── BUSCA EM TEMPO REAL NA TABELA ──
function filtrarTabela() {
  const campoBusca = document.getElementById('campoBusca');
  const termo = (campoBusca ? campoBusca.value : '').toLowerCase().trim();
  const linhas = document.querySelectorAll('#corpoTabela tr[data-nome]');
  let visiveis = 0;

  linhas.forEach(tr => {
    const nome = tr.dataset.nome || '';
    const email = tr.dataset.email || '';
    const exibe = nome.includes(termo) || email.includes(termo);
    tr.style.display = exibe ? '' : 'none';
    if (exibe) visiveis++;
  });

  const cont = document.getElementById('contagemUsuarios');
  if (cont) {
    cont.textContent = `${visiveis} usuário${visiveis !== 1 ? 's' : ''}`;
  }
}

// ── INICIALIZAÇÃO ──
document.addEventListener('DOMContentLoaded', () => {
  exibirDataAtual();
  filtrarTabela();
});

// Exposição global
window.filtrarTabela = filtrarTabela;