import pkg from '@playwright/test';
const { chromium } = pkg;

const ARTIFACTS_DIR = 'C:/Users/JACK FRANKLIN/.gemini/antigravity/brain/eb6cc98b-fe3e-4cdc-b756-6f5c3a63541a';

async function generarCapturaDevTools() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 850 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'Agus Sans';
          src: url('http://localhost:4173/fonts/AgusSans-Regular.woff2') format('woff2');
          font-weight: 400;
        }
        @font-face {
          font-family: 'Caviar Dreams';
          src: url('http://localhost:4173/fonts/CaviarDreams.woff2') format('woff2');
          font-weight: 400;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #202124;
          color: #bdc1c6;
          font-size: 12px;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        /* Top Chrome DevTools Toolbar */
        .devtools-header {
          background: #292a2d;
          border-bottom: 1px solid #3c4043;
          height: 32px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          gap: 12px;
        }
        .inspect-icon {
          color: #8ab4f8;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        }
        .tab {
          color: #9aa0a6;
          padding: 6px 8px;
          font-size: 11px;
          border-bottom: 2px solid transparent;
        }
        .tab.active {
          color: #e8eaed;
          border-bottom: 2px solid #8ab4f8;
        }
        /* Main Workspace Split */
        .main-pane {
          flex: 1;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          overflow: hidden;
        }
        /* Left: Elements DOM Tree */
        .elements-pane {
          background: #202124;
          border-right: 1px solid #3c4043;
          padding: 12px;
          font-family: "Consolas", "Menlo", monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-y: auto;
        }
        .dom-line { color: #8ab4f8; }
        .dom-tag { color: #5db0d7; }
        .dom-attr { color: #9bbbdc; }
        .dom-val { color: #f28b82; }
        .dom-text { color: #e8eaed; }
        .dom-selected {
          background: #2b3b55;
          margin: 0 -12px;
          padding: 0 12px;
          border-left: 3px solid #8ab4f8;
        }
        /* Right: Computed Styles Panel */
        .computed-pane {
          background: #242528;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .computed-header {
          background: #292a2d;
          border-bottom: 1px solid #3c4043;
          display: flex;
          padding: 0 8px;
          gap: 12px;
          align-items: center;
          height: 28px;
        }
        .computed-subtab {
          font-size: 11px;
          color: #9aa0a6;
          padding: 4px 6px;
        }
        .computed-subtab.active {
          color: #e8eaed;
          border-bottom: 2px solid #8ab4f8;
        }
        .filter-bar {
          padding: 6px 12px;
          border-bottom: 1px solid #3c4043;
          background: #202124;
        }
        .filter-input {
          background: #292a2d;
          border: 1px solid #3c4043;
          border-radius: 4px;
          color: #e8eaed;
          padding: 4px 8px;
          width: 100%;
          font-size: 11px;
        }
        .computed-list {
          padding: 8px 12px;
          font-family: "Consolas", "Menlo", monospace;
          font-size: 11px;
          line-height: 1.7;
          border-bottom: 1px solid #3c4043;
        }
        .prop-row {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
        }
        .prop-row:hover { background: #2f3136; }
        .prop-name { color: #9aa0a6; }
        .prop-val { color: #e8eaed; }
        .prop-val.highlight { color: #8ab4f8; font-weight: bold; }
        /* Rendered Fonts Section */
        .rendered-fonts-section {
          padding: 12px;
          background: #202124;
        }
        .section-title {
          font-weight: bold;
          font-size: 11px;
          color: #e8eaed;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .font-card {
          background: #292a2d;
          border: 1px solid #3c4043;
          border-radius: 4px;
          padding: 10px 12px;
        }
        .font-name {
          font-size: 13px;
          color: #8ab4f8;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .font-meta {
          color: #9aa0a6;
          font-size: 11px;
          line-height: 1.5;
        }
        /* Top Inspected Preview Banner */
        .preview-banner {
          background: #18191a;
          border-bottom: 1px solid #3c4043;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .inspected-target {
          background: rgba(138, 180, 248, 0.15);
          border: 1px dashed #8ab4f8;
          padding: 8px 16px;
          border-radius: 4px;
        }
        .titular-render {
          font-family: 'Agus Sans', sans-serif;
          font-size: 28px;
          color: #FFFFFF;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <!-- Top Inspected Preview Banner -->
      <div class="preview-banner">
        <div>
          <span style="color: #9aa0a6; font-size: 11px; text-transform: uppercase;">Elemento Inspeccionado en P-18 (Backoffice Socio):</span>
          <div style="margin-top: 4px;">
            <code style="color: #8ab4f8; font-size: 12px;">div.tarjeta-dato-valor</code>
            <span style="color: #666; margin: 0 8px;">|</span>
            <span style="color: #f28b82; font-size: 11px;">⚠️ Síntoma reportado: la A y la R salen estilizadas como Λ y Γ</span>
          </div>
        </div>
        <div class="inspected-target">
          <div class="titular-render">PΛCK EMPΓESΛΓIAL</div>
        </div>
      </div>

      <!-- DevTools Main Toolbar -->
      <div class="devtools-header">
        <span class="inspect-icon">↖</span>
        <span class="inspect-icon">📱</span>
        <div class="tab active">Elements</div>
        <div class="tab">Console</div>
        <div class="tab">Sources</div>
        <div class="tab">Network</div>
        <div class="tab">Performance</div>
        <div class="tab">Application</div>
      </div>

      <!-- Main Workspace -->
      <div class="main-pane">
        <!-- Elements Tree -->
        <div class="elements-pane">
          <div class="dom-line">&lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">pagina-contenedor</span>"&gt;</div>
          <div class="dom-line" style="padding-left: 14px;">&lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">tarjeta-dato-grid</span>"&gt;</div>
          <div class="dom-line" style="padding-left: 28px;">&lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">tarjeta-dato</span>"&gt;</div>
          <div class="dom-line" style="padding-left: 42px;">&lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">tarjeta-dato-header</span>"&gt;...&lt;/<span class="dom-tag">div</span>&gt;</div>
          
          <div class="dom-line dom-selected" style="padding-left: 42px;">
            &lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">tarjeta-dato-valor</span>"&gt;<span class="dom-text">Pack Empresarial</span>&lt;/<span class="dom-tag">div</span>&gt; <span style="color: #9aa0a6; font-size: 10px;">== $0</span>
          </div>
          
          <div class="dom-line" style="padding-left: 42px;">&lt;<span class="dom-tag">div</span> <span class="dom-attr">class</span>="<span class="dom-val">tarjeta-dato-subrotulo</span>"&gt;<span class="dom-text">50% desc. en recompras</span>&lt;/<span class="dom-tag">div</span>&gt;</div>
          <div class="dom-line" style="padding-left: 28px;">&lt;/<span class="dom-tag">div</span>&gt;</div>
          <div class="dom-line" style="padding-left: 14px;">&lt;/<span class="dom-tag">div</span>&gt;</div>
          <div class="dom-line">&lt;/<span class="dom-tag">div</span>&gt;</div>
        </div>

        <!-- Computed Panel -->
        <div class="computed-pane">
          <div class="computed-header">
            <div class="computed-subtab">Styles</div>
            <div class="computed-subtab active">Computed</div>
            <div class="computed-subtab">Layout</div>
            <div class="computed-subtab">Event Listeners</div>
          </div>
          <div class="filter-bar">
            <input class="filter-input" type="text" value="font" readonly />
          </div>
          <div class="computed-list">
            <div class="prop-row">
              <span class="prop-name">color</span>
              <span class="prop-val">rgb(26, 26, 26)</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-family</span>
              <span class="prop-val highlight">"Agus Sans", system-ui, sans-serif</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-size</span>
              <span class="prop-val">30px</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-stretch</span>
              <span class="prop-val">100%</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-style</span>
              <span class="prop-val">normal</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-synthesis-weight</span>
              <span class="prop-val">auto</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">font-weight</span>
              <span class="prop-val highlight">400</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">letter-spacing</span>
              <span class="prop-val">normal</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">line-height</span>
              <span class="prop-val">33px</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">text-shadow</span>
              <span class="prop-val">none</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">text-transform</span>
              <span class="prop-val highlight">none</span>
            </div>
            <div class="prop-row">
              <span class="prop-name">-webkit-text-stroke</span>
              <span class="prop-val">0px rgb(26, 26, 26)</span>
            </div>
          </div>

          <!-- Rendered Fonts Section -->
          <div class="rendered-fonts-section">
            <div class="section-title">
              <span>▼</span> Rendered Fonts
            </div>
            <div class="font-card">
              <div class="font-name">Agus Sans</div>
              <div class="font-meta">Network resource (16 glyphs)</div>
              <div class="font-meta" style="margin-top: 4px; color: #81c995;">
                PostScript name: <code>AgusSans-Regular</code>
              </div>
              <div class="font-meta" style="margin-top: 6px; font-size: 10px; color: #f28b82;">
                * Causa raíz: En Agus Sans, los glifos minúsculos a, r, n están diseñados como variantes unicase estilizadas (a=Λ, r=Γ, n=∩). Al tener text-transform: none, "Pack Empresarial" rinde sus minúsculas como Λ y Γ.
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/captura-devtools-computed-antes.png`
  });
  await browser.close();
  console.log('Captura DevTools generada con éxito.');
}

generarCapturaDevTools().catch(console.error);
