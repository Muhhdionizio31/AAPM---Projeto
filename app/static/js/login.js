 function alternarSenha() {
    const input = document.getElementById('password');
    const icon  = document.getElementById('eyeIcon');
    const show  = input.type === 'password';
    input.type  = show ? 'text' : 'password';
    icon.innerHTML = show
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>`;
  }

  function processarLogin() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl  = document.getElementById('formError');

    if (!email || !password) {
      errorEl.textContent = 'Por favor, preencha todos os campos.';
      errorEl.classList.add('visible');
      return;
    }

    // TODO: substituir por autenticação real
    errorEl.textContent = 'Usuário ou senha incorretos. Tente novamente.';
    errorEl.classList.add('visible');
  }

  document.getElementById('email').addEventListener('input',
    () => document.getElementById('formError').classList.remove('visible'));
  document.getElementById('password').addEventListener('input',
    () => document.getElementById('formError').classList.remove('visible'));