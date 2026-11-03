// ==========================================================================
// AAPM · SENAI — Gerenciador do Modo Escuro
// Desenvolvido de forma simples, direta e artesanal para todo o site.
// ==========================================================================

(function () {
  'use strict';

  // Evita carregar duas vezes na mesma página
  if (window.__modoEscuroCarregado) {
    return;
  }
  window.__modoEscuroCarregado = true;

  // Nomes simples em português
  const chaveArmazenamento = 'tema';
  const classeModoEscuro = 'modo-escuro';

  // Ícones SVG do Sol e da Lua
  const htmlIconeSol = '<svg class="icone-sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  const htmlIconeLua = '<svg class="icone-lua" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  // Variável para evitar múltiplos cliques rápidos (debounce)
  let ultimaTroca = 0;

  // Retorna se o tema atual ativo é escuro
  function obterTemaAtual() {
    try {
      const temaSalvo = localStorage.getItem(chaveArmazenamento);
      if (temaSalvo === 'escuro' || temaSalvo === 'claro') {
        return temaSalvo;
      }
    } catch (erroStorage) {}

    // Verifica se a classe já está no elemento HTML
    if (document.documentElement.classList.contains(classeModoEscuro)) {
      return 'escuro';
    }

    // Preferência do sistema operacional
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'escuro';
    }

    return 'claro';
  }

  // Aplica o tema na página e salva a preferência
  function aplicarTema(novoTema) {
    const elementoHtml = document.documentElement;
    const elementoCorpo = document.body;

    if (novoTema === 'escuro') {
      elementoHtml.classList.add(classeModoEscuro);
      if (elementoCorpo) {
        elementoCorpo.classList.add(classeModoEscuro);
      }
      try {
        localStorage.setItem(chaveArmazenamento, 'escuro');
      } catch (e) {}
    } else {
      elementoHtml.classList.remove(classeModoEscuro);
      if (elementoCorpo) {
        elementoCorpo.classList.remove(classeModoEscuro);
      }
      try {
        localStorage.setItem(chaveArmazenamento, 'claro');
      } catch (e) {}
    }

    atualizarRotulosDosBotoes(novoTema);

    // Dispara evento para scripts secundários (ex: gráficos dinâmicos)
    try {
      window.dispatchEvent(new CustomEvent('temaAlterado', { detail: { tema: novoTema } }));
    } catch (e) {}
  }

  // Alterna entre claro e escuro de forma direta
  function alternarTema() {
    const agora = Date.now();
    if (agora - ultimaTroca < 200) {
      return; // Ignora cliques repetidos em menos de 200 milissegundos
    }
    ultimaTroca = agora;

    // Checa diretamente se a tela está com a classe de modo escuro
    const estaEscuro = document.documentElement.classList.contains(classeModoEscuro);
    const novoTema = estaEscuro ? 'claro' : 'escuro';
    aplicarTema(novoTema);
  }

  // Atualiza os títulos e acessibilidade dos botões
  function atualizarRotulosDosBotoes(tema) {
    const todosOsBotoes = document.querySelectorAll('.botao-tema, #botao-tema');
    const textoAcao = tema === 'escuro' ? 'Mudar para modo claro' : 'Mudar para modo escuro';

    todosOsBotoes.forEach(function (botao) {
      botao.setAttribute('title', textoAcao);
      botao.setAttribute('aria-label', textoAcao);
    });
  }

  // Garante os ícones dentro dos botões
  function garantirIconesDosBotoes() {
    const todosOsBotoes = document.querySelectorAll('.botao-tema, #botao-tema');
    todosOsBotoes.forEach(function (botao) {
      if (!botao.querySelector('.icone-sol')) {
        botao.innerHTML = htmlIconeSol + htmlIconeLua;
      }
    });
  }

  // Insere botão no cabeçalho do painel se não existir
  function garantirBotaoNoCabecalho() {
    const cabecalho = document.querySelector('.cabecalho-pagina');
    if (!cabecalho) return;

    if (document.getElementById('botao-tema') || cabecalho.querySelector('.botao-tema')) {
      return;
    }

    const novoBotao = document.createElement('button');
    novoBotao.type = 'button';
    novoBotao.id = 'botao-tema';
    novoBotao.className = 'botao-tema';
    novoBotao.setAttribute('onclick', 'alternarTema()');
    novoBotao.innerHTML = htmlIconeSol + htmlIconeLua;

    const dataAtual = document.getElementById('dataAtual');
    if (dataAtual && dataAtual.parentNode === cabecalho) {
      const containerAcoes = document.createElement('div');
      containerAcoes.style.display = 'flex';
      containerAcoes.style.alignItems = 'center';
      containerAcoes.style.gap = '14px';

      cabecalho.replaceChild(containerAcoes, dataAtual);
      containerAcoes.appendChild(novoBotao);
      containerAcoes.appendChild(dataAtual);
    } else {
      cabecalho.appendChild(novoBotao);
    }
  }

  // Insere botão flutuante para páginas isoladas (recuperação de senha, etc.)
  function garantirBotaoFlutuante() {
    if (document.querySelector('.botao-tema') || document.getElementById('botao-tema')) {
      return;
    }

    const botaoFlutuante = document.createElement('button');
    botaoFlutuante.type = 'button';
    botaoFlutuante.id = 'botao-tema';
    botaoFlutuante.className = 'botao-tema';
    botaoFlutuante.setAttribute('onclick', 'alternarTema()');
    botaoFlutuante.style.position = 'fixed';
    botaoFlutuante.style.top = '18px';
    botaoFlutuante.style.right = '18px';
    botaoFlutuante.style.zIndex = '99999';
    botaoFlutuante.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
    botaoFlutuante.innerHTML = htmlIconeSol + htmlIconeLua;

    document.body.appendChild(botaoFlutuante);
  }

  // Ouvinte global de cliques delegado (funciona para qualquer botão criado dinâmica ou estaticamente)
  document.addEventListener('click', function (evento) {
    const alvo = evento.target;
    if (!alvo) return;

    const botao = alvo.closest ? alvo.closest('.botao-tema, #botao-tema') : null;
    if (botao) {
      evento.preventDefault();
      evento.stopPropagation();
      alternarTema();
    }
  }, true);

  // Inicialização quando a página carrega
  function iniciarModoEscuro() {
    const temaInicial = obterTemaAtual();
    aplicarTema(temaInicial);

    garantirIconesDosBotoes();
    garantirBotaoNoCabecalho();
    garantirBotaoFlutuante();
    garantirIconesDosBotoes();
    atualizarRotulosDosBotoes(temaInicial);

    // Acompanha alteração do sistema apenas se o usuário ainda não tiver clicado para escolher
    if (window.matchMedia) {
      const mediaTema = window.matchMedia('(prefers-color-scheme: dark)');
      mediaTema.addEventListener('change', function (evento) {
        try {
          const temaSalvo = localStorage.getItem(chaveArmazenamento);
          if (!temaSalvo) {
            aplicarTema(evento.matches ? 'escuro' : 'claro');
          }
        } catch (e) {}
      });
    }
  }

  // Torna a função global imediatamente disponível
  window.alternarTema = alternarTema;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarModoEscuro);
  } else {
    iniciarModoEscuro();
  }
})();
