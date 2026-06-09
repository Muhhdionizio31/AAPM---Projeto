// Data atual no cabeçalho
const now = new Date();
const opts = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
document.getElementById('dataAtual').textContent =
  now.toLocaleDateString('pt-BR', opts).replace(/^\w/, c => c.toUpperCase());

// Cores
const vermelho = '#c8102e';
const preto = '#111111';
const cinza = '#e0e0e0';


// Gráfico 1 – Vendas mensais (barras)
const elementoDados = document.getElementById('dados-grafico-vendas');
const DADOS_VENDAS_BANCO = elementoDados ? JSON.parse(elementoDados.dataset.vendas) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const ctxVendas = document.getElementById('graficoVendas').getContext('2d');
const graficoVendas = new Chart(ctxVendas, {
  type: 'bar',
  data: {
    labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Vendas',
        data: DADOS_VENDAS_BANCO,
        backgroundColor: vermelho,
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Meta',
        data: [150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150],
        type: 'line',
        borderColor: preto,
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11, weight: '700' }, color: '#bbb' } },
      y: { grid: { color: '#f0f0f0' }, ticks: { font: { family: 'Lato', size: 11 }, color: '#bbb' }, beginAtZero: true }
    }
  }
});

// Gráfico 2 – Categorias (rosca)
const elementoCategorias = document.getElementById('dados-grafico-categorias');
// Carrega os dados reais ou adota um padrão caso não encontre o elemento
const LABELS_CATEGORIAS = (elementoCategorias && elementoCategorias.dataset.labels) 
  ? JSON.parse(elementoCategorias.dataset.labels) 
  : ['Mat. Escolar', 'Uniforme', 'Apostila'];

const VALORES_CATEGORIAS = (elementoCategorias && elementoCategorias.dataset.valores) 
  ? JSON.parse(elementoCategorias.dataset.valores) 
  : [0, 0, 0];
  
const ctxCategorias = document.getElementById('graficoCategorias').getContext('2d');

const graficoCategorias = new Chart(ctxCategorias,{
  type: 'doughnut',
  data: {
    labels: LABELS_CATEGORIAS,
    datasets: [{
      data: VALORES_CATEGORIAS,
      backgroundColor: [vermelho, preto, cinza],
      borderWidth: 0,
      hoverOffset: 6,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { display: false } }
  }
});

// Gráfico 3 – Receita (linha)
new Chart(document.getElementById('graficoReceita'), {
  type: 'line',
  data: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [{
      label: 'Receita',
      data: [5200, 4800, 6100, 7200, 7800, 8420],
      borderColor: vermelho,
      borderWidth: 2.5,
      pointBackgroundColor: vermelho,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      backgroundColor: 'rgba(200,16,46,0.07)',
      tension: 0.4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Montserrat', size: 11, weight: '700' }, color: '#bbb' } },
      y: {
        grid: { color: '#f0f0f0' },
        ticks: {
          font: { family: 'Lato', size: 11 }, color: '#bbb',
          callback: v => 'R$' + (v / 1000).toFixed(1) + 'k'
        },
        beginAtZero: false
      }
    }
  }
});
