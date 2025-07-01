// src/index.js
const BASE_REPO_PATH = '/a-lifers-tech-blog';

function isLocalhost() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

const navBrand = document.querySelector('.navbar-brand');
if (navBrand) {
    navBrand.addEventListener('click', (event) => {
        event.preventDefault();
        let targetPath;
        targetPath = BASE_REPO_PATH + '/'; 
        window.history.pushState({ path: targetPath }, '', targetPath);
        handleRoute();
    });
}

// Função para buscar os posts (agora para as categorias dinâmicas)
async function fetchPosts() {
    try {
        const response = await fetch(`${BASE_REPO_PATH}/data/posts.json`); 
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

        const postLink = `${BASE_REPO_PATH}/post/${post.id}`; 

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

function renderSinglePost(post) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error("Main content container not found.");
        return;
    }
    mainContent.innerHTML = ''; // Limpa o conteúdo existente para exibir o post.

    if (!post) {
        mainContent.innerHTML = '<p class="text-center text-muted">Post não encontrado.</p>';
        return;
    }

    // Opcional: Adicionar links de tags se seu JSON tiver tags e você quiser que sejam clicáveis.
    const tagsHtml = post.tags && post.tags.length > 0
        ? post.tags.map(tag => `<a href="${BASE_REPO_PATH}/tag/${tag.toLowerCase()}" class="badge bg-primary text-decoration-none tag-link">${tag}</a>`).join(' ')
        : '';

    mainContent.innerHTML = `
        <article class="single-post my-4">
            <h1 class="mb-3">${post.titulo}</h1>
            <p class="text-muted">Publicado em: ${new Date(post.dataPublicacao).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })} por <strong>${post.autor}</strong></p>
            ${post.imagemCapa ? `<img src="${post.imagemCapa}" alt="Capa do post: ${post.titulo}" class="img-fluid mb-3">` : ''}
            <div class="post-content mb-4">
                ${post.conteudo}
            </div>
            ${tagsHtml ? `<div class="tags-section">Tags: ${tagsHtml}</div>` : ''}
            <hr>
            <p><a href="${BASE_REPO_PATH}/" class="btn btn-secondary">&larr; Voltar para o Início</a></p>
        </article>
    `;
}

// Função para filtrar posts por categoria (ainda usando a lógica de ordenação para 'latest')
function filterPosts(allPosts, type, value) {
    if (type === 'latest' || type === 'latests') { 
        // Retorna todos os posts ordenados do mais novo para o mais antigo
        return [...allPosts].sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));
    }
    // LINHA 109 (Adição): Adicione o filtro por categoria.
    if (type === 'category') {
        return allPosts.filter(post => post.categoria && post.categoria.toLowerCase() === value.toLowerCase());
    }
    // LINHA 112 (Adição): Adicione o filtro por tag.
    if (type === 'tag') {
        return allPosts.filter(post => post.tags && post.tags.some(tag => tag.toLowerCase() === value.toLowerCase()));
    }
    return []; // Retorna um array vazio se o tipo não for reconhecido
}


// // Função para exibir/ocultar os containers de posts
// function togglePostContainers(showFixed, showDynamic) {
//     const fixedPostsSection = document.getElementById('fixed-posts');
//     const dynamicPostsContainer = document.getElementById('posts-container');

//     if (fixedPostsSection) {
//         fixedPostsSection.style.display = showFixed ? 'block' : 'none';
//     }
//     if (dynamicPostsContainer) {
//         dynamicPostsContainer.style.display = showDynamic ? 'block' : 'none';
//     }
// }

// Função principal para gerenciar a rota e o conteúdo
async function handleRoute() {
    const allPosts = await fetchPosts();
    const mainContent = document.getElementById('main-content'); 

    const urlParams = new URLSearchParams(window.location.search);
    let path = window.location.pathname;
    let categoryFromQuery = urlParams.get(''); 

    if (categoryFromQuery) {
        path = '/' + categoryFromQuery; 
        window.history.replaceState({}, '', BASE_REPO_PATH + '/');
    }

    let cleanedPath = path.startsWith(BASE_REPO_PATH) ? path.substring(BASE_REPO_PATH.length) : path;
    if (cleanedPath === '') cleanedPath = '/';

    console.log("handleRoute called. Cleaned Path for routing:", cleanedPath); // Ajuda na depuração

    const postMatch = cleanedPath.match(/^\/post\/(\d+)$/);
    const categoryMatch = cleanedPath.match(/^\/([a-zA-Z0-9_-]+)$/);
    const tagMatch = cleanedPath.match(/^\/tag\/([a-zA-Z0-9_-]+)$/);


    if (postMatch) {
        const postId = postMatch[1];
        const post = allPosts.find(p => p.id == postId); 
        renderSinglePost(post); // Renderiza o post individual usando a nova função.
        updateActiveClass(null); // Nenhum item da navbar ativo para um post individual.
    } else if (tagMatch) {
        const tag = tagMatch[1];
        const postsToDisplay = filterPosts(allPosts, 'tag', tag); // Filtra por tag.
        // Adiciona um título e um container dinâmico para os posts da tag.
        mainContent.innerHTML = `<h2 class="text-center my-4">Posts com a Tag: <span class="text-primary">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span></h2><div id="posts-container" class="row row-cols-1 row-cols-md-2 g-4"></div>`;
        renderDynamicPosts(postsToDisplay);
        updateActiveClass(null); // Tags geralmente não ativam categorias na navbar.
    } else if (categoryMatch && categoryMatch[1].toLowerCase() !== 'tag') { // Garante que "tag" não seja tratada como categoria.
        const category = categoryMatch[1].toLowerCase(); 
        const postsToDisplay = filterPosts(allPosts, 'category', category); // Filtra por categoria.
        // Adiciona um título e um container dinâmico para os posts da categoria.
        mainContent.innerHTML = `<h2 class="text-center my-4">Categoria: <span class="text-primary">${category.charAt(0).toUpperCase() + category.slice(1)}</span></h2><div id="posts-container" class="row row-cols-1 row-cols-md-2 g-4"></div>`;
        renderDynamicPosts(postsToDisplay);
        updateActiveClass(category);
    } else { // Se nenhuma rota específica for encontrada (incluindo a rota raiz '/')
        mainContent.innerHTML = homePageContent; // Exibe o conteúdo da página inicial.
        updateActiveClass('latest'); // Ativa o link "Latest" na navbar, pois é a home.
    }
}

// Função para atualizar a classe 'active' no navbar
function updateActiveClass(currentCategory) {
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current'); 
        
        const linkCategory = link.dataset.category ? link.dataset.category.toLowerCase() : null;

        // A lógica de ativação deve ser um pouco diferente para o navbrand
        // Já que ele é a "home" mas não tem data-category
        if (linkCategory === currentCategory) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
        else if (currentCategory === 'latest' && linkCategory === 'latest') {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

const homePageContent = `
    <section class="home-section my-4 col-md-8">
        <div class="row row-cols-1 row-cols-md-2 g-4 mt-4">
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+1" class="card-img-top" alt="Imagem do Post Destaque 1">
                    <div class="card-body">
                        <h5 class="card-title">Explorando as Novidades do JavaScript Moderno</h5>
                        <p class="card-text">Um guia completo sobre as novas funcionalidades do ES2024 e como elas podem otimizar seu código.</p>
                        <a href="${BASE_REPO_PATH}/post/1" class="stretched-link post-card-link" data-post-id="1">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+2" class="card-img-top" alt="Imagem do Post Destaque 2">
                    <div class="card-body">
                        <h5 class="card-title">Os Desafios da Segurança Cibernética em 2025</h5>
                        <p class="card-text">Análise das principais ameaças e estratégias para proteger seus dados e sistemas.</p>
                        <a href="${BASE_REPO_PATH}/post/2" class="stretched-link post-card-link" data-post-id="2">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+3" class="card-img-top" alt="Imagem do Post Destaque 3">
                    <div class="card-body">
                        <h5 class="card-title">IA no Desenvolvimento: Automação e Otimização</h5>
                        <p class="card-text">Como a Inteligência Artificial está transformando a forma como escrevemos código e gerenciamos projetos.</p>
                        <a href="${BASE_REPO_PATH}/post/3" class="stretched-link post-card-link" data-post-id="3">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+4" class="card-img-top" alt="Imagem do Post Destaque 4">
                    <div class="card-body">
                        <h5 class="card-title">Soft Skills: Comunicação Eficaz para Tech Leads</h5>
                        <p class="card-text">Desenvolva suas habilidades interpessoais para liderar equipes de tecnologia com sucesso.</p>
                        <a href="${BASE_REPO_PATH}/post/4" class="stretched-link post-card-link" data-post-id="4">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+5" class="card-img-top" alt="Imagem do Post Destaque 5">
                    <div class="card-body">
                        <h5 class="card-title">Review: Os Melhores Gadgets para Programadores</h5>
                        <p class="card-text">Uma análise detalhada dos dispositivos que todo desenvolvedor deveria considerar em 2025.</p>
                        <a href="${BASE_REPO_PATH}/post/5" class="stretched-link post-card-link" data-post-id="5">Leia Mais</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card h-100 shadow-sm">
                    <img src="https://via.placeholder.com/400x200?text=Post+Destaque+6" class="card-img-top" alt="Imagem do Post Destaque 6">
                    <div class="card-body">
                        <h5 class="card-title">Cultura Dev: Inovação e Colaboração no Ambiente de Trabalho</h5>
                        <p class="card-text">Explore como as empresas de tecnologia estão fomentando ambientes criativos e produtivos.</p>
                        <a href="${BASE_REPO_PATH}/post/6" class="stretched-link post-card-link" data-post-id="6">Leia Mais</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const newPath = event.target.getAttribute('href');
            window.history.pushState({ path: newPath }, '', newPath);
            handleRoute(); 
        });
    });

    // Listener para o NavBrand (leva para a home)
    // const navBrand = document.querySelector('.navbar-brand');
    // if (navBrand) {
    //     navBrand.addEventListener('click', (event) => {
    //         event.preventDefault();
    //         window.history.pushState({ path: '/' }, '', '/');
    //         handleRoute();
    //     });
    // }

document.addEventListener('click', (event) => {
        const target = event.target.closest('a'); // Pega o 'a' mais próximo do elemento clicado
        if (!target) return; // Se o clique não foi em um link, sai

        const href = target.getAttribute('href');

        // Se o link começa com o BASE_REPO_PATH e "/post/" (rota de post individual)
        if (href && href.startsWith(`${BASE_REPO_PATH}/post/`)) {
            event.preventDefault(); // Impede o comportamento padrão do link
            const newPath = href; // O href já contém o caminho completo e correto
            window.history.pushState({ path: newPath }, '', newPath);
            handleRoute(); // Dispara o roteador SPA
        } 
        // Se o link começa com o BASE_REPO_PATH e "/tag/" (rota de listagem por tag)
        else if (href && href.startsWith(`${BASE_REPO_PATH}/tag/`)) {
            event.preventDefault(); // Impede o comportamento padrão do link
            const newPath = href; // O href já contém o caminho completo e correto
            window.history.pushState({ path: newPath }, '', newPath);
            handleRoute(); // Dispara o roteador SPA
        }
        // Os links de categoria (navbar) já são tratados pelo `querySelectorAll('.category-link')`
    });

    // Listener para o botão Voltar/Avançar do navegador
    window.addEventListener('popstate', handleRoute);

    // Renderiza o conteúdo inicial baseado na URL
    handleRoute();
});