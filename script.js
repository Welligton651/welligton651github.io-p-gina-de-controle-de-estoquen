// Variáveis globais
let currentPage = 1;
let totalPages = 1;
let searchTerm = '';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadProdutos();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 500));
    document.getElementById('add-form').addEventListener('submit', handleAddProduto);
    document.getElementById('movimento-form').addEventListener('submit', handleMovimento);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Função debounce para busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Carregar dashboard
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('total-produtos').textContent = data.total_produtos;
            document.getElementById('produtos-ok').textContent = data.produtos_ok;
            document.getElementById('produtos-baixo').textContent = data.produtos_baixo;
            document.getElementById('produtos-esgotado').textContent = data.produtos_esgotados;
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Carregar produtos
async function loadProdutos(page = 1, search = '') {
    showLoading(true);
    
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 20,
            search: search
        });
        
        const response = await fetch(`/api/produtos?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            displayProdutos(data.produtos);
            updatePagination(data.current_page, data.pages, data.total);
            currentPage = data.current_page;
            totalPages = data.pages;
        } else {
            showAlert('Erro ao carregar produtos: ' + data.error, 'error');
        }
    } catch (error) {
        showAlert('Erro de conexão: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Exibir produtos na tabela
function displayProdutos(produtos) {
    const tbody = document.getElementById('produtos-tbody');
    tbody.innerHTML = '';
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    produtos.forEach(produto => {
        const row = document.createElement('tr');
        
        const statusClass = produto.status_estoque === 'OK' ? 'status-ok' : 
                           produto.status_estoque === 'BAIXO' ? 'status-baixo' : 'status-esgotado';
        
        row.innerHTML = `
            <td style="max-width: 300px; word-wrap: break-word;">${produto.descricao}</td>
            <td>${produto.unidade || 'UNIDADE'}</td>
            <td>${produto.fornecimento}</td>
            <td>${produto.estoque}</td>
            <td><span class="status-badge ${statusClass}">${produto.status_estoque}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning btn-sm" onclick="openMovimentoModal(${produto.id}, 'SAIDA', '${produto.descricao}')">
                        <i class="fas fa-minus"></i> Baixa
                    </button>
                    <button class="btn btn-success btn-sm" onclick="openMovimentoModal(${produto.id}, 'ENTRADA', '${produto.descricao}')">
                        <i class="fas fa-plus"></i> Entrada
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Atualizar paginação
function updatePagination(currentPage, totalPages, totalItems) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Botão anterior
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadProdutos(currentPage - 1, searchTerm);
    pagination.appendChild(prevBtn);
    
    // Números das páginas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.onclick = () => loadProdutos(1, searchTerm);
        pagination.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '10px';
            pagination.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'current-page' : '';
        pageBtn.onclick = () => loadProdutos(i, searchTerm);
        pagination.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '10px';
            pagination.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => loadProdutos(totalPages, searchTerm);
        pagination.appendChild(lastBtn);
    }
    
    // Botão próximo
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadProdutos(currentPage + 1, searchTerm);
    pagination.appendChild(nextBtn);
    
    // Info
    const info = document.createElement('span');
    info.textContent = `Total: ${totalItems} produtos`;
    info.style.marginLeft = '20px';
    info.style.color = '#7f8c8d';
    pagination.appendChild(info);
}

// Busca
function handleSearch(event) {
    searchTerm = event.target.value;
    currentPage = 1;
    loadProdutos(1, searchTerm);
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('produtos-table');
    const pagination = document.getElementById('pagination');
    
    if (show) {
        loading.style.display = 'block';
        table.style.display = 'none';
        pagination.style.display = 'none';
    } else {
        loading.style.display = 'none';
        table.style.display = 'table';
    }
}

// Mostrar alerta
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Abrir modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Limpar formulários
    if (modalId === 'add-modal') {
        document.getElementById('add-form').reset();
        document.getElementById('add-unidade').value = 'UNIDADE';
        document.getElementById('add-fornecimento').value = '0';
        document.getElementById('add-estoque').value = '0';
        document.getElementById('add-estoque-minimo').value = '5';
    } else if (modalId === 'movimento-modal') {
        document.getElementById('movimento-form').reset();
    }
}

// Adicionar produto
async function handleAddProduto(event) {
    event.preventDefault();
    
    const formData = {
        descricao: document.getElementById('add-descricao').value,
        unidade: document.getElementById('add-unidade').value,
        fornecimento: parseFloat(document.getElementById('add-fornecimento').value),
        estoque: parseFloat(document.getElementById('add-estoque').value),
        estoque_minimo: parseFloat(document.getElementById('add-estoque-minimo').value)
    };
    
    try {
        const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Produto adicionado com sucesso!');
            closeModal('add-modal');
            loadDashboard();
            loadProdutos(currentPage, searchTerm);
        } else {
            showAlert('Erro ao adicionar produto: ' + data.error, 'error');
        }
    } catch (error) {
        showAlert('Erro de conexão: ' + error.message, 'error');
    }
}

// Abrir modal de movimentação
function openMovimentoModal(produtoId, tipo, descricao) {
    document.getElementById('movimento-produto-id').value = produtoId;
    document.getElementById('movimento-tipo').value = tipo;
    document.getElementById('movimento-produto').value = descricao;
    document.getElementById('movimento-quantidade').value = '';
    document.getElementById('movimento-observacao').value = '';
    
    const title = tipo === 'ENTRADA' ? 'Entrada de Estoque' : 'Baixa de Estoque';
    document.getElementById('movimento-title').textContent = title;
    
    openModal('movimento-modal');
}

// Processar movimentação
async function handleMovimento(event) {
    event.preventDefault();
    
    const produtoId = document.getElementById('movimento-produto-id').value;
    const tipo = document.getElementById('movimento-tipo').value;
    const quantidade = parseFloat(document.getElementById('movimento-quantidade').value);
    const observacao = document.getElementById('movimento-observacao').value;
    
    if (quantidade <= 0) {
        showAlert('Quantidade deve ser maior que zero', 'error');
        return;
    }
    
    const endpoint = tipo === 'ENTRADA' ? 'entrada' : 'baixa';
    
    try {
        const response = await fetch(`/api/produtos/${produtoId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantidade: quantidade,
                observacao: observacao
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const tipoMsg = tipo === 'ENTRADA' ? 'Entrada' : 'Baixa';
            showAlert(`${tipoMsg} realizada com sucesso!`);
            closeModal('movimento-modal');
            loadDashboard();
            loadProdutos(currentPage, searchTerm);
        } else {
            showAlert('Erro: ' + data.error, 'error');
        }
    } catch (error) {
        showAlert('Erro de conexão: ' + error.message, 'error');
    }
}

