// ==========================================================================
// AAPM · SENAI — Gerenciador Global de Transições (Scroll & Troca de Tela)
// ==========================================================================

(function () {
  'use strict';

  // Se o usuário prefere movimento reduzido, desativa animações
  const prefereReduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Inicializa elementos visuais de transição (Barra de Scroll, Loader e Botão Topo)
  function inicializarElementos() {
    // Barra de progresso de scroll
    let barraScroll = document.getElementById('transicao-scroll-progresso');
    if (!barraScroll && !prefereReduzido) {
      barraScroll = document.createElement('div');
      barraScroll.id = 'transicao-scroll-progresso';
      barraScroll.setAttribute('aria-hidden', 'true');
      document.body.prepend(barraScroll);
    }

    // Barra de loading para troca de tela
    let loaderTela = document.getElementById('transicao-pagina-loader');
    if (!loaderTela && !prefereReduzido) {
      loaderTela = document.createElement('div');
      loaderTela.id = 'transicao-pagina-loader';
      loaderTela.setAttribute('aria-hidden', 'true');
      document.body.prepend(loaderTela);
    }

    // Botão Voltar ao Topo
    let btnTopo = document.getElementById('btn-voltar-topo');
    if (!btnTopo && !prefereReduzido) {
      btnTopo = document.createElement('button');
      btnTopo.id = 'btn-voltar-topo';
      btnTopo.type = 'button';
      btnTopo.setAttribute('aria-label', 'Voltar ao topo');
      btnTopo.setAttribute('title', 'Voltar ao topo');
      btnTopo.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
      document.body.appendChild(btnTopo);

      btnTopo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    return { barraScroll, loaderTela, btnTopo };
  }

  // 2. Transições e Indicador de Scroll
  function configurarScroll(barraScroll, btnTopo) {
    let ticking = false;

    function atualizarScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Atualiza barra superior de progresso de scroll
      if (barraScroll) {
        const progresso = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
        barraScroll.style.transform = `scaleX(${progresso})`;
      }

      // Mostra/Oculta botão voltar ao topo (após 240px de rolagem)
      if (btnTopo) {
        if (scrollTop > 240) {
          btnTopo.classList.add('visivel');
        } else {
          btnTopo.classList.remove('visivel');
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(atualizarScroll);
        ticking = true;
      }
    }, { passive: true });

    // Atualização inicial
    atualizarScroll();

    // Scroll Reveal para elementos das páginas
    configurarScrollReveal();

    // Suporte a rolagem suave para links âncora (#secao)
    configurarLinksAncora();
  }

  // 3. Configura Reveal Suave nos elementos ao rolar a página
  function configurarScrollReveal() {
    if (prefereReduzido || !('IntersectionObserver' in window)) return;

    // Seletores padrão de cards, blocos, tabelas e seções
    const seletores = [
      '.card-metrica',
      '.bloco-boas-vindas',
      '.armarios-card',
      '.card-tabela',
      '.painel-card',
      '.secao-info',
      '.card-item',
      '.card-cliente',
      '.produto-card',
      '.grade-metricas > div',
      '.tabela-container',
      '.grafico-card'
    ];

    const elementos = document.querySelectorAll(seletores.join(', '));
    if (elementos.length === 0) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-revelado');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    elementos.forEach(el => {
      const rect = el.getBoundingClientRect();
      el.classList.add('scroll-revelar');
      // Se já está no viewport inicial, revela imediatamente
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('scroll-revelado');
      } else {
        observer.observe(el);
      }
    });
  }

  // 4. Rolagem suave para âncoras internas (#)
  function configurarLinksAncora() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      try {
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (history.pushState) {
            history.pushState(null, '', hash);
          }
        }
      } catch (err) {
        // Ignora seletores especiais inválidos
      }
    });
  }

  // 5. Transições de Troca de Tela (Page Navigation Transitions)
  function configurarTrocaDeTela(loaderTela) {
    if (prefereReduzido) return;

    // Animação de entrada suave ao carregar
    document.body.classList.add('pagina-entrando');
    setTimeout(() => {
      document.body.classList.remove('pagina-entrando');
    }, 350);

    // Suporte ao BFCache (botão Voltar/Avançar do navegador)
    window.addEventListener('pageshow', (event) => {
      document.body.classList.remove('pagina-saindo');
      if (loaderTela) {
        loaderTela.classList.remove('ativo');
        loaderTela.style.width = '0%';
      }
    });

    // Intercepta cliques em links internos para transição suave de saída
    document.addEventListener('click', (e) => {
      // Se tecla modificadora (nova aba) ou evento cancelado
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignora links especiais, âncoras puras, downloads, chamadas JS e modais
      if (
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        link.dataset.noTransition !== undefined ||
        link.getAttribute('onclick') !== null
      ) {
        return;
      }

      // Valida se o link é para o mesmo domínio
      try {
        const urlDestino = new URL(link.href, window.location.origin);
        if (urlDestino.origin !== window.location.origin) return;

        // Se for a mesma página com hash
        if (
          urlDestino.pathname === window.location.pathname &&
          urlDestino.search === window.location.search &&
          urlDestino.hash
        ) {
          return;
        }

        // Se for o mesmo link exato
        if (urlDestino.href === window.location.href) {
          return;
        }

        // Executa a transição suave de saída
        e.preventDefault();

        // Inicia o loader de barra superior
        if (loaderTela) {
          loaderTela.classList.add('ativo');
          loaderTela.style.width = '35%';
          setTimeout(() => {
            if (loaderTela.classList.contains('ativo')) {
              loaderTela.style.width = '85%';
            }
          }, 60);
        }

        // Inicia animação de saída suave do body
        document.body.classList.add('pagina-saindo');

        // Navega após a transição rápida (160ms)
        setTimeout(() => {
          if (loaderTela) loaderTela.style.width = '100%';
          window.location.href = urlDestino.href;
        }, 160);
      } catch (err) {
        // Fallback para navegação padrão se URL for inválida
      }
    });
  }

  // Inicialização quando o DOM estiver pronto
  function iniciar() {
    const elementos = inicializarElementos();
    configurarScroll(elementos.barraScroll, elementos.btnTopo);
    configurarTrocaDeTela(elementos.loaderTela);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
