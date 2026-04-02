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

// 🔥 ESCUDO CONTRA CLIQUES FANTASMAS (Bug do botão Iniciar) 🔥
let delayClickHistoria = false;

let devMode = false, devTimer = null;
let isPressing = false;
let touchTrigged = false;

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

function iniciarPress(e) {
    if (e.type === 'touchstart') touchTrigged = true;
    if (e.type === 'mousedown' && touchTrigged) return; 
    
    isPressing = true;
    devTimer = setTimeout(() => {
        isPressing = false; 
        devMode = !devMode;
        const devContainer = document.getElementById('dev-container');
        if(devContainer) devContainer.classList.toggle('hidden', !devMode);
        document.body.classList.toggle('dev-mode-active', devMode);
        
        if (devMode) {
            alert("🛠️ MODO DEV DESIGN ATIVADO!");
            if (typeof atualizarMenuDev === 'function') atualizarMenuDev();
        } else {
            const logText = JSON.stringify(config, null, 2);
            document.getElementById('dev-log-text').value = logText;
            document.getElementById('dev-log-modal').classList.remove('hidden');
        }
    }, 5000); 
}

function cancelarPress(e) {
    if (e.type === 'mouseup' && touchTrigged) return;
    if (e.type === 'touchend') {
        setTimeout(() => { touchTrigged = false; }, 500); 
    }

    clearTimeout(devTimer);
    
    if (isPressing && (e.type === 'mouseup' || e.type === 'touchend')) {
        iniciarComHistoria();
    }
    isPressing = false; 
}


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
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Áudio bloqueado pelo navegador", e));
        }
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

// 🔥 BUGFIX: O "delayClickHistoria" ignora aquele clique fantasma do celular 🔥
function interagirHistoria() {
    if (delayClickHistoria || emTransicao) return;
    
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
    // Ativa o escudo de 500ms para evitar pulo de página acidental
    delayClickHistoria = true;
    setTimeout(() => { delayClickHistoria = false; }, 500); 
    
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

/* 🔥 BUGFIX: O ponto 'E' foi restaurado para a coluna certa (x=8) para o foguete aparecer ali! 🔥 */
const mapaLab = [
    ['0','0','0','0','0','0','0','0','0','0'],
    ['1','0','1','1','0','1','0','1','1','0'],
    ['0','0','0','1','0','0','0','0','0','0'],
    ['1','0','1','1','0','1','1','1','1','0'],
    ['0','0','1','0','0','0','0','0','0','0'],
    ['1','1','0','0','1','1','1','0','1','1'],
    ['0','0','0','1','0','0','0','0','0','0'],
    ['0','1','1','1','0','1','1','1','1','0'],
    ['0','0','0','0','0','0','0','0','1','0'],
    ['0','1','0','1','1','0','1','1','0','0'],
    ['0','1','0','0','0','0','0','0','0','1'],
    ['1','1','0','1','1','1','1','1','1','0'],
    ['0','0','0','1','0','0','0','0','0','0'],
    ['0','1','1','1','0','1','1','1','1','0'],
    ['0','0','0','0','0','1','0','0','E','0']
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
        fogueteEl = document.createElement('div'); 
        fogueteEl.id = 'final-rocket'; 
        fogueteEl.className = 'chegada-icon'; 
        board.appendChild(fogueteEl);
    }
    
    // 🔥 FORÇANDO O TAMANHO E O BACKGROUND NO JAVASCRIPT POR SEGURANÇA 🔥
    fogueteEl.style.width = '32px'; fogueteEl.style.height = '32px';
    fogueteEl.style.backgroundImage = "url('assets/foguete.png')";
    fogueteEl.style.left = (targetX * 33) + 'px'; 
    fogueteEl.style.top = (targetY * 33) + 'px';
    fogueteEl.style.transform = `scale(${config.lab.rocketScale})`;

    let avatarEl = document.getElementById('player-avatar');
    if (!avatarEl) {
        avatarEl = document.createElement('div'); 
        avatarEl.id = 'player-avatar'; 
        avatarEl.className = 'jogador-icon'; 
        board.appendChild(avatarEl);
    }
    
    avatarEl.style.width = '32px'; avatarEl.style.height = '32px';
    avatarEl.style.backgroundImage = `url('${avatarImg}')`;
    avatarEl.style.left = (px * 33) + 'px'; 
    avatarEl.style.top = (py * 33) + 'px';
    avatarEl.style.transform = `scale(${config.lab.playerScale})`;

    if(px === targetX && py === targetY) { 
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


let cachedBounds = null; 

function prepararBaldeDeTinta() {
    const img = document.getElementById('img-para-colorir');
    const c = document.getElementById('paintCanvas');
    if(!img || !c) return;
    
    fetch(img.src).then(res => res.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        const tempImg = new Image();
        tempImg.onload = () => {
            const offC = document.createElement('canvas');
            offC.width = c.width; offC.height = c.height;
            const offCtx = offC.getContext('2d', {willReadFrequently: true});
            offCtx.drawImage(tempImg, 0, 0, c.width, c.height);
            try { cachedBounds = offCtx.getImageData(0, 0, c.width, c.height).data; } catch(e) { } 
        };
        tempImg.src = url;
    }).catch(e => {}); 
}

function hexToRgba(hex) {
    let r = parseInt(hex.slice(1,3), 16); let g = parseInt(hex.slice(3,5), 16); let b = parseInt(hex.slice(5,7), 16); return [r, g, b, 255];
}

function preencherCor(startX, startY, corHex) {
    const c = document.getElementById('paintCanvas');
    const img = document.getElementById('img-para-colorir');
    let bounds;

    if (cachedBounds) {
        bounds = cachedBounds;
    } else {
        const offC = document.createElement('canvas');
        offC.width = c.width; offC.height = c.height;
        const offCtx = offC.getContext('2d', {willReadFrequently: true});
        try {
            offCtx.drawImage(img, 0, 0, c.width, c.height);
            bounds = offCtx.getImageData(0, 0, c.width, c.height).data;
        } catch(e) {
            alert("⚠️ ALERTA ⚠️\nNavegador bloqueou o uso do balde.");
            setTool('pincel'); return;
        }
    }

    const imgData = ctxP.getImageData(0, 0, c.width, c.height);
    const pixels = imgData.data;
    let targetC = hexToRgba(corHex);
    let sIdx = (startY * c.width + startX) * 4;
    let sr = pixels[sIdx], sg = pixels[sIdx+1], sb = pixels[sIdx+2];

    if (sr === targetC[0] && sg === targetC[1] && sb === targetC[2]) return;

    let stack = [[startX, startY]];

    const isBoundary = (idx) => {
        let r = bounds[idx], g = bounds[idx+1], b = bounds[idx+2], a = bounds[idx+3];
        let luma = (r*0.299) + (g*0.587) + (b*0.114);
        return (a > 30 && luma < 240); 
    };

    while(stack.length > 0) {
        let [x, y] = stack.pop();
        let idx = (y * c.width + x) * 4;

        if (pixels[idx] !== sr || pixels[idx+1] !== sg || pixels[idx+2] !== sb || isBoundary(idx)) continue;

        let leftX = x;
        while (leftX >= 0) {
            let tempIdx = (y * c.width + leftX) * 4;
            if (pixels[tempIdx] !== sr || pixels[tempIdx+1] !== sg || pixels[tempIdx+2] !== sb || isBoundary(tempIdx)) break;
            leftX--;
        }
        leftX++;

        let rightX = x;
        while (rightX < c.width) {
            let tempIdx = (y * c.width + rightX) * 4;
            if (pixels[tempIdx] !== sr || pixels[tempIdx+1] !== sg || pixels[tempIdx+2] !== sb || isBoundary(tempIdx)) break;
            rightX++;
        }
        rightX--;

        for (let i = leftX; i <= rightX; i++) {
            let fIdx = (y * c.width + i) * 4;
            pixels[fIdx] = targetC[0]; pixels[fIdx+1] = targetC[1]; pixels[fIdx+2] = targetC[2]; pixels[fIdx+3] = 255;
            
            if (y > 0) {
                let uIdx = ((y - 1) * c.width + i) * 4;
                if (pixels[uIdx] === sr && !isBoundary(uIdx)) stack.push([i, y - 1]);
            }
            if (y < c.height - 1) {
                let dIdx = ((y + 1) * c.width + i) * 4;
                if (pixels[dIdx] === sr && !isBoundary(dIdx)) stack.push([i, y + 1]);
            }
        }
    }
    ctxP.putImageData(imgData, 0, 0);
    salvarEstadoPintura();
}

function redimensionarCanvas() { 
    const c = document.getElementById('paintCanvas'); 
    ctxP = c.getContext('2d', {willReadFrequently: true}); 
    c.width = c.offsetWidth; c.height = c.offsetHeight; 
    ctxP.fillStyle = "white"; ctxP.fillRect(0,0,c.width,c.height); 
    salvarEstadoPintura(); 
    
    prepararBaldeDeTinta();

    if(!c.dataset.listenerOn) {
        c.addEventListener('touchstart', e => { 
            e.preventDefault(); 
            const r=c.getBoundingClientRect(); 
            const tx = Math.floor(e.touches[0].clientX-r.left);
            const ty = Math.floor(e.touches[0].clientY-r.top);
            
            if(toolP==='sticker') { 
                ctxP.globalAlpha=1; ctxP.font="40px Arial"; ctxP.fillText(stickerSel, tx-20, ty+20); salvarEstadoPintura(); return; 
            }
            if(toolP==='balde') {
                preencherCor(tx, ty, corP); return;
            }

            drawP=true; ctxP.beginPath(); ctxP.moveTo(tx, ty); 
        }, {passive: false}); 

        c.addEventListener('touchmove', e => { 
            if(!drawP || toolP==='sticker' || toolP==='balde') return; 
            e.preventDefault(); const r=c.getBoundingClientRect(); 
            ctxP.lineTo(e.touches[0].clientX-r.left, e.touches[0].clientY-r.top); 
            ctxP.strokeStyle=toolP==='borracha'?'white':corP; 
            ctxP.lineWidth=document.getElementById('slider-peso').value; 
            ctxP.lineCap='round'; ctxP.stroke(); 
        }, {passive: false}); 

        c.addEventListener('touchend', () => { 
            if(drawP) { drawP=false; salvarEstadoPintura(); }
        });
        c.dataset.listenerOn = "1";
    }
}

function salvarEstadoPintura() { const c = document.getElementById('paintCanvas'); historicoPintura.push(c.toDataURL()); if (historicoPintura.length > 20) historicoPintura.shift(); }
function desfazerPintura() { const c = document.getElementById('paintCanvas'); if (historicoPintura.length > 0) { historicoPintura.pop(); ctxP.fillStyle = "white"; ctxP.fillRect(0, 0, c.width, c.height); if (historicoPintura.length > 0) { let imgData = historicoPintura[historicoPintura.length - 1]; let img = new Image(); img.src = imgData; img.onload = () => ctxP.drawImage(img, 0, 0); } } }
function limparPintura() { const c = document.getElementById('paintCanvas'); ctxP.fillStyle = "white"; ctxP.fillRect(0, 0, c.width, c.height); historicoPintura = []; salvarEstadoPintura(); }
function salvarArte() { const c = document.getElementById('paintCanvas'); const tempCanvas = document.createElement('canvas'); tempCanvas.width = c.width; tempCanvas.height = c.height; const tCtx = tempCanvas.getContext('2d'); tCtx.drawImage(c, 0, 0); tCtx.globalCompositeOperation = 'multiply'; const imgFundo = document.getElementById('img-para-colorir'); tCtx.drawImage(imgFundo, 0, 0, tempCanvas.width, tempCanvas.height); const link = document.createElement('a'); link.download = 'arte-espacial-luis.png'; link.href = tempCanvas.toDataURL('image/png'); link.click(); }

function mudarCor(c, el) { 
    corP=c; 
    document.querySelectorAll('.balde-tinta').forEach(b => b.classList.remove('selecionado')); 
    el.classList.add('selecionado'); 
    if(toolP !== 'balde') setTool('pincel'); 
}

function setTool(t) { toolP=t; document.querySelectorAll('.ferramenta-btn').forEach(b=>b.classList.remove('ativo')); const btn = document.getElementById('btn-'+t); if(btn) btn.classList.add('ativo'); }
function toggleStickers() { document.getElementById('menu-stickers').classList.toggle('hidden'); }
function addSticker(s) { toolP='sticker'; stickerSel=s; toggleStickers(); }
function concluirPintura() { tocarSom('sfx-vitoria'); document.getElementById('msg-vitoria-venus').classList.remove('hidden'); setTimeout(() => concluirPlaneta('venus', 6), 2500); }
function iniciarMemoria() { memBloqueio = true; primeiraCarta = null; segundaCarta = null; paresAchados = 0; const grade = document.getElementById('grade-cartas'); grade.innerHTML = ''; grade.style.gridTemplateColumns = `repeat(4, 80px)`; let b = [...bancoMem].sort(() => Math.random() - 0.5).slice(0, 8); let j = [...b, ...b].sort(() => Math.random() - 0.5); j.forEach(img => { const c = document.createElement('div'); c.className = 'carta'; c.dataset.img = img; c.innerHTML = `<div class="face frente"></div><div class="face verso"><img src="${img}"></div>`; c.onclick = () => virarMem(c); grade.appendChild(c); }); setTimeout(() => memBloqueio = false, 300); }
function virarMem(c) { if(memBloqueio || c === primeiraCarta || c.classList.contains('virada')) return; c.classList.add('virada'); if(!primeiraCarta) { primeiraCarta = c; return; } segundaCarta = c; memBloqueio = true; if(primeiraCarta.dataset.img === segundaCarta.dataset.img) { setTimeout(() => { primeiraCarta.classList.add('acerto'); segundaCarta.classList.add('acerto'); setTimeout(() => { primeiraCarta.classList.add('escondida'); segundaCarta.classList.add('escondida'); paresAchados++; if(paresAchados === 8) { tocarSom('sfx-vitoria'); document.getElementById('msg-vitoria-saturno').classList.remove('hidden'); setTimeout(() => concluirPlaneta('saturno', 8), 3000); } memBloqueio = false; primeiraCarta = null; segundaCarta = null; }, 400); }, 300); } else { setTimeout(() => { primeiraCarta.classList.add('erro'); segundaCarta.classList.add('erro'); setTimeout(() => { primeiraCarta.classList.remove('virada', 'erro'); segundaCarta.classList.remove('virada', 'erro'); memBloqueio = false; primeiraCarta = null; segundaCarta = null; }, 600); }, 500); } }
const palavrasJupiter = ["LUIS", "FELIPE", "ASTRONAUTA", "FOGUETE", "ESPACO", "TERRA"];
let palavrasEncontradas = [];
function iniciarJupiter() { palavrasEncontradas = []; document.getElementById('msg-vitoria-jupiter').classList.add('hidden'); const l = document.getElementById('lista-jupiter'); l.innerHTML = ''; palavrasJupiter.forEach(p => { const div = document.createElement('div'); div.className = 'palavra-item'; div.id = 'list-' + p; div.innerText = p; l.appendChild(div); }); gerarGridJupiter(); }
function gerarGridJupiter() { const g = document.getElementById('grid-jupiter'); g.innerHTML = ''; const grid = Array(12).fill().map(() => Array(12).fill('')); palavrasJupiter.forEach(p => { let inserida = false; while(!inserida) { let d = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]][Math.floor(Math.random()*8)]; let x = Math.floor(Math.random()*12), y = Math.floor(Math.random()*12); if(p.split('').every((l,i) => { let nx=x+i*d[0], ny=y+i*d[1]; return nx>=0 && nx<12 && ny>=0 && ny<12 && (grid[ny][nx]==='' || grid[ny][nx]===l); })) { p.split('').forEach((l,i) => grid[y+i*d[1]][x+i*d[0]] = l); inserida = true; } } }); const abc = "ABCDEGHJKLMNOPQRSTUVWXYZ"; for(let y=0; y<12; y++) for(let x=0; x<12; x++) { if(grid[y][x] === '') grid[y][x] = abc[Math.floor(Math.random()*abc.length)]; const box = document.createElement('div'); box.className = 'letra-box'; box.innerText = grid[y][x]; box.dataset.x = x; box.dataset.y = y; box.addEventListener('touchstart', e => { e.preventDefault(); startLetra = box; box.classList.add('selecionada'); }); box.addEventListener('touchmove', e => { const touch = e.touches[0]; const t = document.elementFromPoint(touch.clientX, touch.clientY); if(t && t.classList.contains('letra-box')) { document.querySelectorAll('.letra-box.selecionada').forEach(b => b.classList.remove('selecionada')); getLinhaLetras(startLetra, t).forEach(c => c.classList.add('selecionada')); } }); box.addEventListener('touchend', () => { const sel = document.querySelectorAll('.letra-box.selecionada'); let pStr = Array.from(sel).map(b => b.innerText).join(''); let pRev = pStr.split('').reverse().join(''); let encontrada = palavrasJupiter.includes(pStr) ? pStr : (palavrasJupiter.includes(pRev) ? pRev : ""); if(encontrada && !palavrasEncontradas.includes(encontrada)) { palavrasEncontradas.push(encontrada); sel.forEach(b => { b.classList.remove('selecionada'); b.classList.add('marcada'); }); let itemLista = document.getElementById('list-' + encontrada); if(itemLista) itemLista.classList.add('encontrada'); if(palavrasEncontradas.length === palavrasJupiter.length) { tocarSom('sfx-vitoria'); document.getElementById('msg-vitoria-jupiter').classList.remove('hidden'); setTimeout(() => concluirPlaneta('jupiter', 10), 3000); } } document.querySelectorAll('.letra-box.selecionada').forEach(b => b.classList.remove('selecionada')); }); g.appendChild(box); } }
function getLinhaLetras(s, e) { let x1 = parseInt(s.dataset.x), y1 = parseInt(s.dataset.y), x2 = parseInt(e.dataset.x), y2 = parseInt(e.dataset.y); let dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1); if(dx !== 0 && dy !== 0 && Math.abs(x2-x1) !== Math.abs(y2-y1)) return [s]; let cells = [], cx = x1, cy = y1; while(cx !== x2 + dx || cy !== y2 + dy) { let t = document.querySelector(`.letra-box[data-x="${cx}"][data-y="${cy}"]`); if(t) cells.push(t); if(cx === x2 && cy === y2) break; cx += dx; cy += dy; } return cells; }

window.onload = () => {
    gerarEstruturaLab(); 
    mostrarTela('tela-inicial');
    if (typeof aplicarConfiguracoes === 'function') aplicarConfiguracoes();
};
