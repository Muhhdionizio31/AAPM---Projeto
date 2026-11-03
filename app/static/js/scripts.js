// ==========================================================================
// AAPM · SENAI — Scripts do Site Público
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const btnTopo = document.getElementById('btn-voltar-topo');
  if (!btnTopo) return;

  let ticking = false;

  // Atualiza visibilidade com base no scroll da janela
  const atualizarVisibilidade = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 220) {
      btnTopo.classList.add('visivel');
    } else {
      btnTopo.classList.remove('visivel');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(atualizarVisibilidade);
      ticking = true;
    }
  }, { passive: true });

  // Ao clicar na bolinha, rola suavemente até o topo
  btnTopo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Checagem no carregamento inicial da página
  atualizarVisibilidade();
});
