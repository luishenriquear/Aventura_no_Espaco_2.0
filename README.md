# Aventura_no_Espaco_2.0
# 🚀 Aventura no Espaço - O Jogo

Um jogo web interativo, educativo e multiplataforma desenvolvido especialmente para celebrar o aniversário do Luís Felipe! Uma verdadeira jornada espacial projetada para divertir, desafiar e criar memórias.

## 🎯 Sobre o Projeto

O "Aventura no Espaço" não é apenas um simples site, é um ecossistema construído com lógica de jogos 2.5D. O jogador navega por um mapa interativo do sistema solar, desbloqueando fases sequenciais que exigem diferentes habilidades cognitivas. 

O projeto conta com uma página inicial de Portal inteligente, capaz de identificar se o usuário está acessando via navegador web ou via aplicativo nativo (APK), roteando a experiência perfeitamente.

## 🎮 Fases e Minigames

A aventura é composta por 5 missões principais:

* 🌍 **Terra (Labirinto):** Navegação por matriz bidimensional usando um sistema de colisão em grade (Grid Collision).
* 🔴 **Marte (Ache os Erros):** Identificação de padrões visuais através de mapeamento de coordenadas (Hitboxes).
* 🟡 **Vênus (Pintura Espacial):** Estúdio de arte em tela (Canvas API). Conta com sistema de pincel, stickers dinâmicos, controle de espessura e um algoritmo de pintura inteligente (Scanline Flood Fill) capaz de preencher limites isolados na imagem.
* 🪐 **Saturno (Jogo da Memória):** Jogo de cartas dinâmico com embaralhamento algorítmico e validação de pares.
* 🟠 **Júpiter (Caça-Palavras):** Matriz de letras gerada proceduralmente onde palavras-chave são injetadas aleatoriamente em direções matemáticas precisas.

## 🛠️ Arquitetura e Tecnologias

O jogo foi criado do zero (Vanilla), garantindo máxima performance e leveza em dispositivos móveis, sem depender de motores pesados de jogos.

* **Front-end:** HTML5, CSS3, JavaScript (ES6+).
* **Gráficos e Interação:** HTML5 Canvas API (manipulação de pixels, cálculo de Luma para detecção de bordas no modo Balde de Tinta).
* **Controle de Áudio:** Sistema resiliente a bloqueios mobile (Web Audio API).
* **Distribuição e Hospedagem:** GitHub para versionamento de código e hospedagem via Netlify/Vercel (CI/CD).
* **Aplicativo:** Integração WebView para conversão PWA/APK, com Auto-hospedagem (Self-Hosting) de pacotes no próprio repositório.

## 📱 Como Jogar

O jogo foi otimizado para a proporção de telas de celulares. Acesse de duas formas:

1. **Via Navegador (Web):** Acesse a URL do projeto e clique em "Jogar Agora".
2. **Via Aplicativo (Android):** No portal, selecione "Baixar o App" para realizar o download direto do `.apk` hospedado internamente.

---
*© 2026 Aventura no Espaço* *Desenvolvido por L.H.A.R.*
