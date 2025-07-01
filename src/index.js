// src/index.js

// Função para buscar os posts (agora para as categorias dinâmicas)
async function fetchPosts() {
    try {
        const response = await fetch('../dist/data/posts.json'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        return [];
    }
}

// Função para renderizar posts dinâmicos (a partir do JSON)
function renderDynamicPosts(postsToDisplay, containerId = 'posts-container') {
    const postsContainer = document.getElementById(containerId);
    if (!postsContainer) {
        console.error(`Container com ID '${containerId}' não encontrado.`);
        return;
    }
    postsContainer.innerHTML = ''; // Limpa o conteúdo existente

    if (postsToDisplay.length === 0) {
        postsContainer.innerHTML = '<p class="text-center text-muted">Nenhum post encontrado nesta categoria.</p>';
        return;
    }

    postsToDisplay.forEach(post => {
        const postElement = document.createElement('article');
        postElement.classList.add('mb-4', 'blog-post-card', 'position-relative'); 

        const postLink = `post.html?id=${post.id}`; 

        postElement.innerHTML = `
            <a href="${postLink}" class="stretched-link no-underline-link">
                <h2 class="h4">${post.titulo}</h2>
                <p class="text-muted">Publicado em: ${new Date(post.dataPublicacao).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })} por <strong>${post.autor}</strong></p>
                ${post.imagemCapa ? `<img src="${post.imagemCapa}" alt="Capa do post: ${post.titulo}" class="img-fluid mb-3">` : ''}
                <p>${post.conteudo.substring(0, 150)}...</p>
            </a>
        `;
        postsContainer.appendChild(postElement);
    });
}

// Função para filtrar posts por categoria (ainda usando a lógica de ordenação para 'latest')
function filterPostsByCategory(allPosts, category) {
    if (category === 'latest' || category === 'latests') { 
        // Retorna todos os posts ordenados do mais novo para o mais antigo
        return [...allPosts].sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));
    }
    return allPosts.filter(post => post.categoria && post.categoria.toLowerCase() === category.toLowerCase());
}

// Função para exibir/ocultar os containers de posts
function togglePostContainers(showFixed, showDynamic) {
    const fixedPostsSection = document.getElementById('fixed-posts');
    const dynamicPostsContainer = document.getElementById('posts-container');

    if (fixedPostsSection) {
        fixedPostsSection.style.display = showFixed ? 'block' : 'none';
    }
    if (dynamicPostsContainer) {
        dynamicPostsContainer.style.display = showDynamic ? 'block' : 'none';
    }
}


// Função principal para gerenciar a rota e o conteúdo
async function handleRoute() {
    let path = window.location.pathname; 
    let category = path === '/' ? 'a-lifers-tech-blog/' : path.substring(1).split('/')[0]; // 'home' para a rota raiz

    // Lógica para mostrar posts fixos na home
    if (category === 'home') {
        togglePostContainers(true, false); // Mostra os posts fixos, oculta o container dinâmico
        renderDynamicPosts([], 'posts-container'); // Limpa o container dinâmico, se houver algo
    } else {
        togglePostContainers(false, true); // Oculta os posts fixos, mostra o container dinâmico
        const allPosts = await fetchPosts();
        const postsToDisplay = filterPostsByCategory(allPosts, category);
        renderDynamicPosts(postsToDisplay); // Renderiza posts do JSON
    }

    updateActiveClass(category); // Atualiza a classe ativa na navbar
}

// Função para atualizar a classe 'active' no navbar
function updateActiveClass(currentCategory) {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current'); 
        
        // A lógica de ativação deve ser um pouco diferente para o navbrand
        // Já que ele é a "home" mas não tem data-category
        if (currentCategory === 'home' && link.getAttribute('href') === '/') {
             // Esta parte será gerenciada pelo clique direto do navbrand, que não é um category-link
             // Mas podemos ativar o 'Latest' se quisermos que ele represente a home
             // Se 'Latest' deve ser ativo na home, ele precisa ter data-category="latest"
             // E aqui, testamos se o link href é '/latest' ou '/' e é o link de Latest
             if (link.dataset.category === 'latest') { // Se "Latest" for a representação da home
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
             }
        } else if (link.dataset.category && link.dataset.category.toLowerCase() === currentCategory.toLowerCase()) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Listener para links de categoria (incluindo o "Latest" do menu)
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const newPath = event.target.getAttribute('href');
            window.history.pushState({ path: newPath }, '', newPath);
            handleRoute(); 
        });
    });

    // Listener para o NavBrand (leva para a home)
    const navBrand = document.querySelector('.navbar-brand');
    if (navBrand) {
        navBrand.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.pushState({ path: '/' }, '', '/');
            handleRoute();
        });
    }

    // NOVO LISTENER: Para cliques em posts dinâmicos E fixos
    document.addEventListener('click', (event) => {
        const postLink = event.target.closest('a.post-link'); // Seleciona o link do post
        if (postLink && postLink.dataset.postId) { // Verifica se é um link de post e tem o ID
            event.preventDefault();
            const postId = postLink.dataset.postId;
            const newPath = `/post/${postId}`;
            window.history.pushState({ path: newPath }, '', newPath);
            handleRoute(); // Chama handleRoute para renderizar o post individual
        } else {
             // Lógica para links dentro dos posts fixos que não são 'post-link'
             // Se você não adicionar a classe 'post-link' neles, eles não serão capturados aqui.
             // O ideal é que todos os links de posts (dinâmicos e fixos) tenham essa classe.
             // E seus hrefs sejam /post/:id
        }
    });

    // Listener para o botão Voltar/Avançar do navegador
    window.addEventListener('popstate', handleRoute);

    // Renderiza o conteúdo inicial baseado na URL
    handleRoute();
});

const homePageContent = `
    <section class="home-section my-4">
        <h2 class="text-center mb-4">Bem-vindo ao A lifer's Tech Blog!</h2>
        <p class="lead text-center">Descubra as últimas tendências em tecnologia, guias de desenvolvimento, dicas de soft skills e muito mais.</p>
        
        <div class="row row-cols-1 row-cols-md-2 g-4 mt-4">
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+1" class="card-img-top" alt="Imagem do Post Destaque 1">
                    <div class="card-body">
                        <h5 class="card-title">Explorando as Novidades do JavaScript Moderno</h5>
                        <p class="card-text">Um guia completo sobre as novas funcionalidades do ES2024 e como elas podem otimizar seu código.</p>
                        <a href="/post/1" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+2" class="card-img-top" alt="Imagem do Post Destaque 2">
                    <div class="card-body">
                        <h5 class="card-title">Os Desafios da Segurança Cibernética em 2025</h5>
                        <p class="card-text">Análise das principais ameaças e estratégias para proteger seus dados e sistemas.</p>
                        <a href="/post/2" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+3" class="card-img-top" alt="Imagem do Post Destaque 3">
                    <div class="card-body">
                        <h5 class="card-title">IA no Desenvolvimento: Automação e Otimização</h5>
                        <p class="card-text">Como a Inteligência Artificial está transformando a forma como escrevemos código e gerenciamos projetos.</p>
                        <a href="/post/3" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+4" class="card-img-top" alt="Imagem do Post Destaque 4">
                    <div class="card-body">
                        <h5 class="card-title">Soft Skills: Comunicação Eficaz para Tech Leads</h5>
                        <p class="card-text">Desenvolva suas habilidades interpessoais para liderar equipes de tecnologia com sucesso.</p>
                        <a href="/post/4" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+5" class="card-img-top" alt="Imagem do Post Destaque 5">
                    <div class="card-body">
                        <h5 class="card-title">Review: Os Melhores Gadgets para Programadores</h5>
                        <p class="card-text">Uma análise detalhada dos dispositivos que todo desenvolvedor deveria considerar em 2025.</p>
                        <a href="/post/5" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+6" class="card-img-top" alt="Imagem do Post Destaque 6">
                    <div class="card-body">
                        <h5 class="card-title">Cultura Dev: Inovação e Colaboração no Ambiente de Trabalho</h5>
                        <p class="card-text">Explore como as empresas de tecnologia estão fomentando ambientes criativos e produtivos.</p>
                        <a href="/post/6" class="stretched-link">Leia Mais</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;

