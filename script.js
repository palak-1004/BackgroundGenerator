      // State
        const state = {
            type: 'linear',
            angle: 90,
            radialShape: 'ellipse',
            repeating: false,
            stops: [
                { color: '#ff7a7a', pos: 0 },
                { color: '#ffd27a', pos: 100 }
            ],
            presets: [
                { name: 'Sunset', css: 'linear-gradient(90deg,#ff7a7a 0%,#ffd27a 50%,#7ae1ff 100%)' },
                { name: 'Ocean', css: 'linear-gradient(135deg,#00c6ff 0%,#0072ff 100%)' },
                { name: 'Peach', css: 'radial-gradient(circle at center,#ffe7d6 0%,#ffd2a7 60%,#ffb6b6 100%)' },
                { name: 'Amoled', css: 'linear-gradient(180deg,#0f0c29 0%,#302b63 50%,#24243e 100%)' },
                { name: 'Aurora', css: 'conic-gradient(from 180deg at 50% 50%,#7b2ff7, #f107a3, #ffeed1)' }
            ]
        };

        // Elements
        const stopsEl = document.getElementById('stops');
        const gradientTypeEl = document.getElementById('gradientType');
        const angleEl = document.getElementById('angle');
        const angleValEl = document.getElementById('angleVal');
        const preview = document.getElementById('preview');
        const cssOut = document.getElementById('cssOut');
        const addStopBtn = document.getElementById('addStop');
        const copyBtn = document.getElementById('copyBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const randomizeBtn = document.getElementById('randomize');
        const resetBtn = document.getElementById('reset');
        const previewInfo = document.getElementById('previewInfo');
        const presetsContainer = document.getElementById('presets');
        const toggleRepeating = document.getElementById('toggleRepeating');
        const radialOptions = document.getElementById('radialOptions');
        const angleRow = document.getElementById('angleRow');
        const radialShapeEl = document.getElementById('radialShape');
        const exportWidth = document.getElementById('exportWidth');
        const exportHeight = document.getElementById('exportHeight');
        const exportNote = document.getElementById('exportNote');

        // Helpers
        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
        function toStopString(s) { return `${s.color} ${s.pos}%` }

        // UI for stops
        function renderStops() {
            stopsEl.innerHTML = '';
            state.stops.forEach((stop, i) => {
                const row = document.createElement('div');
                row.className = 'stop';
                row.innerHTML = `
          <input type="color" value="${stop.color}" aria-label="Color ${i + 1}">
          <div class="posSlider"><input type="range" min="0" max="100" value="${stop.pos}" title="Position" /></div>
          <div class="position" style="min-width:72px"><input type="number" value="${stop.pos}" min="0" max="100" style="width:68px;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef8"></div>
          <button title="Remove stop" style="background:transparent;border:0;color:#ff7a7a;font-weight:700;cursor:pointer">✕</button>
        `;
                // attach
                const colorIn = row.querySelector('input[type="color"]');
                const range = row.querySelector('input[type="range"]');
                const num = row.querySelector('input[type="number"]');
                const removeBtn = row.querySelector('button');

                colorIn.addEventListener('input', e => {
                    state.stops[i].color = e.target.value;
                    updatePreview();
                });
                range.addEventListener('input', e => {
                    const val = +e.target.value;
                    state.stops[i].pos = clamp(val, 0, 100);
                    num.value = state.stops[i].pos;
                    updatePreview();
                });
                num.addEventListener('input', e => {
                    const val = clamp(Number(e.target.value || 0), 0, 100);
                    state.stops[i].pos = val;
                    range.value = val;
                    updatePreview();
                });
                removeBtn.addEventListener('click', () => {
                    if (state.stops.length <= 2) { alert('Need at least 2 stops'); return; }
                    state.stops.splice(i, 1);
                    renderStops();
                    updatePreview();
                });

                stopsEl.appendChild(row);
            });
        }

        // Sort stops by position for consistent gradient string
        function sortedStops() { return [...state.stops].sort((a, b) => a.pos - b.pos) }

        function buildCSS() {
            const stopsString = sortedStops().map(toStopString).join(', ');
            const repeating = state.repeating ? 'repeating-' : '';
            if (state.type === 'linear') {
                return `${repeating}linear-gradient(${state.angle}deg, ${stopsString})`;
            } else if (state.type === 'radial') {
                const shape = state.radialShape || 'ellipse';
                return `${repeating}radial-gradient(${shape} at center, ${stopsString})`;
            } else { // conic
                return `${repeating}conic-gradient(from ${state.angle}deg at 50% 50%, ${stopsString})`;
            }
        }

        function updatePreview() {
            const css = buildCSS();
            preview.style.background = css;
            cssOut.value = `background: ${css};`;
            previewInfo.textContent = css;
        }

        // Random color helpers
        function randHex() {
            return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        }

        function randomize() {
            const count = Math.floor(Math.random() * 3) + 2; // 2..4 stops
            state.stops = [];
            for (let i = 0; i < count; i++) {
                state.stops.push({ color: randHex(), pos: Math.round((i / (count - 1)) * 100) });
            }
            renderStops();
            updatePreview();
        }

        // Presets
        function renderPresets() {
            presetsContainer.innerHTML = '';
            state.presets.forEach(p => {
                const el = document.createElement('div');
                el.className = 'preset';
                el.title = p.name;
                el.style.background = p.css;
                el.addEventListener('click', () => {
                    applyPreset(p.css);
                });
                presetsContainer.appendChild(el);
            });
        }

        function applyPreset(css) {
           
            const s = css.trim();
            // Quick detect type
            if (s.startsWith('linear-gradient')) {
                state.type = 'linear';
                const m = s.match(/linear-gradient\(([^)]+)\)/);
                if (m) {
                    let inner = m[1];
                    const parts = splitTopLevel(inner);
                    const first = parts[0].trim();
                    if (first.endsWith('deg')) {
                        state.angle = parseFloat(first);
                        parts.shift();
                    }
                    // parts now color stops
                    const stops = parts.map(p => parseStopString(p));
                    if (stops.length >= 2) { state.stops = stops }
                }
            } else if (s.startsWith('radial-gradient')) {
                state.type = 'radial';
                const m = s.match(/radial-gradient\(([^)]+)\)/);
                if (m) {
                    const inner = m[1];
                    const parts = splitTopLevel(inner);
                    // try to detect shape
                    if (parts[0].includes('circle')) state.radialShape = 'circle';
                    const stops = parts.filter(p => p.includes('#') || p.match(/rgba?\(/)).map(parseStopString);
                    if (stops.length >= 2) state.stops = stops;
                }
            } else if (s.startsWith('conic-gradient')) {
                state.type = 'conic';
                const m = s.match(/conic-gradient\(([^)]+)\)/);
                if (m) {
                    const inner = m[1];
                    const parts = splitTopLevel(inner);
                    // maybe has "from 180deg at 50% 50%" then stops
                    let idx = 0;
                    if (parts[0].trim().startsWith('from')) idx = 1;
                    const stops = parts.slice(idx).map(parseStopString);
                    if (stops.length >= 2) state.stops = stops;
                    // attempt to pull angle
                    const f = parts[0].trim().match(/from\s+([0-9.]+)deg/);
                    if (f) state.angle = +f[1];
                }
            } else {
                // unknown - set background only, don't change state
            }
            // UI sync
            gradientTypeEl.value = state.type;
            angleEl.value = state.angle;
            angleValEl.textContent = state.angle;
            radialShapeEl.value = state.radialShape;
            renderStops();
            updatePreview();
            toggleUIForType();
        }

        // simple CSV-level split that respects function parens (top-level comma only)
        function splitTopLevel(s) {
            const out = []; let cur = ''; let depth = 0;
            for (let ch of s) {
                if (ch === '(') depth++;
                if (ch === ')') depth--;
                if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
                cur += ch;
            }
            if (cur.trim()) out.push(cur);
            return out.map(x => x.trim());
        }

        function parseStopString(s) {
            const parts = s.trim().split(/\s+/);
            const color = parts[0];
            let pos = 0;
            if (parts.length > 1) {
                const p = parts[1].replace('%', '');
                pos = clamp(Math.round(Number(p) || 0), 0, 100);
            }
            return { color, pos };
        }

        // Buttons and bindings
        addStopBtn.addEventListener('click', () => {
            // add in middle (50%) with random color
            state.stops.push({ color: randHex(), pos: 50 });
            renderStops();
            updatePreview();
        });

        gradientTypeEl.addEventListener('change', (e) => {
            state.type = e.target.value;
            toggleUIForType();
            updatePreview();
        });

        function toggleUIForType() {
            if (state.type === 'radial') {
                radialOptions.style.display = '';
                angleRow.style.display = 'none';
                exportNote.textContent = 'PNG export supports linear & radial';
            } else if (state.type === 'conic') {
                radialOptions.style.display = 'none';
                angleRow.style.display = '';
                exportNote.textContent = 'Conic PNG export not supported; copy CSS to use in browser.';
            } else {
                radialOptions.style.display = 'none';
                angleRow.style.display = '';
                exportNote.textContent = 'PNG export supports linear & radial';
            }
            gradientTypeEl.value = state.type;
        }

        angleEl.addEventListener('input', (e) => {
            state.angle = +e.target.value;
            angleValEl.textContent = state.angle;
            updatePreview();
        });

        radialShapeEl.addEventListener('change', (e) => {
            state.radialShape = e.target.value;
            updatePreview();
        });

        toggleRepeating.addEventListener('click', () => {
            state.repeating = !state.repeating;
            toggleRepeating.textContent = `Repeating: ${state.repeating ? 'On' : 'Off'}`;
            updatePreview();
        });

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(cssOut.value);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy CSS', 900);
            } catch (e) {
                alert('Clipboard failed. Select and copy manually.');
            }
        });

        randomizeBtn.addEventListener('click', randomize);
        resetBtn.addEventListener('click', () => {
            state.type = 'linear';
            state.angle = 90;
            state.radialShape = 'ellipse';
            state.repeating = false;
            state.stops = [
                { color: '#ff7a7a', pos: 0 },
                { color: '#ffd27a', pos: 100 }
            ];
            gradientTypeEl.value = state.type;
            angleEl.value = state.angle;
            radialShapeEl.value = state.radialShape;
            toggleRepeating.textContent = 'Repeating: Off';
            renderStops();
            updatePreview();
            toggleUIForType();
        });

        // Download PNG implementation
        downloadBtn.addEventListener('click', async () => {
            const w = Math.max(100, Number(exportWidth.value) || 1200);
            const h = Math.max(100, Number(exportHeight.value) || 800);

            if (state.type === 'conic') {
                alert('Conic-gradient export to PNG is not supported by the built-in canvas exporter. Copy CSS to use in a browser or take a screenshot.');
                return;
            }

            // create canvas and draw gradient
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            if (state.type === 'linear') {
                const a = (state.angle % 360) * Math.PI / 180;
                // center-based line:
                const cx = w / 2, cy = h / 2;
                // large length so gradient covers
                const L = Math.sqrt(w * w + h * h);
                const x0 = cx - Math.cos(a) * L;
                const y0 = cy - Math.sin(a) * L;
                const x1 = cx + Math.cos(a) * L;
                const y1 = cy + Math.sin(a) * L;
                const grad = ctx.createLinearGradient(x0, y0, x1, y1);
                sortedStops().forEach(s => grad.addColorStop(s.pos / 100, s.color));
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            } else if (state.type === 'radial') {
                // radial centered
                const cx = w / 2, cy = h / 2;
                const maxr = Math.sqrt((w / 2) * (w / 2) + (h / 2) * (h / 2));
                // create radial gradient from center radius 0 to maxr
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxr);
                sortedStops().forEach(s => grad.addColorStop(s.pos / 100, s.color));
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            // download
            canvas.toBlob(blob => {
                if (!blob) { alert('Export failed'); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'background.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }, 'image/png');
        });

        // init
        renderStops();
        updatePreview();
        renderPresets();
        toggleUIForType();

        // helpers to split initial template stops (used by applyPreset)
        function splitTopLevel(s) {
            const out = []; let cur = '', depth = 0;
            for (let i = 0; i < s.length; i++) {
                const ch = s[i];
                if (ch === '(') depth++;
                else if (ch === ')') depth--;
                if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
                cur += ch;
            }
            if (cur.trim()) out.push(cur);
            return out.map(x => x.trim());
        }

        //  keyboard add stop with Enter on addStop
        addStopBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { addStopBtn.click(); }
        });
