<div align="center">

<img src="https://img.shields.io/badge/SENAI-Francisco%20Matarazzo-c8102e?style=for-the-badge&labelColor=111111" />
<img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-f59e0b?style=for-the-badge&labelColor=111111" />
<img src="https://img.shields.io/badge/Versão-1.0.0-22c55e?style=for-the-badge&labelColor=111111" />

<br/><br/>

# 🏫 AAPM — Sistema de Gestão Web
### Associação de Alunos, Ex-Alunos, Pais e Mestres
#### Escola SENAI Francisco Matarazzo

<br/>

> **Plataforma web full-stack** desenvolvida para digitalizar e modernizar a gestão interna da AAPM do SENAI Francisco Matarazzo — desde o controle de estoque até o painel de vendas, tudo em um sistema seguro, responsivo e de fácil uso.

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)](https://sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-6B7280?style=flat-square)](https://alembic.sqlalchemy.org)
[![Jinja2](https://img.shields.io/badge/Jinja2-Templates-B41717?style=flat-square)](https://jinja.palletsprojects.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura & Tecnologias](#️-arquitetura--tecnologias)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Banco de Dados & Migrations](#-banco-de-dados--migrations)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Design System](#-design-system)
- [Páginas e Rotas](#-páginas-e-rotas)
- [Segurança](#-segurança)
- [Time de Desenvolvimento](#-time-de-desenvolvimento)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **Sistema AAPM** nasceu da necessidade de modernizar os processos administrativos da Associação de Alunos, Ex-Alunos, Pais e Mestres da Escola SENAI Francisco Matarazzo. O projeto centraliza o controle de estoque, o gerenciamento de vendas e o acesso administrativo em uma única plataforma web segura — eliminando planilhas manuais e processos descentralizados.

O sistema foi construído com foco em **clareza, segurança e escalabilidade**, utilizando Python moderno no backend e um design system proprietário no frontend.

---

## ✨ Funcionalidades

| Módulo | Descrição | Status |
|---|---|---|
| 🔐 **Autenticação** | Login seguro com JWT e hash de senha via bcrypt | ✅ Implementado |
| 📦 **Gestão de Estoque** | CRUD completo de produtos com controle de quantidade | ✅ Implementado |
| 📊 **Painel de Vendas** | Dashboard com catálogo dinâmico e modais de venda | ✅ Implementado |
| 👑 **Área Administrativa** | Sidebar fixa com navegação entre módulos admin | ✅ Implementado |
| 📜 **Política de Privacidade** | Página informativa com índice lateral sticky | ✅ Implementado |
| 👤 **Gestão de Usuários** | Criação e gerenciamento de usuários do sistema | ✅ Implementado |

---

## 🏗️ Arquitetura & Tecnologias

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│   HTML5 · CSS3 (Design System próprio) · JavaScript    │
│   Fontes: Montserrat (headings) + Lato (body)          │
└────────────────────┬────────────────────────────────────┘
                     │  HTTP / Jinja2 Templates
┌────────────────────▼────────────────────────────────────┐
│                     BACKEND                             │
│              FastAPI + Uvicorn (ASGI)                  │
│         Autenticação JWT · python-jose · bcrypt        │
└────────────────────┬────────────────────────────────────┘
                     │  SQLAlchemy ORM
┌────────────────────▼────────────────────────────────────┐
│                  BANCO DE DADOS                         │
│              SQLite · Alembic Migrations               │
└─────────────────────────────────────────────────────────┘
```

### Stack Completo

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — framework web moderno e performático para Python
- [Uvicorn](https://www.uvicorn.org/) — servidor ASGI de alta performance
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM robusto e flexível
- [Alembic](https://alembic.sqlalchemy.org/) — gerenciamento de migrations do banco de dados
- [Jinja2](https://jinja.palletsprojects.com/) — engine de templates para renderização server-side
- [python-jose](https://python-jose.readthedocs.io/) — geração e validação de tokens JWT
- [passlib + bcrypt](https://passlib.readthedocs.io/) — hashing seguro de senhas
- [python-dotenv](https://github.com/theskumar/python-dotenv) — gerenciamento de variáveis de ambiente

**Frontend**
- HTML5 semântico com estrutura de múltiplas páginas
- CSS3 com variáveis customizadas e design system proprietário
- JavaScript vanilla para interatividade (modais, catálogo dinâmico, navegação)

**Banco de Dados**
- SQLite (arquivo `AAPM.db`) — banco leve e portável, ideal para o escopo do projeto

---

## 📁 Estrutura do Repositório

```
AAPM---Projeto/
│
├── app/                        # Módulo principal da aplicação
│   ├── routers/                # Rotas FastAPI separadas por domínio
│   ├── models/                 # Modelos SQLAlchemy (tabelas do banco)
│   ├── schemas/                # Schemas Pydantic para validação
│   ├── templates/              # Templates Jinja2 (HTML das páginas)
│   │   ├── login.html
│   │   ├── admin/
│   │   │   ├── estoque.html
│   │   │   └── vendas.html
│   │   └── politica-privacidade.html
│   ├── static/                 # Arquivos estáticos (CSS, JS, imagens)
│   │   ├── css/
│   │   └── js/
│   └── main.py                 # Ponto de entrada da aplicação FastAPI
│
├── migrations/                 # Scripts de migração Alembic
│   ├── versions/               # Versões das migrations
│   └── env.py
│
├── .env                        # Variáveis de ambiente (não versionar em produção)
├── .gitignore
├── AAPM.db                     # Banco de dados SQLite
├── alembic.ini                 # Configuração do Alembic
├── criar_usuarios.py           # Script utilitário para criação de usuários
├── requirements.txt            # Dependências Python
└── readme.md
```

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Python 3.11+** → [Download](https://python.org/downloads/)
- **pip** (geralmente já incluso com Python)
- **Git** → [Download](https://git-scm.com/)

Para verificar as versões instaladas:

```bash
python --version
pip --version
git --version
```

---

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/Muhhdionizio31/AAPM---Projeto.git
cd AAPM---Projeto
```

### 2. Crie e ative o ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo e edite com suas configurações
cp .env .env.local
```

> Consulte a seção [Variáveis de Ambiente](#-variáveis-de-ambiente) para os detalhes.

### 5. Execute as migrations do banco de dados

```bash
alembic upgrade head
```

### 6. (Opcional) Crie o usuário administrador inicial

```bash
python criar_usuarios.py
```

### 7. Inicie o servidor

```bash
# Desenvolvimento (com reload automático)
uvicorn app.main:app --reload

# Produção
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 8. Acesse no navegador

```
http://localhost:8000
```

A documentação interativa da API (Swagger UI) estará disponível em:

```
http://localhost:8000/docs
```

---

## 🗃️ Banco de Dados & Migrations

O projeto usa **SQLite** como banco de dados e **Alembic** para controle de versão do schema.

### Comandos úteis do Alembic

```bash
# Aplicar todas as migrations pendentes
alembic upgrade head

# Reverter a última migration
alembic downgrade -1

# Ver o histórico de migrations
alembic history --verbose

# Criar uma nova migration (após alterar os models)
alembic revision --autogenerate -m "descricao_da_mudanca"

# Ver o estado atual
alembic current
```

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Segurança JWT
SECRET_KEY=sua_chave_secreta_muito_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Banco de dados
DATABASE_URL=sqlite:///./AAPM.db

# Ambiente
DEBUG=True
```

> ⚠️ **Atenção:** nunca suba o arquivo `.env` real para o repositório. Use sempre o `.gitignore` para protegê-lo.

---

## 🎨 Design System

O projeto utiliza um design system proprietário, consistente em todas as páginas.

| Token | Valor | Uso |
|---|---|---|
| `--vermelho` | `#c8102e` | Cor primária, CTAs, destaques |
| `--preto` | `#111111` | Fundos escuros, sidebar, textos |
| `--branco` | `#ffffff` | Fundos claros, textos em fundo escuro |
| `--cinza-claro` | `#f5f5f5` | Fundos secundários, separadores |
| **Heading Font** | Montserrat | Títulos, rótulos de navegação |
| **Body Font** | Lato | Parágrafos, formulários, tabelas |

### Padrões de Layout

- **Login** — split de duas colunas (imagem institucional + formulário)
- **Política de Privacidade** — índice lateral sticky + conteúdo em scroll
- **Páginas Admin** — sidebar fixa escura com navegação + área de conteúdo principal
- **Painel de Vendas** — catálogo dinâmico com modais de confirmação

---

## 🗺️ Páginas e Rotas

| Rota | Página | Acesso |
|---|---|---|
| `GET /` | Redirecionamento para login | Público |
| `GET /login` | Página de login | Público |
| `POST /login` | Autenticação de usuário | Público |
| `GET /admin/estoque` | Gestão de estoque | 🔐 Autenticado |
| `GET /admin/vendas` | Painel de vendas | 🔐 Autenticado |
| `GET /admin/usuarios` | Gestão de usuários | 🔐 Autenticado |
| `GET /politica-privacidade` | Política de privacidade | Público |
| `GET /docs` | Documentação Swagger da API | Desenvolvimento |

---

## 🔒 Segurança

O sistema implementa as seguintes práticas de segurança:

- **Hashing de senhas** com `bcrypt` via `passlib` — senhas nunca são armazenadas em texto puro
- **Autenticação JWT** com `python-jose` — tokens com expiração configurável
- **Rotas protegidas** — middleware de autenticação nas áreas administrativas
- **Variáveis de ambiente** — credenciais e chaves secretas isoladas do código-fonte
- **`python-multipart`** — validação segura de formulários multipart

---

## 👥 Time de Desenvolvimento

Projeto desenvolvido por alunos da **Escola SENAI Francisco Matarazzo** como iniciativa de digitalização da AAPM.

<br/>

| 👤 | Nome | Função | Papel no Time |
|---|---|---|---|
| 🔴 | **Murilo Dionizio** | Product Owner & Back-end | Líder do projeto, responsável pela visão do produto e desenvolvimento server-side |
| 🟡 | **Luis Eduardo** | Desenvolvedor Back-end | Responsável pela lógica de negócio, banco de dados e integrações |
| 🟢 | **Davi Tomé** | Frontend Developer & Scrum Master | Interfaces, design system, facilitação ágil e gestão das sprints |
| 🔵 | **Iago** | Desenvolvedor Front-end | UI/UX, componentes visuais e experiência do usuário |

<br/>

> 💬 *"Código não é só lógica — é também criatividade."* — Iago

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais no contexto do curso técnico da **Escola SENAI Francisco Matarazzo**. Todos os direitos reservados à equipe de desenvolvimento e à instituição.

---

<div align="center">

**Desenvolvido com ❤️ por alunos do SENAI Francisco Matarazzo**

<img src="https://img.shields.io/badge/SENAI-Escola%20Francisco%20Matarazzo-c8102e?style=for-the-badge&labelColor=111111" />

*São Paulo, SP — 2025/2026*

</div>
