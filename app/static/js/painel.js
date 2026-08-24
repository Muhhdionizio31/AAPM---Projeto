/* =========================================================
   AAPM SENAI — Painel de Controle (Dashboard)
   Gráficos dinâmicos com Chart.js, dados em tempo real,
   formatação de moedas, e interações mobile.
   ========================================================= */

function abrirMenuMobile() {
  var lateral = document.getElementById('barraLateral');
  var sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.add('aberta');
  if (sobreposicao) sobreposicao.classList.add('visivel');
}

function fecharMenuMobile() {
  var lateral = document.getElementById('barraLateral');
  var sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.remove('aberta');
  if (sobreposicao) sobreposicao.classList.remove('visivel');
}

window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;

document.addEventListener("DOMContentLoaded", function () {
  // 1. Atualiza a data no cabeçalho da página
  const dataAtualSpan = document.getElementById("dataAtual");
  if (dataAtualSpan) {
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dataAtualSpan.textContent = new Date().toLocaleDateString('pt-BR', opcoes);
  }

  // 2. RECUPERA OS DADOS REAIS DO HTML (Injetados pelo FastAPI/Jinja2)
  const divCategorias = document.getElementById("dados-grafico-categorias");
  const divVendas = document.getElementById("dados-grafico-vendas");
  const divReceita = document.getElementById("dados-grafico-receita");

  let categoriasLabels = [];
  let categoriasValores = [];
  let vendasMensais = [];
  let receitaLabels = [];
  let receitaValores = [];

  try {
    if (divCategorias) {
      categoriasLabels = JSON.parse(divCategorias.getAttribute("data-labels") || "[]");
      categoriasValores = JSON.parse(divCategorias.getAttribute("data-valores") || "[]");
    }
    if (divVendas) {
      vendasMensais = JSON.parse(divVendas.getAttribute("data-vendas") || "[]");
    }
    if (divReceita) {
      receitaLabels = JSON.parse(divReceita.getAttribute("data-labels") || "[]");
      receitaValores = JSON.parse(divReceita.getAttribute("data-valores") || "[]");
    }
  } catch (e) {
    console.error("Erro ao ler dados para os gráficos:", e);
  }

  // 3. RENDERIZAÇÃO DO GRÁFICO DE CATEGORIAS (Rosca/Doughnut)
  const canvasCategorias = document.getElementById("graficoCategorias");
  if (canvasCategorias && categoriasLabels.length > 0) {
    const ctxCategorias = canvasCategorias.getContext("2d");

    const paletaCores = [
      '#c8102e', // Vermelho SENAI
      '#2563eb', // Azul Royal
      '#10b981', // Verde Esmeralda
      '#f59e0b', // Âmbar / Laranja
      '#8b5cf6', // Roxo
      '#06b6d4', // Ciano
      '#ec4899', // Rosa
      '#475569'  // Grafite
    ];

    const coresDoGrafico = categoriasLabels.map((_, index) => {
      return paletaCores[index % paletaCores.length];
    });

    const totalItens = categoriasValores.reduce((a, b) => a + Number(b), 0);

    new Chart(ctxCategorias, {
      type: 'doughnut',
      data: {
        labels: categoriasLabels,
        datasets: [{
          data: categoriasValores,
          backgroundColor: coresDoGrafico,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleFont: { family: 'Montserrat', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lato', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const qtd = Number(context.raw) || 0;
                const pct = totalItens > 0 ? Math.round((qtd / totalItens) * 100) : 0;
                return ` ${qtd} un. (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // Legenda lateral estilizada
    const listaLegenda = document.getElementById("legendaCategorias");
    if (listaLegenda) {
      listaLegenda.innerHTML = "";
      categoriasLabels.forEach((label, index) => {
        const li = document.createElement("li");
        const qtd = categoriasValores[index] || 0;
        const pct = totalItens > 0 ? Math.round((Number(qtd) / totalItens) * 100) : 0;
        li.innerHTML = `
          <span class="lc-nome" title="${label}">
            <span class="bolinha" style="background:${coresDoGrafico[index]};"></span>
            <span class="texto">${label}</span>
          </span>
          <span class="lc-valor">${qtd} <small style="font-weight: normal; color: #6b7280; font-size: 0.72rem;">(${pct}%)</small></span>
        `;
        listaLegenda.appendChild(li);
      });
    }
  }

  // 4. RENDERIZAÇÃO DO GRÁFICO DE VENDAS (Barras)
  const canvasVendas = document.getElementById("graficoVendas");
  if (canvasVendas) {
    const ctxVendas = canvasVendas.getContext("2d");
    
    // Gradiente vermelho moderno para as barras
    const gradienteBarras = ctxVendas.createLinearGradient(0, 0, 0, 240);
    gradienteBarras.addColorStop(0, '#c8102e');
    gradienteBarras.addColorStop(1, '#e11d48');

    new Chart(ctxVendas, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [
          {
            label: 'Vendas Realizadas',
            data: vendasMensais.length ? vendasMensais : Array(12).fill(0),
            backgroundColor: gradienteBarras,
            borderRadius: 6,
            barThickness: 16
          },
          {
            label: 'Meta Indicativa',
            data: Array(12).fill(100),
            type: 'line',
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleFont: { family: 'Montserrat', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lato', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return ` ${context.dataset.label}: ${context.raw} unidades`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // 5. RENDERIZAÇÃO DO GRÁFICO DE RECEITA MENSAL (Linha com Área Suave)
  const canvasReceita = document.getElementById("graficoReceita");
  if (canvasReceita && receitaLabels.length > 0) {
    const ctxReceita = canvasReceita.getContext("2d");

    const gradienteArea = ctxReceita.createLinearGradient(0, 0, 0, 200);
    gradienteArea.addColorStop(0, 'rgba(200, 16, 46, 0.28)');
    gradienteArea.addColorStop(1, 'rgba(200, 16, 46, 0.00)');

    new Chart(ctxReceita, {
      type: 'line',
      data: {
        labels: receitaLabels,
        datasets: [{
          label: 'Faturamento (R$)',
          data: receitaValores,
          borderColor: '#c8102e',
          borderWidth: 2.5,
          backgroundColor: gradienteArea,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#c8102e',
          pointBorderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleFont: { family: 'Montserrat', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lato', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const valor = Number(context.raw) || 0;
                return ` Receita: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: function (val) {
                return 'R$ ' + val;
              }
            }
          }
        }
      }
    });
  }
});