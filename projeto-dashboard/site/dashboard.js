(() => {
  'use strict';

  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const chartNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat('pt-BR');
  const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
  const sessionKey = 'orbita-demo-access';
  const welcomeGate = document.getElementById('welcome-gate');
  const dashboardApp = document.getElementById('dashboard-app');
  const loginForm = document.getElementById('demo-login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginFeedback = document.getElementById('login-feedback');
  const categoryFilter = document.getElementById('category-filter');
  const cityFilter = document.getElementById('city-filter');
  const salesSearch = document.getElementById('sales-search');
  const dashboardHero = document.querySelector('.hero');
  const scrollProgressBar = document.querySelector('.scroll-progress__bar');
  const chapterLinks = [...document.querySelectorAll('.chapter-links a')];
  const elements = {
    total: document.getElementById('total-value'), count: document.getElementById('sale-count'),
    average: document.getElementById('average-value'), dateRange: document.getElementById('date-range'),
    body: document.getElementById('sales-body'), tableCount: document.getElementById('table-count'),
    empty: document.getElementById('empty-state'), categoryChart: document.getElementById('category-chart'),
    emptyMessage: document.getElementById('empty-message'), emptyClear: document.getElementById('empty-clear'),
    cityChart: document.getElementById('city-chart'),
  };

  function text(tag, content, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = content;
    return node;
  }

  function optionValues(select, values) {
    for (const value of values) select.add(new Option(value, value));
  }

  function groupTotal(rows, field) {
    const totals = new Map();
    for (const row of rows) totals.set(row[field], (totals.get(row[field]) || 0) + Number(row.valor_venda));
    return [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }

  function drawChart(container, groups, ariaLabel, select, selectedValue) {
    container.replaceChildren();
    if (!groups.length) {
      container.append(text('div', 'Sem dados para exibir.', 'chart-empty'));
      return;
    }
    const width = Math.max(container.clientWidth || 400, 260);
    const height = 220;
    const left = width <= 300 ? 82 : width <= 400 ? 88 : 96;
    const right = 12;
    const plotWidth = width - left - right;
    const slot = plotWidth / groups.length;
    const stackedValueLabels = slot < 112;
    const top = stackedValueLabels ? 50 : 40;
    const bottom = 48;
    const plotHeight = height - top - bottom;
    const max = Math.max(...groups.map(([, total]) => total), 1);
    const step = max / 4;
    const barWidth = Math.min(52, plotWidth / groups.length * 0.52);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', ariaLabel);
    const description = document.createElementNS(svg.namespaceURI, 'title');
    description.textContent = ariaLabel;
    svg.append(description);
    for (let i = 0; i <= 4; i++) {
      const y = top + plotHeight - (plotHeight * i / 4);
      const line = document.createElementNS(svg.namespaceURI, 'line');
      line.setAttribute('x1', String(left)); line.setAttribute('x2', String(width - right));
      line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'chart-grid');
      svg.append(line);
      const label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', String(left - 6)); label.setAttribute('y', String(y + 3));
      label.setAttribute('text-anchor', 'end'); label.setAttribute('class', 'chart-axis');
      label.textContent = chartMoney(step * i); svg.append(label);
    }
    groups.forEach(([name, total], index) => {
      const barHeight = Math.max(0, total / max * plotHeight);
      const x = left + index * slot + (slot - barWidth) / 2;
      const y = top + plotHeight - barHeight;
      const bar = document.createElementNS(svg.namespaceURI, 'rect');
      bar.setAttribute('x', String(x)); bar.setAttribute('y', String(y)); bar.setAttribute('width', String(barWidth));
      bar.setAttribute('height', String(barHeight)); bar.setAttribute('rx', '4'); bar.setAttribute('class', 'bar');
      bar.setAttribute('role', 'button');
      bar.setAttribute('tabindex', '0');
      bar.setAttribute('aria-label', `${name}: ${money.format(total)}. ${selectedValue === name ? 'Filtro ativo. ' : ''}Ativar filtro.`);
      bar.setAttribute('aria-pressed', String(selectedValue === name));
      bar.style.setProperty('--bar-order', String(Math.min(index, 10)));
      const title = document.createElementNS(svg.namespaceURI, 'title');
      title.textContent = `${name}: ${money.format(total)}`; bar.append(title); svg.append(bar);
      const activate = () => { select.value = select.value === name ? '' : name; update(true); };
      bar.addEventListener('click', activate);
      bar.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      });
      const value = document.createElementNS(svg.namespaceURI, 'text');
      const center = x + barWidth / 2;
      const exactValue = money.format(total);
      value.setAttribute('x', String(center));
      value.setAttribute('text-anchor', 'middle');
      value.setAttribute('class', `bar-value${stackedValueLabels ? ' bar-value-stacked' : ''}`);
      if (stackedValueLabels) {
        const [, currencyPrefix, amountText] = exactValue.match(/^(R\$\s*)(.*)$/u);
        value.setAttribute('y', String(Math.max(20, y - 22)));
        const currencyLine = document.createElementNS(svg.namespaceURI, 'tspan');
        currencyLine.setAttribute('x', String(center));
        currencyLine.textContent = currencyPrefix;
        const amountLine = document.createElementNS(svg.namespaceURI, 'tspan');
        amountLine.setAttribute('x', String(center));
        amountLine.setAttribute('dy', '10');
        amountLine.textContent = amountText;
        value.append(currencyLine, amountLine);
      } else {
        value.setAttribute('y', String(y - 6));
        value.textContent = exactValue;
      }
      svg.append(value);
      const label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', String(x + barWidth / 2)); label.setAttribute('y', String(top + plotHeight + 19));
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('class', 'bar-label'); label.textContent = name;
      svg.append(label);
    });
    container.append(svg);
  }

  function render(rows) {
    const total = rows.reduce((sum, row) => sum + Number(row.valor_venda), 0);
    const count = rows.length;
    elements.total.textContent = money.format(total);
    elements.count.textContent = integer.format(count);
    elements.average.textContent = money.format(count ? total / count : 0);
    elements.tableCount.textContent = `${integer.format(count)} ${count === 1 ? 'venda' : 'vendas'}`;
    elements.empty.hidden = count !== 0;

    drawChart(elements.categoryChart, groupTotal(rows, 'categoria'), 'Valor vendido por categoria em reais, eixo iniciado em zero', categoryFilter, categoryFilter.value);
    drawChart(elements.cityChart, groupTotal(rows, 'cidade'), 'Valor vendido por cidade em reais, eixo iniciado em zero', cityFilter, cityFilter.value);

    elements.body.replaceChildren();
    const sorted = [...rows].sort((a, b) => b.data.localeCompare(a.data) || a.id_venda.localeCompare(b.id_venda));
    for (const row of sorted) {
      const tr = document.createElement('tr');
      for (const value of [row.id_venda, formatDate(row.data), row.produto, row.categoria, row.cidade]) tr.append(text('td', value));
      const quantity = text('td', integer.format(row.quantidade), 'numeric');
      const amount = text('td', money.format(row.valor_venda), 'numeric');
      tr.append(quantity, amount); elements.body.append(tr);
    }
  }

  function update(animate = false) {
    const selectedCategory = categoryFilter.value;
    const selectedCity = cityFilter.value;
    const searchTerms = normalizeSearch(salesSearch.value).split(/\s+/).filter(Boolean);
    render(sales.filter(row => (!selectedCategory || row.categoria === selectedCategory)
      && (!selectedCity || row.cidade === selectedCity)
      && matchesSearch(row, searchTerms)));
    if (animate) animateFilterUpdate();
  }

  function chartMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return money.format(0);
    const magnitude = Math.abs(amount);
    const sign = amount < 0 ? '−' : '';
    if (magnitude >= 1_000_000) return `R$ ${sign}${chartNumber.format(magnitude / 1_000_000)} mi`;
    if (magnitude >= 1_000) return `R$ ${sign}${chartNumber.format(magnitude / 1_000)} mil`;
    return money.format(amount);
  }

  function formatDate(value) {
    return dateFormat.format(new Date(`${value}T00:00:00Z`));
  }

  function normalizeSearch(value) {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u00a0/g, ' ').toLocaleLowerCase('pt-BR').trim();
  }

  function matchesSearch(row, terms) {
    if (!terms.length) return true;
    const amount = Number(row.valor_venda);
    const searchable = normalizeSearch([
      row.id_venda,
      row.data,
      formatDate(row.data),
      row.produto,
      row.categoria,
      row.cidade,
      row.quantidade,
      integer.format(row.quantidade),
      money.format(amount),
      amount.toFixed(2).replace('.', ','),
      String(row.valor_venda),
    ].join(' '));
    return terms.every(term => searchable.includes(term));
  }

  let sales = [];
  let dataRequested = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealObserver = null;
  let pointerFrame = 0;
  let scrollFrame = 0;

  function updateScrollNavigation() {
    scrollFrame = 0;
    if (dashboardApp.hidden) return;
    if (reducedMotion.matches) {
      scrollProgressBar.style.transform = 'scaleX(0)';
    } else {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;
      scrollProgressBar.style.transform = `scaleX(${progress})`;
    }

    const activationLine = window.innerHeight * 0.36;
    let activeLink = chapterLinks[0];
    for (const link of chapterLinks) {
      const section = document.querySelector(link.getAttribute('href'));
      if (section && section.getBoundingClientRect().top <= activationLine) activeLink = link;
    }
    for (const link of chapterLinks) {
      if (link === activeLink) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function requestScrollNavigation() {
    if (dashboardApp.hidden || scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollNavigation);
  }

  function configureScrollMotion(reset = false) {
    const targets = [...dashboardApp.querySelectorAll('[data-reveal]')];
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (reducedMotion.matches || typeof IntersectionObserver === 'undefined') {
      dashboardApp.classList.remove('motion-ready');
      targets.forEach(target => target.classList.add('is-revealed'));
      return;
    }
    if (reset) targets.forEach(target => target.classList.remove('is-revealed'));
    dashboardApp.classList.add('motion-ready');
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.filter(target => !target.classList.contains('is-revealed')).forEach(target => revealObserver.observe(target));
  }

  dashboardHero.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType === 'touch' || pointerFrame) return;
    const bounds = dashboardHero.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    pointerFrame = window.requestAnimationFrame(() => {
      dashboardHero.style.setProperty('--light-x', `${Math.round(x * 100)}%`);
      dashboardHero.style.setProperty('--light-y', `${Math.round(y * 100)}%`);
      dashboardHero.style.setProperty('--orbit-x', `${(x - 0.5) * 9}px`);
      dashboardHero.style.setProperty('--orbit-y', `${(y - 0.5) * 7}px`);
      pointerFrame = 0;
    });
  });
  dashboardHero.addEventListener('pointerleave', () => {
    if (reducedMotion.matches) return;
    dashboardHero.style.setProperty('--light-x', '68%');
    dashboardHero.style.setProperty('--light-y', '48%');
    dashboardHero.style.setProperty('--orbit-x', '0px');
    dashboardHero.style.setProperty('--orbit-y', '0px');
  });
  reducedMotion.addEventListener('change', () => {
    configureScrollMotion(true);
    if (reducedMotion.matches) scrollProgressBar.style.transform = 'scaleX(0)';
    else requestScrollNavigation();
  });
  window.addEventListener('scroll', requestScrollNavigation, { passive: true });
  window.addEventListener('resize', requestScrollNavigation, { passive: true });

  function animateFilterUpdate() {
    dashboardApp.classList.remove('is-updating');
    void dashboardApp.offsetWidth;
    dashboardApp.classList.add('is-updating');
    window.setTimeout(() => dashboardApp.classList.remove('is-updating'), 520);
  }

  function loadSales() {
    if (dataRequested) return;
    dataRequested = true;
    fetch('./data/vendas.json')
      .then(response => { if (!response.ok) throw new Error(`Falha ao carregar os dados (${response.status})`); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Formato de dados inválido');
        sales = data;
        optionValues(categoryFilter, [...new Set(sales.map(row => row.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
        optionValues(cityFilter, [...new Set(sales.map(row => row.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR')));
        const dates = sales.map(row => row.data).sort();
        if (dates.length) elements.dateRange.textContent = `${formatDate(dates[0])} — ${formatDate(dates.at(-1))}`;
        update();
      })
      .catch(error => {
        elements.dateRange.textContent = 'Dados indisponíveis';
        elements.emptyMessage.textContent = `${error.message}. Execute preparar_dados.py e recarregue a página.`;
        elements.emptyClear.hidden = true;
        elements.empty.classList.add('is-error');
        render([]);
      });
  }

  function showDashboard() {
    welcomeGate.hidden = true;
    dashboardApp.hidden = false;
    dashboardApp.classList.remove('is-updating');
    dashboardApp.classList.add('is-entering');
    configureScrollMotion(true);
    requestScrollNavigation();
    window.setTimeout(() => dashboardApp.classList.remove('is-entering'), 1500);
    loadSales();
  }

  function showWelcome() {
    dashboardApp.hidden = true;
    dashboardApp.classList.remove('is-entering', 'is-updating');
    dashboardApp.classList.remove('motion-ready');
    scrollProgressBar.style.transform = 'scaleX(0)';
    if (revealObserver) revealObserver.disconnect();
    welcomeGate.hidden = false;
    loginEmail.value = '';
    loginPassword.value = '';
    loginFeedback.textContent = '';
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    loginFeedback.textContent = '';
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      loginFeedback.textContent = 'Informe um e-mail válido e uma senha não vazia para continuar.';
      return;
    }
    try {
      // Apenas um sinalizador de demonstração é guardado; credenciais não são salvas nem verificadas.
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      loginFeedback.textContent = 'O navegador não permitiu criar a sessão desta aba. Habilite o armazenamento de sessão e tente novamente.';
      return;
    }
    loginPassword.value = '';
    showDashboard();
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    try { sessionStorage.removeItem(sessionKey); } catch { /* A tela ainda é bloqueada nesta página. */ }
    showWelcome();
    loginEmail.focus();
  });

  categoryFilter.addEventListener('change', () => update(true));
  cityFilter.addEventListener('change', () => update(true));
  function clearFilters() { categoryFilter.value = ''; cityFilter.value = ''; salesSearch.value = ''; update(true); }
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  document.getElementById('empty-clear').addEventListener('click', clearFilters);
  salesSearch.addEventListener('input', () => update(true));
  window.addEventListener('resize', () => { if (sales.length) update(); });

  try {
    if (sessionStorage.getItem(sessionKey) === '1') showDashboard();
    else showWelcome();
  } catch {
    showWelcome();
  }
})();
