// Teste de integração sem dependências externas: Chrome/Edge + CDP nativo do Node 24+.
// Execute na raiz: node .\projeto-dashboard\tests\test_dashboard_browser.cjs
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..', 'site');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data', 'vendas.json'), 'utf8'));
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

function createServer(requests) {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    requests.push(pathname);
    const relative = pathname.replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(file, (error, content) => {
      if (error) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(content);
    });
  });
}

async function main() {
  assert.equal(typeof WebSocket, 'function', 'Use Node.js 22+ com WebSocket nativo; não requer instalar pacotes.');
  const browserPath = findBrowser();
  assert.ok(browserPath, 'BLOQUEADO: Chrome/Edge não encontrado. Defina CHROME_PATH ou EDGE_PATH.');

  const requests = [];
  const server = createServer(requests);
  let browser;
  let socket;
  let profile;
  const pending = new Map();
  const loadWaiters = [];
  const completedLoads = [];
  const exceptions = [];
  const consoleErrors = [];
  let nextId = 0;

  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/`;
    for (const asset of ['/', '/styles.css', '/dashboard.js', '/data/vendas.json', '/favicon.svg']) {
      const response = await fetch(new URL(asset, url));
      assert.equal(response.status, 200, `HTTP ${response.status} em ${asset}`);
      assert.ok((await response.arrayBuffer()).byteLength > 0, `Arquivo vazio: ${asset}`);
      if (asset === '/favicon.svg') assert.match(response.headers.get('content-type'), /^image\/svg\+xml/i, 'Content-Type incorreto para o favicon.');
    }
    requests.length = 0;
    console.log('PASS HTTP — index, CSS, JavaScript e JSON responderam 200');
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'orbita-cdp-'));
    browser = spawn(browserPath, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-extensions', '--remote-debugging-port=0',
      `--user-data-dir=${profile}`, 'about:blank',
    ], { stdio: 'ignore', windowsHide: true });

    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let attempt = 0; attempt < 200 && !fs.existsSync(portFile); attempt++) await sleep(50);
    assert.ok(fs.existsSync(portFile), 'O navegador não iniciou a interface DevTools.');
    const port = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
    let targets;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        if (targets.some(target => target.type === 'page')) break;
      } catch {}
      await sleep(50);
    }
    const target = targets.find(item => item.type === 'page');
    assert.ok(target, 'O navegador não abriu uma página.');

    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Page.loadEventFired') {
        const resolveLoad = loadWaiters.shift();
        if (resolveLoad) resolveLoad();
        else completedLoads.push(true);
      }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
      }
      if (message.id && pending.has(message.id)) {
        const handlers = pending.get(message.id);
        pending.delete(message.id);
        message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result);
      }
    });

    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Timeout CDP: ${method}`));
        }
      }, 8000);
    });
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const nextPageLoad = () => completedLoads.length
      ? Promise.resolve(completedLoads.shift())
      : new Promise(resolve => loadWaiters.push(resolve));
    const clickSelector = async selector => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center' })`);
      const bounds = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.x, y: bounds.y });
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 });
    };
    const captureOptionalScreenshot = async name => {
      if (!process.env.ORBITA_SCREENSHOT_DIR) return;
      const result = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      fs.mkdirSync(process.env.ORBITA_SCREENSHOT_DIR, { recursive: true });
      const output = path.join(process.env.ORBITA_SCREENSHOT_DIR, name);
      fs.writeFileSync(output, Buffer.from(result.data, 'base64'));
      console.log(`SCREENSHOT ${output}`);
    };
    await command('Page.enable');
    await command('Runtime.enable');
    await command('Log.enable');
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    const initialLoad = nextPageLoad();
    await command('Page.navigate', { url });
    await initialLoad;
    const waitFor = async (expression, message) => {
      let lastValue;
      for (let attempt = 0; attempt < 160; attempt++) {
        try {
          lastValue = await evaluate(expression);
          if (lastValue) return;
        } catch (error) { lastValue = error.message; }
        await sleep(50);
      }
      throw new Error(`${message} Último resultado: ${JSON.stringify(lastValue)}`);
    };
    await waitFor("document.readyState === 'complete' && document.querySelector('#welcome-gate') && !document.querySelector('#welcome-gate').hidden", 'Gate de demonstração não carregou por HTTP.');

    const gateState = () => evaluate(`({
      welcomeHidden: document.querySelector('#welcome-gate').hidden,
      dashboardHidden: document.querySelector('#dashboard-app').hidden,
      credentials: [...document.querySelectorAll('.demo-credentials dl dd code')].map(node => node.textContent.trim()),
      credentialsImmediatelyAfterForm: document.querySelector('#demo-login-form').nextElementSibling === document.querySelector('.demo-credentials'),
      faviconHref: document.querySelector('link[rel~="icon"]')?.getAttribute('href'),
      feedback: document.querySelector('#login-feedback').textContent.trim(),
      email: document.querySelector('#login-email').value,
      password: document.querySelector('#login-password').value,
      session: Array.from({ length: sessionStorage.length }, (_, i) => [sessionStorage.key(i), sessionStorage.getItem(sessionStorage.key(i))]),
      localStorageLength: localStorage.length,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      welcomeAnimation: getComputedStyle(document.querySelector('.welcome-copy')).animationDuration,
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth
    })`);
    let gate = await gateState();
    assert.equal(gate.welcomeHidden, false);
    assert.equal(gate.dashboardHidden, true, 'O dashboard apareceu antes do acesso.');
    assert.deepEqual(gate.credentials, ['demo@orbita.com', 'orbita2026'], 'Credenciais demonstrativas visíveis não correspondem aos valores documentados.');
    assert.equal(gate.credentialsImmediatelyAfterForm, true, 'Credenciais não estão imediatamente abaixo do formulário.');
    assert.equal(gate.faviconHref, './favicon.svg', 'Favicon SVG não está declarado no HTML.');
    assert.equal(gate.reducedMotion, false, 'Chrome deveria iniciar em movimento normal.');
    assert.ok(parseFloat(gate.welcomeAnimation) > 0.01, `Animação normal do gate não está ativa: ${gate.welcomeAnimation}`);
    assert.equal(gate.viewport, 1440);
    assert.ok(gate.documentWidth <= gate.viewport, 'Gate apresenta overflow horizontal desktop.');
    assert.equal(requests.filter(pathname => pathname === '/data/vendas.json').length, 0, 'Dados requisitados antes do login.');
    const browserFavicon = await evaluate(`(async () => {
      const response = await fetch('./favicon.svg');
      const source = await response.text();
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      return { status: response.status, type: response.headers.get('content-type'), root: parsed.documentElement.localName, parseError: Boolean(parsed.querySelector('parsererror')), hasBrand: parsed.querySelectorAll('circle, text').length >= 2 };
    })()`);
    assert.equal(browserFavicon.status, 200);
    assert.match(browserFavicon.type, /^image\/svg\+xml/i);
    assert.equal(browserFavicon.root, 'svg');
    assert.equal(browserFavicon.parseError, false, 'Favicon SVG inválido.');
    assert.equal(browserFavicon.hasBrand, true, 'Favicon sem marca vetorial esperada.');
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const gateMobile = await evaluate('({ viewport: innerWidth, document: document.documentElement.scrollWidth })');
    assert.equal(gateMobile.viewport, 390);
    assert.ok(gateMobile.document <= gateMobile.viewport, 'Gate apresenta overflow horizontal mobile.');
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    gate = await gateState();
    assert.equal(gate.reducedMotion, true);
    assert.ok(parseFloat(gate.welcomeAnimation) <= 0.001, `Animação do gate não reduziu: ${gate.welcomeAnimation}`);
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await waitFor("!matchMedia('(prefers-reduced-motion: reduce)').matches", 'Não foi possível reativar a preferência normal de movimento.');
    console.log('PASS browser — gate, credenciais, favicon SVG/HTTP, viewports e movimento normal/reduzido');

    const submitForm = (email, password) => evaluate(`(() => {
      document.querySelector('#login-email').value = ${JSON.stringify(email)};
      document.querySelector('#login-password').value = ${JSON.stringify(password)};
      document.querySelector('#demo-login-form').requestSubmit();
    })()`);
    const fillLogin = (email, password) => evaluate(`(() => {
      document.querySelector('#login-email').value = ${JSON.stringify(email)};
      document.querySelector('#login-password').value = ${JSON.stringify(password)};
    })()`);
    await submitForm('', '');
    gate = await gateState();
    assert.equal(gate.welcomeHidden, false, 'Formulário vazio liberou o dashboard.');
    assert.match(gate.feedback, /e-mail válido e uma senha não vazia/i, 'Validação vazia não informou o problema.');
    assert.deepEqual(gate.session, [], 'Formulário vazio gravou uma sessão.');
    await submitForm('email-invalido', 'senha-qualquer');
    gate = await gateState();
    assert.equal(gate.welcomeHidden, false, 'E-mail inválido liberou o dashboard.');
    assert.match(gate.feedback, /e-mail válido e uma senha não vazia/i);
    assert.deepEqual(gate.session, [], 'E-mail inválido gravou uma sessão.');
    await submitForm('valido@exemplo.com', '');
    gate = await gateState();
    assert.equal(gate.welcomeHidden, false, 'Senha vazia liberou o dashboard.');
    assert.deepEqual(gate.session, [], 'Senha vazia gravou uma sessão.');
    assert.equal(requests.filter(pathname => pathname === '/data/vendas.json').length, 0, 'Dados requisitados após tentativa inválida.');
    console.log('PASS browser — formulário vazio, e-mail inválido e senha vazia são recusados sem sessão');

    const credentials = { email: gate.credentials[0], password: gate.credentials[1] };
    assert.equal(credentials.email, 'demo@orbita.com');
    assert.equal(credentials.password, 'orbita2026');
    await fillLogin(credentials.email, credentials.password);
    await clickSelector('#demo-login-form button[type="submit"]');
    await waitFor("!document.querySelector('#dashboard-app').hidden && document.querySelector('#sale-count')?.textContent.trim() !== '—'", 'Dashboard/dados não carregaram após o login demonstrativo.');
    let auth = await evaluate(`({
      session: Array.from({ length: sessionStorage.length }, (_, i) => [sessionStorage.key(i), sessionStorage.getItem(sessionStorage.key(i))]),
      localStorageLength: localStorage.length,
      email: document.querySelector('#login-email').value,
      password: document.querySelector('#login-password').value,
      welcomeHidden: document.querySelector('#welcome-gate').hidden,
      dashboardHidden: document.querySelector('#dashboard-app').hidden
    })`);
    assert.deepEqual(auth.session, [['orbita-demo-access', '1']], 'SessionStorage contém mais que o marcador demonstrativo.');
    assert.equal(auth.localStorageLength, 0, 'Credencial ou marcador foi persistido em localStorage.');
    assert.equal(auth.email, credentials.email);
    assert.equal(auth.password, '', 'Senha ficou retida após login.');
    assert.equal(auth.welcomeHidden, true);
    assert.equal(auth.dashboardHidden, false);
    await waitFor("document.querySelector('#total-value')?.textContent.trim() !== '—'", 'Indicadores não carregaram após login.');
    assert.equal(requests.filter(pathname => pathname === '/data/vendas.json').length, 1, 'JSON não foi requisitado exatamente após login.');
    console.log('PASS browser — credenciais exibidas permitem entrar; só o marcador fica em sessionStorage');
    const cinematicLinks = await evaluate(`(() => ({
      sections: [...document.querySelectorAll('.chapter-links a')].map(link => ({ href: link.getAttribute('href'), exists: Boolean(document.querySelector(link.getAttribute('href'))) })),
      contacts: [...document.querySelectorAll('.connect-link')].map(link => ({ href: link.href, target: link.target, rel: link.rel, title: link.querySelector('strong')?.textContent.trim() })),
      contactHeading: document.querySelector('#connect-title').textContent.replace(/\\s+/g, ' ').trim(),
      contactDescription: document.querySelector('.connect-intro > p:last-child').textContent.trim(),
      contactBeforeFooter: document.querySelector('.connect-section').compareDocumentPosition(document.querySelector('.dashboard-footer')) & Node.DOCUMENT_POSITION_FOLLOWING
    }))()`);
    assert.deepEqual(cinematicLinks.sections.map(item => item.href), ['#explore', '#compare', '#detail']);
    assert.ok(cinematicLinks.sections.every(item => item.exists), 'Um capítulo de navegação não aponta para uma seção existente.');
    assert.deepEqual(cinematicLinks.contacts.map(item => item.href), [
      'https://github.com/Pietro-Olimpio',
      'https://www.linkedin.com/in/pietro-correa',
      'https://wa.me/551999572812',
    ]);
    assert.ok(cinematicLinks.contacts.every(item => item.target === '_blank' && item.rel.includes('noopener')));
    assert.deepEqual(cinematicLinks.contacts.map(item => item.title), ['Meu GitHub', 'Meu LinkedIn', 'Meu número para contato']);
    assert.equal(cinematicLinks.contactHeading, 'O seu próximo projeto pode começar aqui.');
    assert.equal(cinematicLinks.contactDescription, 'Quer conhecer meu trabalho ou conversar sobre uma oportunidade? Estou disponível para trocar ideias.');
    assert.equal(cinematicLinks.contactBeforeFooter, 4, 'Bloco de contatos precisa anteceder o rodapé.');
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await waitFor("document.querySelector('.chapter-links a[href=\\\"#detail\\\"]')?.getAttribute('aria-current') === 'location'", 'Rolagem não ativou o capítulo Detalhar.');
    const progressAtEnd = await evaluate("document.querySelector('.scroll-progress__bar').style.transform");
    assert.notEqual(progressAtEnd, 'scaleX(0)', 'A barra de progresso não acompanhou a rolagem.');
    await evaluate('window.scrollTo(0, 0)');
    await waitFor("document.querySelector('.chapter-links a[href=\\\"#explore\\\"]')?.getAttribute('aria-current') === 'location'", 'Retorno ao topo não reativou Explorar.');
    console.log('PASS browser — navegação narrativa/scroll progress e links sociais seguros');

    const loggedInReload = nextPageLoad();
    await command('Page.reload', { ignoreCache: true });
    await loggedInReload;
    await waitFor("document.readyState === 'complete' && !document.querySelector('#dashboard-app').hidden && document.querySelector('#sale-count')?.textContent.trim() !== '—'", 'Refresh não restaurou a sessão demonstrativa.');
    auth = await evaluate(`({ marker: sessionStorage.getItem('orbita-demo-access'), sessionLength: sessionStorage.length, email: document.querySelector('#login-email').value, password: document.querySelector('#login-password').value })`);
    assert.equal(auth.marker, '1');
    assert.equal(auth.sessionLength, 1);
    assert.equal(auth.email, '', 'Refresh restaurou e-mail sem persistência demonstrada.');
    assert.equal(auth.password, '', 'Refresh persistiu a senha no formulário.');
    await clickSelector('#logout-button');
    gate = await gateState();
    assert.equal(gate.welcomeHidden, false, 'Logout não retornou ao gate.');
    assert.equal(gate.dashboardHidden, true);
    assert.deepEqual(gate.session, [], 'Logout não apagou o marcador.');
    assert.equal(gate.email, '', 'Logout não limpou o e-mail.');
    assert.equal(gate.password, '', 'Logout não limpou a senha.');
    const dataRequestsAtLogout = requests.filter(pathname => pathname === '/data/vendas.json').length;
    const loggedOutReload = nextPageLoad();
    await command('Page.reload', { ignoreCache: true });
    await loggedOutReload;
    await waitFor("document.readyState === 'complete' && !document.querySelector('#welcome-gate').hidden", 'Refresh após logout não manteve o gate.');
    gate = await gateState();
    assert.deepEqual(gate.session, [], 'Refresh após logout restaurou a sessão.');
    assert.equal(requests.filter(pathname => pathname === '/data/vendas.json').length, dataRequestsAtLogout, 'Dados foram requisitados sem sessão após logout.');
    console.log('PASS browser — refresh restaura sessão; logout remove marcador e refresh volta ao gate');

    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 620, deviceScaleFactor: 1, mobile: false });
    await fillLogin(credentials.email, credentials.password);
    await clickSelector('#demo-login-form button[type="submit"]');
    await waitFor("!document.querySelector('#dashboard-app').hidden && document.querySelector('#sale-count')?.textContent.trim() !== '—'", 'Não foi possível reentrar para validar o dashboard.');
    await waitFor("document.querySelector('#total-value')?.textContent.trim() !== '—'", 'Indicadores não carregaram após a segunda entrada.');

    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 620, deviceScaleFactor: 1, mobile: false });
    await evaluate('window.scrollTo(0, 0)');
    await sleep(100);
    const normalMotion = await evaluate(`({
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      ready: document.querySelector('#dashboard-app').classList.contains('motion-ready'),
      tableRevealed: document.querySelector('.table-panel').classList.contains('is-revealed'),
      barAnimation: getComputedStyle(document.querySelector('#category-chart .bar')).animationDuration
    })`);
    assert.equal(normalMotion.reduced, false, 'Dashboard deveria estar em movimento normal.');
    assert.equal(normalMotion.ready, true, 'Reveals não foram ativados em movimento normal.');
    assert.equal(normalMotion.tableRevealed, false, 'Reveals não aguardaram o detalhamento fora da tela.');
    assert.ok(parseFloat(normalMotion.barAnimation) >= 0.1, `Animação normal das barras não está ativa: ${normalMotion.barAnimation}`);
    await evaluate("document.querySelector('.table-panel').scrollIntoView({ block: 'center' })");
    await waitFor("document.querySelector('.table-panel').classList.contains('is-revealed')", 'IntersectionObserver não revelou o detalhamento ao entrar na tela.');
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate('window.scrollTo(0, 0)');
    const heroBox = await evaluate(`(() => { const r = document.querySelector('.hero').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
    const pointerX = heroBox.x + heroBox.width * 0.28;
    const pointerY = heroBox.y + heroBox.height * 0.31;
    const lightBefore = await evaluate("getComputedStyle(document.querySelector('.hero')).getPropertyValue('--light-x').trim()");
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pointerX, y: pointerY });
    await waitFor("document.querySelector('.hero').style.getPropertyValue('--light-x') !== ''", 'Movimento do ponteiro não atualizou a luz no modo normal.');
    const normalPointer = await evaluate(`({
      light: document.querySelector('.hero').style.getPropertyValue('--light-x'),
      orbitX: document.querySelector('.hero').style.getPropertyValue('--orbit-x')
    })`);
    assert.notEqual(normalPointer.light, lightBefore, 'Parallax/luz não respondeu no modo normal.');
    assert.notEqual(normalPointer.orbitX, '0px', 'Órbita não respondeu no modo normal.');

    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await waitFor("matchMedia('(prefers-reduced-motion: reduce)').matches && !document.querySelector('#dashboard-app').classList.contains('motion-ready') && [...document.querySelectorAll('[data-reveal]')].every(node => node.classList.contains('is-revealed'))", 'Modo reduzido não desligou reveals nem revelou o conteúdo.');    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await waitFor("document.querySelector('.chapter-links a:last-child')?.getAttribute('aria-current') === 'location'", 'Navegação por seção não atualiza no modo de movimento reduzido.');
    const reducedScrollState = await evaluate("({ progress: document.querySelector('.scroll-progress__bar').style.transform, active: document.querySelector('.chapter-links a[aria-current=location]')?.getAttribute('href') })");
    assert.equal(reducedScrollState.progress, 'scaleX(0)', 'Progresso visual deve ser desativado com movimento reduzido.');
    assert.equal(reducedScrollState.active, '#detail');
    await evaluate('window.scrollTo(0, 0)');
    await waitFor("document.querySelector('.chapter-links a:first-child')?.getAttribute('aria-current') === 'location'", 'Volta ao primeiro capítulo falhou em movimento reduzido.');
    const reducedMotionDashboard = await evaluate(`({
      animation: getComputedStyle(document.querySelector('#category-chart .bar')).animationDuration,
      transition: getComputedStyle(document.querySelector('.kpi-card')).transitionDuration,
      light: document.querySelector('.hero').style.getPropertyValue('--light-x'),
      allRevealed: [...document.querySelectorAll('[data-reveal]')].every(node => node.classList.contains('is-revealed'))
    })`);
    assert.ok(parseFloat(reducedMotionDashboard.animation) <= 0.001);
    assert.ok(parseFloat(reducedMotionDashboard.transition) <= 0.001);
    assert.equal(reducedMotionDashboard.allRevealed, true);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pointerX + 15, y: pointerY + 15 });
    await sleep(50);
    assert.equal(await evaluate("document.querySelector('.hero').style.getPropertyValue('--light-x')"), reducedMotionDashboard.light, 'Parallax continuou ativo em movimento reduzido.');
    console.log('PASS browser — movimento normal (reveal/parallax) e reduzido (reveal visível, animação/parallax minimizados)');

    const currency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const grouped = (field, selectedRows = rows) => {
      const totals = new Map();
      for (const row of selectedRows) totals.set(row[field], (totals.get(row[field]) || 0) + Number(row.valor_venda));
      return totals;
    };
    const summarize = selected => ({
      count: selected.length,
      total: selected.reduce((sum, row) => sum + Number(row.valor_venda), 0),
      rows: selected,
      table: [...selected]
        .sort((a, b) => b.data.localeCompare(a.data) || a.id_venda.localeCompare(b.id_venda))
        .map(row => [
          row.id_venda,
          new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${row.data}T00:00:00Z`)),
          row.produto,
          row.categoria,
          row.cidade,
          new Intl.NumberFormat('pt-BR').format(row.quantidade),
          currency(row.valor_venda),
        ]),
    });
    const filtered = predicate => summarize(rows.filter(predicate));
    const normalizeForOracle = value => String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00a0/g, ' ')
      .toLocaleLowerCase('pt-BR')
      .trim();
    const independentlyMatchesSearch = (row, query) => {
      const terms = normalizeForOracle(query).split(/\s+/).filter(Boolean);
      const fields = [
        row.id_venda,
        row.data,
        new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${row.data}T00:00:00Z`)),
        row.produto,
        row.categoria,
        row.cidade,
        row.quantidade,
        new Intl.NumberFormat('pt-BR').format(row.quantidade),
        currency(row.valor_venda),
        Number(row.valor_venda).toFixed(2).replace('.', ','),
        String(row.valor_venda),
      ].map(normalizeForOracle);
      return terms.every(term => fields.some(field => field.includes(term)));
    };
    const searchSummary = (query, categoryValue = '', cityValue = '') => summarize(rows.filter(row =>
      (!categoryValue || row.categoria === categoryValue)
      && (!cityValue || row.cidade === cityValue)
      && independentlyMatchesSearch(row, query)));
    const expectedBars = (field, selectedRows) => [...grouped(field, selectedRows)]
      .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
      .map(([name, total]) => `${name}: ${currency(total)}`);
    const totalSummary = summarize(rows);
    const emptySummary = summarize([]);
    const visualIssues = new Set();
    const assertNoHorizontalOverflow = async (label) => {
      const dimensions = await evaluate('({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })');
      if (dimensions.document > dimensions.viewport) visualIssues.add(`${label}: overflow horizontal ${dimensions.document}px > ${dimensions.viewport}px`);
      return dimensions;
    };
    const assertChartReadability = (actual, expectedRows, label) => {
      for (const chart of actual.chartLayout) {
        if (chart.ticks.length !== 5) visualIssues.add(`${label}: eixo ${chart.id} tem ${chart.ticks.length}, esperado 5 ticks.`);
        if (!chart.ticks.every(tick => tick.startsWith('R$'))) visualIssues.add(`${label}: tick sem unidade BRL em ${chart.id}: ${chart.ticks.join(' | ')}`);
        if (!chart.values.every(value => value.startsWith('R$'))) visualIssues.add(`${label}: valor de barra sem BRL em ${chart.id}`);
        if (!chart.fontSizes.every(size => size >= 8)) visualIssues.add(`${label}: rótulo menor que 8px em ${chart.id}`);
        if (!chart.bounds.every(box => box.x >= -1 && box.right <= chart.viewWidth + 1 && box.y >= -1 && box.bottom <= 221)) visualIssues.add(`${label}: rótulo/tick cortado fora do SVG ${chart.id}`);
        const field = chart.id === 'category-chart' ? 'categoria' : 'cidade';
        const expectedGroups = [...grouped(field, expectedRows)].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
        const exactLabels = expectedGroups.map(([, total]) => currency(total));
        if (JSON.stringify(chart.values) !== JSON.stringify(exactLabels)) {
          visualIssues.add(`${label}: totais visíveis em ${chart.id} estão arredondados/abreviados (${chart.names.map((name, index) => `${name}=${chart.values[index]}`).join('; ')}); esperados exatos: ${expectedGroups.map(([name, total]) => `${name}=${currency(total)}`).join('; ')}`);
        }
        chart.valueDetails.forEach((detail, index) => {
          const exactText = exactLabels[index];
          if (detail.text !== exactText) visualIssues.add(`${label}: textContent .bar-value ${chart.id}[${index}] não preserva o valor BRL exato.`);
          if (detail.box.bottom > detail.barY + 1) visualIssues.add(`${label}: rótulo .bar-value cruza/sobrepõe a barra ${chart.id}[${index}].`);
          if (detail.stacked) {
            if (detail.tspans.length !== 2) {
              visualIssues.add(`${label}: rótulo empilhado sem exatamente dois tspan em ${chart.id}[${index}].`);
              return;
            }
            const match = exactText.match(/^(R\$\s*)(.*)$/u);
            const [currencyLine, amountLine] = detail.tspans;
            if (!match || currencyLine.text !== match[1] || amountLine.text !== match[2]) visualIssues.add(`${label}: tspan alterou prefixo/valor de ${chart.id}[${index}].`);
            if (currencyLine.x === null || amountLine.x === null || Math.abs(currencyLine.x - detail.x) > 0.5 || Math.abs(amountLine.x - detail.x) > 0.5) visualIssues.add(`${label}: tspan não compartilham o centro do valor em ${chart.id}[${index}].`);
            if (currencyLine.box.bottom > amountLine.box.y + 0.5 || amountLine.dy !== 10) visualIssues.add(`${label}: linhas tspan sobrepostas ou com dy inesperado em ${chart.id}[${index}].`);
            for (const span of detail.tspans) {
              if (span.box.x < -1 || span.box.right > chart.viewWidth + 1 || span.box.y < -1 || span.box.bottom > 221) visualIssues.add(`${label}: tspan cortado fora do SVG ${chart.id}[${index}].`);
              if (Math.abs((span.box.x + span.box.right) / 2 - detail.x) > 1) visualIssues.add(`${label}: tspan desalinhado visualmente em ${chart.id}[${index}].`);
            }
          } else if (detail.tspans.length !== 0) {
            visualIssues.add(`${label}: rótulo largo tem tspan inesperado em ${chart.id}[${index}].`);
          }
        });
        for (let i = 0; i < chart.textBoxes.length; i++) for (let j = i + 1; j < chart.textBoxes.length; j++) {
          const first = chart.textBoxes[i];
          const second = chart.textBoxes[j];
          const overlapX = Math.min(first.right, second.right) - Math.max(first.x, second.x);
          const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.y, second.y);
          if (overlapX > 2 && overlapY > 2) visualIssues.add(`${label}: textos SVG sobrepostos em ${chart.id} (${first.className} “${first.text}” / ${second.className} “${second.text}”).`);
        }
      }
    };
    const state = () => evaluate(`({
      total: document.querySelector('#total-value').textContent,
      count: document.querySelector('#sale-count').textContent,
      average: document.querySelector('#average-value').textContent,
      bodyRows: document.querySelectorAll('#sales-body tr').length,
      tableCount: document.querySelector('#table-count').textContent.trim(),
      empty: !document.querySelector('#empty-state').hidden,
      category: document.querySelector('#category-filter').value,
      city: document.querySelector('#city-filter').value,
      search: document.querySelector('#sales-search').value,
      categoryBars: [...document.querySelectorAll('#category-chart .bar')].map(bar => bar.querySelector('title')?.textContent),
      cityBars: [...document.querySelectorAll('#city-chart .bar')].map(bar => bar.querySelector('title')?.textContent),
      categoryAria: [...document.querySelectorAll('#category-chart .bar')].map(bar => bar.getAttribute('aria-label')),
      cityAria: [...document.querySelectorAll('#city-chart .bar')].map(bar => bar.getAttribute('aria-label')),
      chartLayout: ['category-chart', 'city-chart'].map(id => {
        const container = document.getElementById(id);
        const svg = container.querySelector('svg');
        if (!svg) return { id, viewWidth: 0, ticks: [], names: [], values: [], bounds: [], fontSizes: [], valueDetails: [], textBoxes: [] };
        const texts = [...svg.querySelectorAll('.chart-axis, .bar-value, .bar-label')];
        const valueNodes = [...svg.querySelectorAll('.bar-value')];
        const barNodes = [...svg.querySelectorAll('.bar')];
        return {
          id,
          viewWidth: svg.viewBox.baseVal.width,
          ticks: [...svg.querySelectorAll('.chart-axis')].map(node => node.textContent.trim()),
          names: [...svg.querySelectorAll('.bar-label')].map(node => node.textContent.trim()),
          values: valueNodes.map(node => node.textContent.trim()),
          bounds: texts.map(node => { const box = node.getBBox(); return { x: box.x, right: box.x + box.width, y: box.y, bottom: box.y + box.height }; }),
          fontSizes: texts.map(node => parseFloat(getComputedStyle(node).fontSize)),
          valueDetails: valueNodes.map((node, index) => {
            const box = node.getBBox();
            const barBox = barNodes[index].getBBox();
            return {
              text: node.textContent,
              stacked: node.classList.contains('bar-value-stacked'),
              x: Number(node.getAttribute('x')),
              box: { x: box.x, right: box.x + box.width, y: box.y, bottom: box.y + box.height },
              barY: barBox.y,
              tspans: [...node.querySelectorAll('tspan')].map(span => {
                const spanBox = span.getBBox();
                return {
                  text: span.textContent,
                  x: span.getAttribute('x') === null ? null : Number(span.getAttribute('x')),
                  dy: span.getAttribute('dy') === null ? null : Number(span.getAttribute('dy')),
                  box: { x: spanBox.x, right: spanBox.x + spanBox.width, y: spanBox.y, bottom: spanBox.y + spanBox.height }
                };
              })
            };
          }),
          textBoxes: texts.map(node => {
            const box = node.getBBox();
            return { className: node.classList[0], text: node.textContent.trim(), x: box.x, right: box.x + box.width, y: box.y, bottom: box.y + box.height };
          })
        };
      }),
      table: [...document.querySelectorAll('#sales-body tr')].map(tr => [...tr.cells].map(cell => cell.textContent)),
      chartEmpty: [...document.querySelectorAll('.chart-empty')].map(node => node.textContent.trim()),
      text: document.body.innerText
    })`);
    const checkState = (actual, expected, label) => {
      assert.equal(actual.count, new Intl.NumberFormat('pt-BR').format(expected.count), `${label}: quantidade`);
      assert.equal(actual.total, currency(expected.total), `${label}: total`);
      assert.equal(actual.average, currency(expected.count ? expected.total / expected.count : 0), `${label}: ticket médio`);
      assert.equal(actual.bodyRows, expected.count, `${label}: linhas da tabela`);
      assert.equal(actual.tableCount, `${new Intl.NumberFormat('pt-BR').format(expected.count)} ${expected.count === 1 ? 'venda' : 'vendas'}`, `${label}: contagem do detalhamento`);
      assert.equal(actual.empty, expected.count === 0, `${label}: estado vazio`);
      assert.doesNotMatch(actual.text, /NaN|Infinity/, `${label}: valor não finito na tela`);
      assert.deepEqual(actual.table, expected.table, `${label}: valores da tabela`);
      for (const [field, titles, aria] of [
        ['categoria', actual.categoryBars, actual.categoryAria],
        ['cidade', actual.cityBars, actual.cityAria],
      ]) {
        const expectedGroups = [...grouped(field, expected.rows)].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
        assert.deepEqual(titles, expectedBars(field, expected.rows), `${label}: barras de ${field}`);
        assert.equal(aria.length, expectedGroups.length, `${label}: quantidade de rótulos acessíveis (${field})`);
        expectedGroups.forEach(([name, total], index) => assert.ok(aria[index].startsWith(`${name}: ${currency(total)}.`), `${label}: total exato no rótulo acessível (${name})`));
      }
      assert.deepEqual(actual.chartEmpty, expected.count === 0 ? ['Sem dados para exibir.', 'Sem dados para exibir.'] : [], `${label}: estado vazio dos gráficos`);
      if (expected.count) assertChartReadability(actual, expected.rows, label);
    };
    const setFilters = (categoryValue, cityValue) => evaluate(`(() => {
      const category = document.querySelector('#category-filter');
      const city = document.querySelector('#city-filter');
      category.value = ${JSON.stringify(categoryValue)};
      city.value = ${JSON.stringify(cityValue)};
      category.dispatchEvent(new Event('change', { bubbles: true }));
      city.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    const setSearch = value => evaluate(`(() => {
      const input = document.querySelector('#sales-search');
      input.value = ${JSON.stringify(value)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);

    let actual = await state();
    checkState(actual, totalSummary, 'Inicial');
    assert.equal(actual.bodyRows, 180);
    console.log('PASS browser — carga HTTP, 3 KPIs, tabela e totais de barras comparados independentemente');

    const categories = [...new Set(rows.map(row => row.categoria))];
    const cities = [...new Set(rows.map(row => row.cidade))];
    const category = categories[0];
    const city = cities[0];
    const categoryExpected = filtered(row => row.categoria === category);
    await setFilters(category, '');
    actual = await state();
    checkState(actual, categoryExpected, 'Filtro categoria isolado');
    assert.equal(actual.category, category);
    assert.equal(actual.categoryBars.length, 1);
    console.log('PASS browser — filtro isolado de categoria sincroniza indicadores, gráfico e tabela');

    const cityExpected = filtered(row => row.cidade === city);
    await setFilters('', city);
    actual = await state();
    checkState(actual, cityExpected, 'Filtro cidade isolado');
    assert.equal(actual.city, city);
    assert.equal(actual.cityBars.length, 1);
    console.log('PASS browser — filtro isolado de cidade sincroniza indicadores, gráfico e tabela');

    const pairs = [];
    for (const categoryValue of categories) for (const cityValue of cities) {
      const result = filtered(row => row.categoria === categoryValue && row.cidade === cityValue);
      pairs.push({ category: categoryValue, city: cityValue, ...result });
    }
    const combination = pairs.find(pair => pair.count > 0);
    assert.ok(combination);
    await setFilters(combination.category, combination.city);
    actual = await state();
    checkState(actual, combination, 'Filtros combinados');
    assert.equal(actual.category, combination.category);
    assert.equal(actual.city, combination.city);
    console.log('PASS browser — filtros combinados atualizam o painel inteiro');

    // Todas as 3×3 combinações categoria/cidade existem nesta amostra. Adiciona-se uma
    // opção sintética apenas para cobrir o estado vazio não selecionável nos dados reais.
    const emptyCombination = pairs.find(pair => pair.count === 0);
    if (emptyCombination) {
      await setFilters(emptyCombination.category, emptyCombination.city);
    } else {
      await evaluate(`(() => {
        const select = document.querySelector('#category-filter');
        const option = new Option('__tester_sem_resultado__', '__tester_sem_resultado__');
        select.add(option);
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
    }
    actual = await state();
    checkState(actual, emptySummary, 'Sem resultados');
    assert.match(actual.text, /Nenhuma venda encontrada/);
    assert.match(actual.text, /Sem dados para exibir/);
    console.log(`PASS browser — estado vazio (${emptyCombination ? 'combinação real sem registros' : 'opção sintética; todas as combinações reais estão preenchidas'})`);

    await evaluate("document.querySelector('#empty-clear').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Limpar no estado vazio');
    assert.equal(actual.category, '');
    assert.equal(actual.city, '');
    await setFilters(category, city);
    await evaluate("document.querySelector('#clear-filters').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Botão limpar filtros');
    assert.equal(actual.category, '');
    assert.equal(actual.city, '');
    console.log('PASS browser — botões Limpar filtros e Limpar do estado vazio');

    const firstRow = rows[0];
    const accentRow = rows.find(row => row.categoria === 'Acessórios');
    assert.ok(accentRow, 'Não há exemplo de categoria acentuada para o teste.');
    const localizedFirstDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${firstRow.data}T00:00:00Z`));
    const searchCases = [
      { label: 'ID', query: firstRow.id_venda, target: firstRow },
      { label: 'data ISO', query: firstRow.data, target: firstRow },
      { label: 'data localizada', query: localizedFirstDate, target: firstRow },
      { label: 'produto/case', query: firstRow.produto.toLocaleLowerCase('pt-BR'), target: firstRow },
      { label: 'categoria sem acento/maiúscula', query: 'ACESSORIOS', target: accentRow },
      { label: 'cidade/case', query: firstRow.cidade.toLocaleUpperCase('pt-BR'), target: firstRow },
      { label: 'quantidade', query: String(firstRow.quantidade), target: firstRow },
      { label: 'valor decimal', query: Number(firstRow.valor_venda).toFixed(2).replace('.', ','), target: firstRow },
      { label: 'valor BRL', query: currency(firstRow.valor_venda), target: firstRow },
    ];
    for (const testCase of searchCases) {
      await setFilters('', '');
      await setSearch(testCase.query);
      const expectedSearch = searchSummary(testCase.query);
      assert.ok(expectedSearch.count > 0, `Caso de busca sem resultados no oráculo: ${testCase.label}`);
      actual = await state();
      checkState(actual, expectedSearch, `Busca por ${testCase.label}`);
      assert.equal(actual.search, testCase.query, `Campo de busca alterado (${testCase.label}).`);
      assert.ok(expectedSearch.rows.some(row => row.id_venda === testCase.target.id_venda), `Consulta não encontra o registro de referência (${testCase.label}).`);
    }
    await setSearch('');
    actual = await state();
    checkState(actual, totalSummary, 'Limpar texto da busca');
    console.log('PASS browser — busca por ID, datas ISO/local, produto, categoria acentuada/case, cidade, quantidade e valor');

    const combinedSearchRow = rows.find(row => row.categoria === 'Acessórios' && row.cidade === 'Santos');
    assert.ok(combinedSearchRow, 'Sem exemplo para combinar busca e filtros.');
    const combinedQuery = 'ACESSORIOS santos';
    await setFilters(combinedSearchRow.categoria, combinedSearchRow.cidade);
    await setSearch(combinedQuery);
    let combinedSearchExpected = searchSummary(combinedQuery, combinedSearchRow.categoria, combinedSearchRow.cidade);
    actual = await state();
    checkState(actual, combinedSearchExpected, 'Busca + categoria + cidade');
    assert.equal(actual.category, combinedSearchRow.categoria);
    assert.equal(actual.city, combinedSearchRow.cidade);
    assert.equal(actual.search, combinedQuery);
    assert.ok(combinedSearchExpected.rows.some(row => row.id_venda === combinedSearchRow.id_venda));

    await clickSelector('#category-chart .bar');
    combinedSearchExpected = searchSummary(combinedQuery, '', combinedSearchRow.cidade);
    actual = await state();
    checkState(actual, combinedSearchExpected, 'Busca + cidade + barra categoria');
    assert.equal(actual.category, '', 'Clique na barra não alternou o select de categoria.');
    assert.equal(actual.city, combinedSearchRow.cidade);
    assert.equal(actual.search, combinedQuery, 'Clique na barra descartou a busca.');
    await clickSelector('#category-chart .bar');
    combinedSearchExpected = searchSummary(combinedQuery, combinedSearchRow.categoria, combinedSearchRow.cidade);
    actual = await state();
    checkState(actual, combinedSearchExpected, 'Busca + filtros após reativar barra');
    await clickSelector('#city-chart .bar');
    combinedSearchExpected = searchSummary(combinedQuery, combinedSearchRow.categoria, '');
    actual = await state();
    checkState(actual, combinedSearchExpected, 'Busca + categoria + barra cidade');
    assert.equal(actual.city, '', 'Clique na barra não alternou o select de cidade.');
    assert.equal(actual.search, combinedQuery, 'Barra de cidade descartou a busca.');
    await clickSelector('#city-chart .bar');
    combinedSearchExpected = searchSummary(combinedQuery, combinedSearchRow.categoria, combinedSearchRow.cidade);
    actual = await state();
    checkState(actual, combinedSearchExpected, 'Busca + filtros após reativar barra cidade');
    console.log('PASS browser — busca combinada com categoria/cidade, barras e sincronização integral');

    await evaluate("document.querySelector('#clear-filters').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Limpar busca e filtros combinados');
    assert.equal(actual.search, '', 'Limpar filtros não zerou o detalhamento.');
    assert.equal(actual.category, '');
    assert.equal(actual.city, '');
    await setSearch('__sem_resultado_rodada_05__');
    actual = await state();
    checkState(actual, emptySummary, 'Busca sem resultados');
    assert.equal(actual.search, '__sem_resultado_rodada_05__');
    assert.match(actual.text, /Nenhuma venda encontrada/);
    await evaluate("document.querySelector('#empty-clear').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Limpar busca no vazio');
    assert.equal(actual.search, '', 'Ação de limpar estado vazio não apagou a busca.');
    assert.equal(actual.category, '');
    assert.equal(actual.city, '');
    console.log('PASS browser — limpar zera busca e selects; busca vazia mostra estado vazio e limpa');

    const keyboardCategory = categories[1];
    await evaluate(`[...document.querySelectorAll('#category-chart .bar')].find(item => item.getAttribute('aria-label').startsWith(${JSON.stringify(`${keyboardCategory}:`)})).focus()`);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    actual = await state();
    assert.equal(actual.category, keyboardCategory, 'Enter não ativou a barra');
    assert.ok(await evaluate("document.querySelector('#category-chart .bar[aria-pressed=\"true\"]') !== null"));
    await evaluate("document.querySelector('#category-chart .bar[aria-pressed=\"true\"]').focus()");
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    actual = await state();
    assert.equal(actual.category, '', 'Espaço não removeu o filtro ativo');
    await clickSelector('#category-chart .bar');
    actual = await state();
    assert.ok(actual.category, 'Clique não ativou filtro do gráfico');
    await clickSelector('#category-chart .bar[aria-pressed="true"]');
    actual = await state();
    assert.equal(actual.category, '', 'Segundo clique não removeu filtro');
    console.log('PASS browser — barras por clique/Enter/Espaço, aria-pressed e alternância');

    const firstCategoryOption = await evaluate("document.querySelector('#category-filter').options[1].value");
    await evaluate("document.querySelector('#category-filter').focus()");
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    actual = await state();
    assert.equal(actual.category, firstCategoryOption, 'Seta para baixo não altera o filtro nativo');
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    assert.equal(await evaluate('document.activeElement.id'), 'city-filter', 'Tab não move o foco ao próximo filtro');
    console.log('PASS browser — filtros nativos operáveis por seta e ordem de foco por Tab');

    const barMotion = await evaluate(`({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, animation: getComputedStyle(document.querySelector('#category-chart .bar')).animationDuration, transition: getComputedStyle(document.querySelector('.kpi-card')).transitionDuration })`);
    assert.equal(barMotion.reduce, true);
    assert.ok(parseFloat(barMotion.animation) <= 0.001, `Animação das barras não respeita movimento reduzido: ${barMotion.animation}`);
    assert.ok(parseFloat(barMotion.transition) <= 0.001, `Transição do painel não respeita movimento reduzido: ${barMotion.transition}`);
    const desktop = await assertNoHorizontalOverflow('Dashboard desktop 1440px');
    console.log(`DESKTOP 1440px — viewport=${desktop.viewport}, document=${desktop.document}`);
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const mobile = await assertNoHorizontalOverflow('Dashboard mobile 390px');
    console.log(`MOBILE 390px — viewport=${mobile.viewport}, document=${mobile.document}, body=${mobile.body}`);
    const expectedAtMobile = filtered(row => row.categoria === firstCategoryOption);
    actual = await state();
    checkState(actual, expectedAtMobile, 'Gráficos mobile 390px');
    await evaluate("document.querySelector('#clear-filters').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Rótulos empilhados sem filtros mobile 390px');
    await setFilters('', 'Santos');
    await setSearch('santos');
    const mobileSearchExpected = searchSummary('santos', '', 'Santos');
    actual = await state();
    checkState(actual, mobileSearchExpected, 'Busca+filtro cidade mobile 390px');
    await command('Emulation.setDeviceMetricsOverride', { width: 320, height: 780, deviceScaleFactor: 1, mobile: true });
    const narrowMobile = await assertNoHorizontalOverflow('Dashboard mobile 320px');
    actual = await state();
    checkState(actual, mobileSearchExpected, 'Busca+filtro cidade mobile 320px');
    console.log(`MOBILE 320px — viewport=${narrowMobile.viewport}, document=${narrowMobile.document}, body=${narrowMobile.body}`);
    await evaluate("document.querySelector('#clear-filters').click()");
    actual = await state();
    checkState(actual, totalSummary, 'Rótulos empilhados sem filtros mobile 320px');
    await evaluate("document.querySelector('#category-chart').scrollIntoView({ block: 'center' })");
    await captureOptionalScreenshot('dashboard-mobile-320-chart.png');
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await setFilters('', 'Santos');
    await setSearch('santos');
    actual = await state();
    checkState(actual, mobileSearchExpected, 'Busca+filtro cidade mobile 390px (retorno)');
    assert.ok(await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), 'Modo de movimento reduzido deixou de estar ativo.');
    await evaluate("document.querySelector('#clear-filters').click(); window.scrollTo(0, 0)");
    actual = await state();
    checkState(actual, totalSummary, 'Painel final sem filtros');
    await evaluate('document.fonts.ready');
    await sleep(1000); // inclui os atrasos staggered mesmo com movimento reduzido emulado.
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await sleep(300);
    await captureOptionalScreenshot('dashboard-mobile-contacts.png');
    await evaluate('window.scrollTo(0, 0)');
    await captureOptionalScreenshot('dashboard-mobile.png');
    await evaluate("document.querySelector('#category-chart').scrollIntoView({ block: 'center' })");
    await captureOptionalScreenshot('dashboard-mobile-chart.png');
    await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await sleep(450);
    await captureOptionalScreenshot('dashboard-desktop-contacts.png');
    await evaluate('window.scrollTo(0, 0)');
    await captureOptionalScreenshot('dashboard-desktop.png');
    await evaluate("document.querySelector('#logout-button').click()");
    await sleep(250); // a animação de entrada do gate tem atraso curto mesmo em movimento reduzido.
    gate = await gateState();
    assert.equal(gate.welcomeHidden, false, 'Logout final não voltou ao gate.');
    assert.deepEqual(gate.session, [], 'Logout final não removeu o marcador.');
    await captureOptionalScreenshot('gate-desktop.png');
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await captureOptionalScreenshot('gate-mobile.png');

    assert.deepEqual(exceptions, [], `Exceções JavaScript: ${exceptions.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `Erros no console JavaScript: ${consoleErrors.join('; ')}`);
    for (const requiredPath of ['/', '/styles.css', '/dashboard.js', '/data/vendas.json', '/favicon.svg']) {
      assert.ok(requests.includes(requiredPath), `Recurso não carregado no navegador: ${requiredPath}`);
    }
    const visualIssueList = [...visualIssues];
    assert.equal(visualIssueList.length, 0, `Falhas de legibilidade/precisão visual (${visualIssueList.length}): ${visualIssueList.slice(0, 8).join(' | ')}${visualIssueList.length > 8 ? ' | …' : ''}`);
    console.log('PASS browser — sem exceções JavaScript ou erros de console; recursos HTTP necessários carregados');
    console.log(`Browser utilizado: ${browserPath}`);
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    if (browser && !browser.killed) browser.kill();
    await new Promise(resolve => server.close(resolve));
    if (profile && fs.existsSync(profile)) {
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
}

main().catch(error => {
  console.error(`FAIL browser: ${error.stack || error}`);
  process.exitCode = 1;
});
