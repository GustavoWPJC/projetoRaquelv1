// Configuração da API
const API_URL = {
  usuarios: 'https://683b96bb28a0b0f2fdc4ff7a.mockapi.io/api/v1/usuario',
  pacientes: 'https://683b96bb28a0b0f2fdc4ff7a.mockapi.io/api/v1/paciente'
};

// Variáveis globais
let clientes = [];
let clienteSelecionado = null;
let usuarioLogado = null;

// Dados do seu usuário (para validação rápida)
const USUARIO_RAQUEL = {
  id: "1",
  name: "Raquel",
  gmail: "ieldaRaquel@gmail.com",
  senha: "psiRaquel97@"
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  configurarEventos();
});

function verificarSessao() {
  const usuarioSalvo = localStorage.getItem('usuarioLogado');
  if (usuarioSalvo) {
    usuarioLogado = JSON.parse(usuarioSalvo);
    mostrarConteudoPrincipal();
    carregarPacientes();
  } else {
    mostrarLogin();
  }
}

function configurarEventos() {
  document.getElementById('login-form').addEventListener('submit', fazerLogin);
  document.getElementById('logout-btn').addEventListener('click', fazerLogout);
  document.getElementById('adicionar-btn').addEventListener('click', adicionarPaciente);
  document.getElementById('salvar-consultas').addEventListener('click', salvarConsultas);
  
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', fecharModais);
  });
}

// Funções de Autenticação
async function fazerLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const nome = document.getElementById('login-nome').value.trim();
  const senha = document.getElementById('login-senha').value;
  
  const messageElement = document.getElementById('login-message');
  messageElement.textContent = '';
  messageElement.style.color = 'var(--vermelho)';

  // Validação direta com seu usuário (alternativa à API)
  if (email === USUARIO_RAQUEL.gmail && 
      nome === USUARIO_RAQUEL.name && 
      senha === USUARIO_RAQUEL.senha) {
    usuarioLogado = USUARIO_RAQUEL;
    localStorage.setItem('usuarioLogado', JSON.stringify(USUARIO_RAQUEL));
    mostrarConteudoPrincipal();
    carregarPacientes();
    return;
  }

  // Se não for seu usuário, tenta pela API
  try {
    const response = await fetch(API_URL.usuarios);
    const usuarios = await response.json();
    
    const usuarioValido = usuarios.find(u => 
      (u.email === email || u.gmail === email) && 
      (u.name === nome || u.nome === nome) && 
      u.senha === senha
    );

    if (usuarioValido) {
      usuarioLogado = usuarioValido;
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioValido));
      mostrarConteudoPrincipal();
      carregarPacientes();
    } else {
      messageElement.textContent = 'Credenciais inválidas';
    }
  } catch (error) {
    console.error('Erro no login:', error);
    messageElement.textContent = 'Erro ao conectar com o servidor';
  }
}

function fazerLogout() {
  localStorage.removeItem('usuarioLogado');
  usuarioLogado = null;
  clientes = [];
  mostrarLogin();
}

function mostrarLogin() {
  document.getElementById('login-modal').style.display = 'flex';
  document.getElementById('conteudo-principal').style.display = 'none';
  document.getElementById('login-form').reset();
}

function mostrarConteudoPrincipal() {
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('conteudo-principal').style.display = 'block';
  document.getElementById('nome-usuario').textContent = usuarioLogado.name || usuarioLogado.nome;
}

function fecharModais() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}

// Funções de Gestão de Pacientes
async function carregarPacientes() {
  try {
    const response = await fetch(API_URL.pacientes);
    if (response.ok) {
      clientes = await response.json();
      // Filtra pacientes do usuário logado ou todos se for admin
      if (usuarioLogado.id !== "1") { // Se não for a Raquel
        clientes = clientes.filter(p => p.usuarioId === usuarioLogado.id);
      }
      renderizarTabela();
    }
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
  }
}

async function adicionarPaciente() {
  const nome = document.getElementById('nome').value.trim();
  const dataPagamento = document.getElementById('data-pagamento').value;
  const planoSelecionado = document.querySelector('.plano-buttons .selected');

  if (!nome || !dataPagamento || !planoSelecionado) {
    alert('Preencha todos os campos!');
    return;
  }

  const novoPaciente = {
    nome,
    dataPagamento,
    plano: planoSelecionado.textContent,
    consultas: [],
    usuarioId: usuarioLogado.id
  };

  try {
    const response = await fetch(API_URL.pacientes, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novoPaciente)
    });

    if (response.ok) {
      const paciente = await response.json();
      clientes.push(paciente);
      renderizarTabela();
      limparFormulario();
    }
  } catch (error) {
    console.error('Erro ao adicionar paciente:', error);
  }
}

function renderizarTabela() {
  const tabela = document.getElementById('tabela-dados');
  
  tabela.innerHTML = clientes.map(cliente => `
    <tr>
      <td>${cliente.nome}</td>
      <td>${cliente.plano}</td>
      <td>${cliente.consultas?.length || 0}/${cliente.plano === 'Mensal' ? '4' : '1'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn edit" onclick="abrirDetalhes('${cliente.id}')">
            <i class="fas fa-eye"></i> Detalhes
          </button>
          <button class="btn edit" onclick="abrirEdicao('${cliente.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn delete" onclick="removerCliente('${cliente.id}')">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Funções auxiliares
function selecionarPlano(botao, plano) {
  document.querySelectorAll('.plano-buttons button').forEach(btn => {
    btn.classList.remove('selected');
  });
  botao.classList.add('selected');
}

function selecionarPlanoModal(botao, plano) {
  document.querySelectorAll('#editar-modal .plano-buttons button').forEach(btn => {
    btn.classList.remove('selected');
  });
  botao.classList.add('selected');
}

function formatarData(dataString) {
  if (!dataString) return 'Não informado';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dataString).toLocaleDateString('pt-BR', options);
}

function limparFormulario() {
  document.getElementById('nome').value = '';
  document.getElementById('data-pagamento').value = '';
  document.querySelectorAll('.plano-buttons button').forEach(btn => {
    btn.classList.remove('selected');
  });
}

// Funções de detalhes e edição
async function abrirDetalhes(id) {
  try {
    const response = await fetch(`${API_URL.pacientes}/${id}`);
    if (response.ok) {
      clienteSelecionado = await response.json();
      
      document.getElementById('detalhes-cliente').innerHTML = `
        <p><strong>Nome:</strong> ${clienteSelecionado.nome}</p>
        <p><strong>Plano:</strong> ${clienteSelecionado.plano}</p>
        <p><strong>Data Pagamento:</strong> ${formatarData(clienteSelecionado.dataPagamento)}</p>
      `;

      const qtdConsultas = clienteSelecionado.plano === 'Mensal' ? 4 : 1;
      const consultas = clienteSelecionado.consultas || [];
      document.getElementById('contador').textContent = `${consultas.length}/${qtdConsultas}`;

      document.getElementById('campos-data').innerHTML = Array.from({ length: qtdConsultas }, (_, i) => `
        <div class="data-input">
          <input type="date" id="consulta-${i}" value="${consultas[i] || ''}">
          <span>Consulta ${i+1}</span>
        </div>
      `).join('');

      document.getElementById('detalhes-modal').style.display = 'flex';
    }
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
  }
}

async function salvarConsultas() {
  const qtdConsultas = clienteSelecionado.plano === 'Mensal' ? 4 : 1;
  const consultasAtualizadas = Array.from({ length: qtdConsultas }, (_, i) => 
    document.getElementById(`consulta-${i}`).value
  ).filter(Boolean);

  try {
    const response = await fetch(`${API_URL.pacientes}/${clienteSelecionado.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...clienteSelecionado,
        consultas: consultasAtualizadas
      })
    });

    if (response.ok) {
      const pacienteAtualizado = await response.json();
      const index = clientes.findIndex(p => p.id === pacienteAtualizado.id);
      if (index !== -1) {
        clientes[index] = pacienteAtualizado;
      }
      renderizarTabela();
      document.getElementById('detalhes-modal').style.display = 'none';
    }
  } catch (error) {
    console.error('Erro ao salvar consultas:', error);
  }
}

async function abrirEdicao(id) {
  try {
    const response = await fetch(`${API_URL.pacientes}/${id}`);
    if (response.ok) {
      const cliente = await response.json();
      
      document.getElementById('editar-nome').value = cliente.nome;
      document.getElementById('editar-data').value = cliente.dataPagamento;
      
      document.querySelectorAll('#editar-modal .plano-buttons button').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === cliente.plano) btn.classList.add('selected');
      });
      
      document.getElementById('editar-modal').style.display = 'flex';
    }
  } catch (error) {
    console.error('Erro ao abrir edição:', error);
  }
}

async function salvarEdicao() {
  const nome = document.getElementById('editar-nome').value.trim();
  const dataPagamento = document.getElementById('editar-data').value;
  const planoSelecionado = document.querySelector('#editar-modal .plano-buttons .selected');

  if (!nome || !dataPagamento || !planoSelecionado) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    const response = await fetch(`${API_URL.pacientes}/${clienteSelecionado.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...clienteSelecionado,
        nome,
        dataPagamento,
        plano: planoSelecionado.textContent
      })
    });

    if (response.ok) {
      const pacienteAtualizado = await response.json();
      const index = clientes.findIndex(p => p.id === pacienteAtualizado.id);
      if (index !== -1) {
        clientes[index] = pacienteAtualizado;
      }
      renderizarTabela();
      document.getElementById('editar-modal').style.display = 'none';
    }
  } catch (error) {
    console.error('Erro ao salvar edição:', error);
  }
}

async function removerCliente(id) {
  if (!confirm('Tem certeza que deseja remover este paciente?')) return;

  try {
    const response = await fetch(`${API_URL.pacientes}/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      clientes = clientes.filter(p => p.id !== id);
      renderizarTabela();
    }
  } catch (error) {
    console.error('Erro ao remover paciente:', error);
  }
}