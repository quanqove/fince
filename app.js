const stocks = [
  { symbol: "00700.HK", name: "腾讯控股", price: 385.6, open: 379.2, high: 388.4, low: 377.8, volume: 2871, base: 385.6 },
  { symbol: "09988.HK", name: "阿里巴巴", price: 84.25, open: 83.4, high: 85.1, low: 82.75, volume: 4218, base: 84.25 },
  { symbol: "600519.SH", name: "贵州茅台", price: 1518.7, open: 1505.8, high: 1524.9, low: 1498.1, volume: 914, base: 1518.7 },
  { symbol: "000858.SZ", name: "五粮液", price: 132.44, open: 130.96, high: 133.2, low: 130.18, volume: 1934, base: 132.44 },
  { symbol: "AAPL.US", name: "Apple", price: 184.32, open: 183.5, high: 185.04, low: 181.86, volume: 6120, base: 184.32 },
  { symbol: "NVDA.US", name: "NVIDIA", price: 913.56, open: 902.2, high: 918.9, low: 898.7, volume: 8054, base: 913.56 },
  { symbol: "TSLA.US", name: "Tesla", price: 178.9, open: 181.1, high: 182.45, low: 176.8, volume: 7399, base: 178.9 },
  { symbol: "MSFT.US", name: "Microsoft", price: 416.18, open: 414.6, high: 417.8, low: 412.4, volume: 3441, base: 416.18 }
];

const alerts = [
  { symbol: "00700.HK", rule: "上穿 388.00", active: true },
  { symbol: "NVDA.US", rule: "回落至 905.00", active: true },
  { symbol: "600519.SH", rule: "跌破 1500.00", active: false }
];

const feedTemplates = [
  "盘口买盘增强，短线成交放大",
  "触及日内高位，波动率升高",
  "价格靠近预警线，请留意仓位",
  "成交量高于近 5 分钟均值",
  "卖盘压力减弱，价差收窄"
];

let selectedSymbol = "00700.HK";
let tradeSide = "buy";
const history = new Map(stocks.map((stock) => [stock.symbol, makeHistory(stock.price)]));
const assetHistory = makeAssetHistory(8200);

const elements = {
  clock: document.querySelector("#clock"),
  tickerStrip: document.querySelector("#tickerStrip"),
  stockTable: document.querySelector("#stockTable"),
  selectedName: document.querySelector("#selectedName"),
  selectedMetrics: document.querySelector("#selectedMetrics"),
  tradeSymbol: document.querySelector("#tradeSymbol"),
  orderPrice: document.querySelector("#orderPrice"),
  orderQty: document.querySelector("#orderQty"),
  orderValue: document.querySelector("#orderValue"),
  priceChart: document.querySelector("#priceChart"),
  assetChart: document.querySelector("#assetChart"),
  assetTotal: document.querySelector("#assetTotal"),
  assetPrincipal: document.querySelector("#assetPrincipal"),
  assetPnL: document.querySelector("#assetPnL"),
  assetToday: document.querySelector("#assetToday"),
  assetGrowth: document.querySelector("#assetGrowth"),
  alertsList: document.querySelector("#alertsList"),
  activityFeed: document.querySelector("#activityFeed"),
  symbolSearch: document.querySelector("#symbolSearch"),
  buyTab: document.querySelector("#buyTab"),
  sellTab: document.querySelector("#sellTab"),
  placeOrder: document.querySelector("#placeOrder"),
  addAlert: document.querySelector("#addAlert")
};

function makeHistory(price) {
  const points = [];
  let current = price;
  for (let index = 0; index < 80; index += 1) {
    current += (Math.random() - 0.48) * price * 0.002;
    points.push(Number(current.toFixed(2)));
  }
  return points;
}

function makeAssetHistory(value) {
  const points = [];
  let current = value;
  for (let index = 0; index < 52; index += 1) {
    current += 16 + (Math.random() - 0.4) * 42;
    points.push(Number(current.toFixed(2)));
  }
  return points;
}

function formatPrice(value) {
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function changeOf(stock) {
  const diff = stock.price - stock.open;
  const pct = (diff / stock.open) * 100;
  return { diff, pct };
}

function renderTickerStrip() {
  elements.tickerStrip.innerHTML = stocks.slice(0, 6).map((stock) => {
    const change = changeOf(stock);
    const className = change.diff >= 0 ? "up" : "down";
    return `
      <article class="ticker-card" data-symbol="${stock.symbol}">
        <div>
          <strong>${stock.name}</strong>
          <small>${stock.symbol}</small>
        </div>
        <div class="price ${className}">
          <strong>${formatPrice(stock.price)}</strong>
          <small>${change.diff >= 0 ? "+" : ""}${change.pct.toFixed(2)}%</small>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".ticker-card").forEach((card) => {
    card.addEventListener("click", () => selectStock(card.dataset.symbol));
  });
}

function renderStockTable() {
  const term = elements.symbolSearch.value.trim().toLowerCase();
  const visible = stocks.filter((stock) =>
    stock.symbol.toLowerCase().includes(term) || stock.name.toLowerCase().includes(term)
  );

  elements.stockTable.innerHTML = `
    <div class="stock-row header">
      <span>名称</span><span>最新价</span><span>涨跌幅</span><span>最高</span><span>成交量</span>
    </div>
    ${visible.map((stock) => {
      const change = changeOf(stock);
      const className = change.diff >= 0 ? "up" : "down";
      return `
        <div class="stock-row ${stock.symbol === selectedSymbol ? "selected" : ""}" data-symbol="${stock.symbol}">
          <div class="stock-main"><strong>${stock.name}</strong><small>${stock.symbol}</small></div>
          <strong>${formatPrice(stock.price)}</strong>
          <strong class="${className}">${change.diff >= 0 ? "+" : ""}${change.pct.toFixed(2)}%</strong>
          <span>${formatPrice(stock.high)}</span>
          <span>${stock.volume.toLocaleString("zh-CN")}万</span>
        </div>
      `;
    }).join("")}
  `;

  document.querySelectorAll(".stock-row[data-symbol]").forEach((row) => {
    row.addEventListener("click", () => selectStock(row.dataset.symbol));
  });
}

function renderSelected() {
  const stock = stocks.find((item) => item.symbol === selectedSymbol);
  const change = changeOf(stock);
  const className = change.diff >= 0 ? "up" : "down";
  elements.selectedName.textContent = stock.name;
  elements.tradeSymbol.textContent = stock.symbol;
  elements.orderPrice.value = stock.price.toFixed(2);
  elements.selectedMetrics.innerHTML = `
    <div class="metric"><span>最新价</span><strong>${formatPrice(stock.price)}</strong></div>
    <div class="metric"><span>涨跌幅</span><strong class="${className}">${change.diff >= 0 ? "+" : ""}${change.pct.toFixed(2)}%</strong></div>
    <div class="metric"><span>最高 / 最低</span><strong>${formatPrice(stock.high)} / ${formatPrice(stock.low)}</strong></div>
    <div class="metric"><span>成交量</span><strong>${stock.volume.toLocaleString("zh-CN")} 万</strong></div>
  `;
  updateOrderValue();
  drawChart();
}

function renderAlerts() {
  elements.alertsList.innerHTML = alerts.map((alert) => `
    <div class="alert-item">
      <div>
        <strong>${alert.symbol}</strong>
        <span>${alert.rule}</span>
      </div>
      <strong class="${alert.active ? "up" : ""}">${alert.active ? "启用" : "暂停"}</strong>
    </div>
  `).join("");
}

function renderFeed() {
  const selected = stocks.find((item) => item.symbol === selectedSymbol);
  const items = Array.from({ length: 5 }, (_, index) => {
    const text = feedTemplates[(index + Math.floor(Math.random() * feedTemplates.length)) % feedTemplates.length];
    return { text, time: new Date(Date.now() - index * 42000).toLocaleTimeString("zh-CN", { hour12: false }) };
  });

  elements.activityFeed.innerHTML = items.map((item) => `
    <div class="feed-item">
      <p><strong>${selected.symbol}</strong> ${item.text}</p>
      <span>${item.time}</span>
    </div>
  `).join("");
}

function drawLineChart(canvas, points, options = {}) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const pad = options.pad || 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const up = points.at(-1) >= points[0];
  const color = options.color || (up ? "#21c179" : "#ff5c66");

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.background || "#15171b";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#30343c";
  ctx.lineWidth = 1;
  for (let line = 0; line < 4; line += 1) {
    const y = pad + ((height - pad * 2) / 3) * line;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((point - min) / range) * (height - pad * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = options.lineWidth || 2.4;
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, pad, 0, height - pad);
  gradient.addColorStop(0, options.fill || "rgba(33,193,121,.22)");
  gradient.addColorStop(1, "rgba(25,27,32,0)");
  ctx.lineTo(width - pad, height - pad);
  ctx.lineTo(pad, height - pad);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  if (options.labels) {
    ctx.fillStyle = "#9aa3ad";
    ctx.font = "12px Inter, Arial";
    ctx.fillText(formatPrice(max), pad, 16);
    ctx.fillText(formatPrice(min), pad, height - 8);
  }
}

function drawChart() {
  const points = history.get(selectedSymbol);
  const up = points.at(-1) >= points[0];
  drawLineChart(elements.priceChart, points, {
    pad: 32,
    labels: true,
    fill: up ? "rgba(33,193,121,.24)" : "rgba(255,92,102,.24)"
  });
}

function drawAssetChart() {
  const latest = assetHistory.at(-1);
  const principal = assetHistory[0];
  const today = latest - assetHistory.at(-8);
  const growth = latest - principal;
  const growthPct = (growth / principal) * 100;
  elements.assetTotal.textContent = formatPrice(latest);
  elements.assetPrincipal.textContent = formatPrice(principal);
  elements.assetPnL.textContent = `${growth >= 0 ? "+" : ""}${formatPrice(growth)} (${growth >= 0 ? "+" : ""}${growthPct.toFixed(2)}%)`;
  elements.assetToday.textContent = `${today >= 0 ? "+" : ""}${formatPrice(today)}`;
  elements.assetGrowth.textContent = `${growth >= 0 ? "+" : ""}${formatPrice(growth)}`;
  elements.assetPnL.className = growth >= 0 ? "up" : "down";
  elements.assetToday.className = today >= 0 ? "up" : "down";
  elements.assetGrowth.className = growth >= 0 ? "up" : "down";
  drawLineChart(elements.assetChart, assetHistory, {
    pad: 20,
    color: "#52b7d8",
    lineWidth: 2.2,
    fill: "rgba(82,183,216,.22)"
  });
}

function selectStock(symbol) {
  selectedSymbol = symbol;
  renderStockTable();
  renderSelected();
  renderFeed();
}

function updatePrices() {
  stocks.forEach((stock) => {
    const drift = (Math.random() - 0.49) * stock.base * 0.004;
    stock.price = Math.max(stock.price + drift, stock.base * 0.88);
    stock.high = Math.max(stock.high, stock.price);
    stock.low = Math.min(stock.low, stock.price);
    stock.volume += Math.floor(Math.random() * 18);
    const points = history.get(stock.symbol);
    points.push(Number(stock.price.toFixed(2)));
    points.shift();
  });

  const lastAsset = assetHistory.at(-1);
  assetHistory.push(Number((lastAsset + 10 + (Math.random() - 0.36) * 32).toFixed(2)));
  assetHistory.shift();

  elements.clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  renderTickerStrip();
  renderStockTable();
  renderSelected();
  drawAssetChart();
}

function updateOrderValue() {
  const price = Number(elements.orderPrice.value || 0);
  const qty = Number(elements.orderQty.value || 0);
  elements.orderValue.textContent = formatPrice(price * qty);
}

function setTradeSide(side) {
  tradeSide = side;
  elements.buyTab.classList.toggle("active", side === "buy");
  elements.sellTab.classList.toggle("active", side === "sell");
}

elements.symbolSearch.addEventListener("input", renderStockTable);
elements.orderPrice.addEventListener("input", updateOrderValue);
elements.orderQty.addEventListener("input", updateOrderValue);
elements.buyTab.addEventListener("click", () => setTradeSide("buy"));
elements.sellTab.addEventListener("click", () => setTradeSide("sell"));
elements.placeOrder.addEventListener("click", () => {
  const stock = stocks.find((item) => item.symbol === selectedSymbol);
  const action = tradeSide === "buy" ? "买入" : "卖出";
  alerts.unshift({ symbol: stock.symbol, rule: `${action}委托已提交 ${elements.orderQty.value} 股`, active: true });
  if (alerts.length > 5) alerts.pop();
  renderAlerts();
});
elements.addAlert.addEventListener("click", () => {
  const stock = stocks.find((item) => item.symbol === selectedSymbol);
  alerts.unshift({ symbol: stock.symbol, rule: `价格到达 ${stock.price.toFixed(2)}`, active: true });
  renderAlerts();
});
window.addEventListener("resize", () => {
  drawChart();
  drawAssetChart();
});

renderTickerStrip();
renderStockTable();
renderSelected();
renderAlerts();
renderFeed();
drawAssetChart();
updatePrices();
setInterval(updatePrices, 1800);
setInterval(renderFeed, 9000);
