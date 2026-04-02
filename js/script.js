let planetasConcluidos = new Set();
let planetaAtivo = 'terra', px=0, py=0, achados=0;
let ctxP, drawP = false, toolP = 'pincel', corP = '#f44336', stickerSel = '🚀';
let primeiraCarta, segundaCarta, memBloqueio = false, paresAchados = 0;
let startLetra = null, historiaBloqueada = false, callbackHistoria = null;
let historiaVista = { 'inicial': false, 'terraIn': false, 'marteIn': false, 'venusIn': false, 'saturnoIn': false, 'jupiterIn': false };
let isMuted = false;
let historicoPintura = [];
let paginaAtual = 0;
let emTransicao = false;
let cellsGrid = [];

// MODO DEV
let devMode = false, devTimer = null;
let config = {
    lab: { mapW: 415, mapH: 897, mapX: -44, mapY: -156, playerScale: 2.3, rocketScale: 4.2 },
    planetas: {
        terra: { top: 65.8, left: 20.3, w: 330, h: 330 },
        marte: { top: 31.9, left: 18.4, w: 208, h: 208 },
        venus: { top: 49.4, left: 58.9, w: 229, h: 229 },
        saturno: { top: 75.2, left: 71.7, w: 294, h: 294 },
        jupiter: { top: 20.3, left: 72, w: 427, h: 427 }
    }
};

function startDevTimer() {
    devTimer = setTimeout(() => {
        devMode = !devMode;
        const devContainer = document.getElementById('dev-container');
        if(devContainer) devContainer.classList.toggle('hidden', !devMode);
        document.body.classList.toggle('dev-mode-active', devMode);
        
        if (devMode) {
            alert("🛠️ MODO DEV DESIGN ATIVADO!\nUse o botão DEV no topo para ajustar os elementos.");
            if (typeof atualizarMenuDev === 'function') atualizarMenuDev();
        } else {
            const logText = JSON.stringify(config, null, 2);
            document.getElementById('dev-log-text').value = logText;
            document.getElementById('dev-log-modal').classList.remove('hidden');
        }
    }, 5000); 
}

function clearDevTimer() { clearTimeout(devTimer); }
function toggleDevMenu() { document.getElementById('dev-menu').classList.toggle('collapsed'); }
function fecharLogDev() { document.getElementById('dev-log-modal').classList.add('hidden'); }

function copiarLogDev() {
    const textarea = document.getElementById('dev-log-text');
    textarea.select();
    textarea.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(textarea.value).then(() => { alert("✅ Código copiado!"); })
    .catch(err => { document.execCommand('copy'); alert("✅ Código copiado!"); });
}

function atualizarMenuDev() {
    const area = document.getElementById('dev-controls-dinamico');
    const telaAtiva = document.querySelector('.screen.active');
    if(!area || !telaAtiva) return;
    const tela = telaAtiva.id;
    area.innerHTML = '';

    if (tela === 'tela-labirinto') {
        area.innerHTML = `
            <div class="dev-group">
                <span class="dev-title">CALIBRAR MAPA ESTILIZADO</span>
                <div class="dev-row">W: <button class="dev-btn" onclick="alt('lab','mapW',-5)">-</button><button class="dev-btn" onclick="alt('lab','mapW',5)">+</button></div>
                <div class="dev-row">H: <button class="dev-btn" onclick="alt('lab','mapH',-5)">-</button><button class="dev-btn" onclick="alt('lab','mapH',5)">+</button></div>
                <div class="dev-row">X: <button class="dev-btn" onclick="alt('lab','mapX',-2)">-</button><button class="dev-btn" onclick="alt('lab','mapX',2)">+</button></div>
                <div class="dev-row">Y: <button class="dev-btn" onclick="alt('lab','mapY',-2)">-</button><button class="dev-btn" onclick="alt('lab','mapY',2)">+</button></div>
            </div>
            <div class="dev-group">
                <span class="dev-title">TAMANHO DOS BONECOS</span>
                <div class="dev-row">A: <button class="dev-btn" onclick="alt('lab','playerScale',-0.1)">-</button><button class="dev-btn" onclick="alt('lab','playerScale',0.1)">+</button></div>
                <div class="dev-row">F: <button class="dev-btn" onclick="alt('lab','rocketScale',-0.1)">-</button><button class="dev-btn" onclick="alt('lab','rocketScale',0.1)">+</button></div>
            </div>`;
    } else if (tela === 'tela-planetas') {
        let opt = Object.keys(config.planetas).map(p => `<option value="${p}">${p.toUpperCase()}</option>`).join('');
        area.innerHTML = `
            <div class="dev-group">
                <span class="dev-title">AJUSTAR POSIÇÕES DO MAPA</span>
                <select id="sel-obj" style="margin-bottom:5px; padding: 4px; font-weight: bold; width: 80%; text-align: center;" onchange="atualizarMenuDev()">${opt}</select>
                <div class="dev-row">TOPO: <button class="dev-btn" onclick="altPlan('top',-1)">-</button><button class="dev-btn" onclick="altPlan('top',1)">+</button></div>
                <div class="dev-row">ESQ: <button class="dev-btn" onclick="altPlan('left',-1)">-</button><button class="dev-btn" onclick="altPlan('left',1)">+</button></div>
                <div class="dev-row">TAM: <button class="dev-btn" onclick="altPlan('w',-5)">-</button><button class="dev-btn" onclick="altPlan('w',5)">+</button></div>
            </div>`;
    }
    aplicarConfiguracoes();
}

function alt(cat, prop, val) { config[cat][prop] = parseFloat((config[cat][prop] + val).toFixed(2)); aplicarConfiguracoes(); }
function altPlan(prop, val) { 
    let p = document.getElementById('sel-obj').value; 
    config.planetas[p][prop] = parseFloat((config.planetas[p][prop] + val).toFixed(2)); 
    if(prop === 'w') config.planetas[p]['h'] = config.planetas[p]['w']; 
    aplicarConfiguracoes(); 
}

function aplicarConfiguracoes() {
    const m = document.getElementById('mapa-calibracao');
    if (m) {
        m.style.width = config.lab.mapW + 'px'; m.style.height = config.lab.mapH + 'px';
        m.style.left = config.lab.mapX + 'px'; m.style.top = config.lab.mapY + 'px';
    }
    const pI = document.getElementById('player-avatar');
    if (pI) pI.style.transform = `scale(${config.lab.playerScale})`;
    const rI = document.getElementById('final-rocket');
    if (rI) rI.style.transform = `scale(${config.lab.rocketScale})`;

    for (let p in config.planetas) {
        const el = document.getElementById('p-' + p);
        const nm = document.getElementById('n-' + p);
        if (el) {
            el.style.top = config.planetas[p].top + '%'; el.style.left = config.planetas[p].left + '%';
            el.style.width = config.planetas[p].w + 'px'; el.style.height = config.planetas[p].h + 'px';
        }
        if (nm) { nm.style.top = (config.planetas[p].top + 11) + '%'; nm.style.left = config.planetas[p].left + '%'; }
    }
}


const pontosFoguete = {
    'terra': { top: '58.1%', left: '33.6%', rotate: '23deg', width: '162px' },
    'marte': { top: '28.4%', left: '27.1%', rotate: '30deg', width: '118px' },
    'venus': { top: '45.4%', left: '69.2%', rotate: '31deg', width: '147px' },
    'saturno': { top: '66.7639%', left: '79.0219%', rotate: '8.69deg', width: '137px' },
    'jupiter': { top: '11.8047%', left: '88.9583%', rotate: '30.6deg', width: '195px' }
};

const bancoMem = [
    'assets/terra-memoria.png', 'assets/marte-fundo-memoria.png', 'assets/venus-memoria.png', 'assets/saturno-memoria.png', 'assets/jupiter-memoria.png', 
    'assets/terra-fundo-memoria.png', 'assets/saturno-fundo-memoria.png', 'assets/venus-fundo-memoria.png', 'assets/jupiter-fundo-memoria.png', 'assets/luis-pulando-memoria.png'
];

function tocarSom(id) {
    if (isMuted) return;
    const som = document.getElementById(id);
    if (som) {
        som.currentTime = 0; 
        let playPromise = som.play();
        if (playPromise !== undefined) { playPromise.catch(e => console.log("Áudio aguardando interação", e)); }
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) bgMusic.muted = isMuted;
    document.getElementById('btn-mute').innerText = isMuted ? "🔇" : "🔊";
}

function abrirHistoria(pag, callback = null) {
    historiaBloqueada = true; callbackHistoria = callback;
    paginaAtual = pag;
    const overlay = document.getElementById('history-overlay');
    const img = document.getElementById('history-img');
    img.src = `assets/pag-${pag}.png`;
    overlay.style.display = 'flex';
    img.className = 'comic-in';
}

function fecharHistoria() {
    const img = document.getElementById('history-img');
    img.className = 'comic-out';
    setTimeout(() => {
        document.getElementById('history-overlay').style.display = 'none';
        historiaBloqueada = false;
        if(callbackHistoria) { callbackHistoria(); callbackHistoria = null; }
    }, 500);
}

function interagirHistoria() {
    if (emTransicao) return;
    if (paginaAtual >= 11 && paginaAtual < 14) {
        emTransicao = true;
        const img = document.getElementById('history-img');
        img.className = 'comic-out';
        setTimeout(() => { paginaAtual++; img.src = `assets/pag${paginaAtual}.png`; img.className = 'comic-fast-in'; emTransicao = false; }, 500);
    } else if (paginaAtual === 14) { finalizarJogo(); } else { fecharHistoria(); }
}

function iniciarFinal() {
    historiaBloqueada = true; paginaAtual = 11;
    const overlay = document.getElementById('history-overlay');
    const img = document.getElementById('history-img');
    img.src = `assets/pag${paginaAtual}.png`;
    overlay.style.display = 'flex'; img.className = 'fade-in-img';
}

function finalizarJogo() {
    emTransicao = true;
    const fade = document.getElementById('fade-overlay');
    const overlay = document.getElementById('history-overlay');
    fade.style.display = 'block';
    setTimeout(() => { fade.classList.add('fade-to-black'); }, 50);
    setTimeout(() => {
        overlay.style.display = 'none'; mostrarTela('tela-inicial');
        document.getElementById('titulo-principal').style.display = 'none';
        document.getElementById('btn-iniciar').style.display = 'none';
        document.getElementById('texto-fim').style.display = 'block';
        fade.classList.remove('fade-to-black'); fade.classList.add('fade-from-black');
        setTimeout(() => {
            document.getElementById('titulo-principal').style.display = 'block';
            document.getElementById('btn-iniciar').style.display = 'block';
            document.getElementById('texto-fim').style.display = 'none';
            fade.style.display = 'none'; fade.classList.remove('fade-from-black');
            emTransicao = false; historiaBloqueada = false; paginaAtual = 0; planetasConcluidos.clear();
            for(let key in historiaVista) { historiaVista[key] = false; }
            atualizarMapa();
        }, 15000);
    }, 4000);
}

function iniciarComHistoria() {
    mostrarTela('tela-planetas');
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic && !isMuted) bgMusic.play().catch(e => console.log("Áudio aguardando interação"));
    if (!historiaVista['inicial']) { abrirHistoria(1); historiaVista['inicial'] = true; }
}

function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.replace('active','hidden'));
    document.getElementById(id).classList.replace('hidden','active');
    if (id === 'tela-inicial') document.body.className = 'bg-inicial';
    else if (id === 'tela-planetas') { document.body.className = 'bg-mapa'; atualizarMapa(); }
    else document.body.className = 'bg-' + planetaAtivo;
    if (typeof atualizarMenuDev === 'function' && devMode) atualizarMenuDev();
}

function atualizarMapa() {
    document.querySelectorAll('.obj-fixo').forEach(el => {
        const pId = el.id.substring(2);
        if (el.id.startsWith('b-')) {
            if (pId === 'terra' && planetasConcluidos.has('jupiter')) { el.style.display = 'none'; } 
            else { el.style.display = planetasConcluidos.has(pId) ? 'block' : 'none'; }
        }
    });
    document.querySelectorAll('.planeta').forEach(p => {
        const id = p.id.replace('p-','');
        if(id==='terra' || (id==='marte' && planetasConcluidos.has('terra')) || (id==='venus' && planetasConcluidos.has('marte')) || (id==='saturno' && planetasConcluidos.has('venus')) || (id==='jupiter' && planetasConcluidos.has('saturno'))) p.classList.remove('bloqueado');
        else p.classList.add('bloqueado');
    });
    
    const fog = document.getElementById('foguete-viajante');
    if (planetasConcluidos.has('terra')) {
        const c = pontosFoguete[planetaAtivo];
        fog.style.display = 'block'; fog.style.top = c.top; fog.style.left = c.left; fog.style.width = c.width; fog.style.transform = `translate(-50%, -50%) rotate(${c.rotate})`;
    } else { fog.style.display = 'none'; }

    const imgTerra = document.querySelector('#p-terra .img-planeta');
    if (planetasConcluidos.has('jupiter')) { if (imgTerra) imgTerra.classList.add('pulsar-terra'); } 
    else { if (imgTerra) imgTerra.classList.remove('pulsar-terra'); }
}

function jogar(p) {
    if(historiaBloqueada) return;
    const elP = document.getElementById('p-' + p);
    if(elP && !elP.classList.contains('bloqueado')) {
        if (p === 'terra' && planetasConcluidos.has('jupiter')) {
            planetaAtivo = p; const fog = document.getElementById('foguete-viajante'); const d = pontosFoguete[p];
            tocarSom('sfx-foguete'); fog.classList.add('foguete-voando'); fog.style.top = d.top; fog.style.left = d.left; fog.style.width = d.width; fog.style.transform = `translate(-50%, -50%) rotate(${d.rotate})`;
            setTimeout(() => { fog.classList.remove('foguete-voando'); iniciarFinal(); }, 1550); return;
        }
        if (planetaAtivo === p || !planetasConcluidos.has('terra')) {
            planetaAtivo = p; gerenciarEntradaPlaneta(p);
        } else {
            const fog = document.getElementById('foguete-viajante'); planetaAtivo = p; const d = pontosFoguete[p];
            tocarSom('sfx-foguete'); fog.classList.add('foguete-voando'); fog.style.top = d.top; fog.style.left = d.left; fog.style.width = d.width; fog.style.transform = `translate(-50%, -50%) rotate(${d.rotate})`;
            setTimeout(() => { fog.classList.remove('foguete-voando'); gerenciarEntradaPlaneta(p); }, 1550);
        }
    }
}

function gerenciarEntradaPlaneta(p) {
    let pIn = p + 'In';
    if (!planetasConcluidos.has(p) && !historiaVista[pIn]) {
        if(p === 'marte') abrirHistoria(3, () => iniciarJogoReal(p));
        else if(p === 'venus') abrirHistoria(5, () => iniciarJogoReal(p));
        else if(p === 'saturno') abrirHistoria(7, () => iniciarJogoReal(p));
        else if(p === 'jupiter') abrirHistoria(9, () => iniciarJogoReal(p));
        else { historiaVista['terraIn'] = true; iniciarJogoReal(p); }
        historiaVista[pIn] = true;
    } else { iniciarJogoReal(p); }
}

function iniciarJogoReal(p) {
    document.querySelectorAll('.msg-vitoria').forEach(m => m.classList.add('hidden'));
    if(p === 'terra') { px=0; py=0; desenharLab(); mostrarTela('tela-labirinto'); }
    else if(p === 'marte') { achados=0; document.querySelectorAll('.marca-x').forEach(x=>x.remove()); document.querySelectorAll('.hitbox').forEach(h=>delete h.dataset.ok); mostrarTela('tela-erros'); }
    else if(p === 'venus') { mostrarTela('tela-colorir'); setTimeout(redimensionarCanvas,100); }
    else if(p === 'saturno') { iniciarMemoria(); mostrarTela('tela-memoria'); }
    else if(p === 'jupiter') { iniciarJupiter(); mostrarTela('tela-jupiter'); }
}

function concluirPlaneta(p, pag) {
    if (!planetasConcluidos.has(p)) { planetasConcluidos.add(p); mostrarTela('tela-planetas'); abrirHistoria(pag); } else { mostrarTela('tela-planetas'); }
}

function marcarErro(h) { 
    if(h.dataset.ok) return; 
    h.dataset.ok=1; achados++; 
    const x=document.createElement('div'); x.className='marca-x'; x.innerHTML='❌'; x.style.left=h.style.left; x.style.top=h.style.top; 
    document.getElementById('area-erros').appendChild(x); 
    if(achados===7) { tocarSom('sfx-vitoria'); document.getElementById('msg-vitoria-marte').classList.remove('hidden'); setTimeout(() => concluirPlaneta('marte', 4), 2500); } 
}

function voltarParaMapa() {
    document.querySelectorAll('.msg-vitoria').forEach(m=>m.classList.add('hidden'));
    mostrarTela('tela-planetas');
}

/* JOGO DO LABIRINTO */
const mapaLab = [
    ['0','0','0','0','0','0','0','0','0','0'],['1','0','1','1','0','1','0','1','1','0'],
    ['0','0','0','1','0','0','0','0','0','0'],['1','0','1','1','0','1','1','1','1','0'],
    ['0','0','1','0','0','0','0','0','0','0'],['1','1','0','0','1','1','1','0','1','1'],
    ['0','0','0','1','0','0','0','0','0','0'],['0','1','1','1','0','1','1','1','1','0'],
    ['0','0','0','0','0','0','0','0','1','0'],['0','1','0','1','1','0','1','1','0','0'],
    ['0','1','0','0','0','0','0','0','0','1'],['1','1','0','1','1','1','1','1','1','0'],
    ['0','0','0','1','0','0','0','0','0','0'],['0','1','1','1','0','1','1','1','1','0'],
    ['0','0','0','0','0','1','E','0','0','0']
];

function gerarEstruturaLab() {
    const t = document.getElementById('tabuleiro-labirinto');
    if (!t) return;
    const filhos = t.querySelectorAll('.celula, .jogador-icon, .chegada-icon');
    filhos.forEach(f => f.remove());
    cellsGrid = []; 
    for (let y = 0; y < 15; y++) {
        cellsGrid[y] = [];
        for (let x = 0; x < 10; x++) {
            const c = document.createElement('div');
            c.className = 'celula ' + (mapaLab[y][x] === '1' ? 'parede' : 'caminho');
            t.appendChild(c);
            cellsGrid[y][x] = c; 
        }
    }
}

function desenharLab(avatarImg = 'assets/luis-frente.png') { 
    const board = document.getElementById('tabuleiro-labirinto'); 
    if (!board) return;
    if (board.querySelectorAll('.celula').length === 0) gerarEstruturaLab();

    let targetX = -1, targetY = -1;
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 10; x++) { if (mapaLab[y][x] === 'E') { targetX = x; targetY = y; break; } }
        if (targetX !== -1) break;
    }

    let fogueteEl = document.getElementById('final-rocket');
    if (!fogueteEl) {
        fogueteEl = document.createElement('div'); fogueteEl.id = 'final-rocket'; fogueteEl.className = 'chegada-icon'; board.appendChild(fogueteEl);
    }
    fogueteEl.style.left = (targetX * 33) + 'px'; fogueteEl.style.top = (targetY * 33) + 'px';

    let avatarEl = document.getElementById('player-avatar');
    if (!avatarEl) {
        avatarEl = document.createElement('div'); avatarEl.id = 'player-avatar'; avatarEl.className = 'jogador-icon'; board.appendChild(avatarEl);
    }
    avatarEl.style.backgroundImage = `url('${avatarImg}')`;
    avatarEl.style.left = (px * 33) + 'px'; avatarEl.style.top = (py * 33) + 'px';

    // 🔥 BUGFIX: O loop do aplicarConfiguracoes foi removido daqui para tirar o lag! 🔥
    avatarEl.style.transform = `scale(${config.lab.playerScale})`;
    fogueteEl.style.transform = `scale(${config.lab.rocketScale})`;

    if(px === targetX && py === targetY) { 
        // 🔥 BUGFIX: Delay suave de 150ms na mensagem para o boneco terminar de entrar no espaço 🔥
        setTimeout(() => {
            tocarSom('sfx-vitoria'); 
            document.getElementById('msg-vitoria-terra').classList.remove('hidden'); 
        }, 150);
        setTimeout(() => concluirPlaneta('terra', 2), 2500); 
    } 
}

function moverLab(dx, dy) { 
    let nx = px + dx, ny = py + dy; 
    let novaImagem = 'assets/luis-frente.png';
    if (dx === 1) novaImagem = 'assets/luis-direita.png'; else if (dx === -1) novaImagem = 'assets/luis-esquerda.png'; else if (dy === -1) novaImagem = 'assets/luis-costas.png';
    if (nx >= 0 && nx < 10 && ny >= 0 && ny < 15 && mapaLab[ny][nx] !== '1') { px = nx; py = ny; }
    desenharLab(novaImagem); 
}

// 🔥 BALDE DE TINTA APRIMORADO CONTRA VAZAMENTOS 🔥
let cachedBounds = null; 

function prepararBaldeDeTinta() {
    const img = document.getElementById('img-para-colorir');
    const c = document.getElementById('paintCanvas');
    if(!img || !c) return;
    
    // Tenta burlar o sistema de segurança se estiver local, mas como está no Vercel não é mais problema!
        
