import sys

with open('ui.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add Sorpréndeme Button
btn_code = """
      const autoDraftBtn = document.createElement('button');
      autoDraftBtn.className = 'btn btn-secondary';
      autoDraftBtn.innerHTML = '🎲 ¡Sorpréndeme! (Auto-Completar)';
      autoDraftBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 11px;';
      autoDraftBtn.onclick = () => {
        while (G.draftRound <= 9) {
          const picks = G.getDraftRoundPicks();
          // Sort by OVR descending
          picks.sort((a,b) => {
             const ovrA = Math.round((a.con||40)*.3+(a.pwr||35)*.3+(a.spd||45)*.15+(a.def||40)*.15+(a.eye||40)*.1);
             const ovrB = Math.round((b.con||40)*.3+(b.pwr||35)*.3+(b.spd||45)*.15+(b.def||40)*.15+(b.eye||40)*.1);
             return ovrB - ovrA;
          });
          G.draftPickPlayer(picks[0]);
        }
        renderFinalLineupConfirmation();
      };
      centerPanel.appendChild(autoDraftBtn);
"""
# Insert after centerPanel.appendChild(pickHint);
target = "centerPanel.appendChild(pickHint);"
idx = js.find(target)
if idx != -1:
    js = js[:idx + len(target)] + btn_code + js[idx + len(target):]
else:
    print("Could not find pickHint insertion point")


# 2. Replace up/down arrows with drag&drop + Add Auto-Sort Button
target_html = """
      orderPanel.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#f59e0b;margin-bottom:12px;text-align:center;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;">
          <span>⚔️ ORDEN AL BATE</span>
          <button class="btn btn-secondary" id="btn-auto-sort" style="padding:4px 8px;font-size:8px;cursor:pointer;">🤖 AUTO-ORDEN</button>
        </div>
      `;
"""
target2 = "orderPanel.innerHTML = `"
idx2 = js.find(target2, js.find('const orderPanel = document.createElement(\'div\');', js.find('function renderFinalLineupConfirmation')))
if idx2 != -1:
    end2 = js.find("`;", idx2) + 2
    js = js[:idx2] + target_html + js[end2:]
    
    auto_sort_logic = """
      setTimeout(() => {
        const btnAuto = document.getElementById('btn-auto-sort');
        if(btnAuto) {
           btnAuto.onclick = () => {
             const players = G.draftBattingOrder.map(slot => ({slot: slot, p: G.draftRoster[slot]}));
             const emptySlots = players.filter(x => !x.p).map(x => x.slot);
             let pool = players.filter(x => x.p).map(x => {
                const p = x.p;
                p.ovr = Math.round((p.con||40)*.3+(p.pwr||35)*.3+(p.spd||45)*.15+(p.def||40)*.15+(p.eye||40)*.1);
                return {slot: x.slot, p: p};
             });
             
             let newOrder = [];
             // 1: Max SPD
             if (pool.length > 0) { pool.sort((a,b) => (b.p.spd||0) - (a.p.spd||0)); newOrder.push(pool.shift().slot); }
             // 2: Max CON
             if (pool.length > 0) { pool.sort((a,b) => (b.p.con||0) - (a.p.con||0)); newOrder.push(pool.shift().slot); }
             // 3: Max OVR
             if (pool.length > 0) { pool.sort((a,b) => b.p.ovr - a.p.ovr); newOrder.push(pool.shift().slot); }
             // 4: Max PWR
             if (pool.length > 0) { pool.sort((a,b) => (b.p.pwr||0) - (a.p.pwr||0)); newOrder.push(pool.shift().slot); }
             // 5: Max PWR
             if (pool.length > 0) { pool.sort((a,b) => (b.p.pwr||0) - (a.p.pwr||0)); newOrder.push(pool.shift().slot); }
             // Rest by OVR
             pool.sort((a,b) => b.p.ovr - a.p.ovr);
             while(pool.length > 0) { newOrder.push(pool.shift().slot); }
             
             G.draftBattingOrder = newOrder.concat(emptySlots);
             renderConfirmationBattingRows();
           };
        }
      }, 0);
"""
    insert_pos2 = js.find("function renderConfirmationBattingRows()", idx2)
    js = js[:insert_pos2] + auto_sort_logic + js[insert_pos2:]

# Now replace the up/down arrows with Drag&Drop
search_arrows = """<div style="display:flex;flex-direction:column;gap:2px;">
                <button class="bo-up" data-idx="${idx}" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:1px 6px;font-size:9px;border-radius:3px;cursor:pointer;">▲</button>
                <button class="bo-dn" data-idx="${idx}" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:1px 6px;font-size:9px;border-radius:3px;cursor:pointer;">▼</button>
              </div>"""
js = js.replace(search_arrows, "")

# And attach drag and drop to the bo-row
search_listeners = "orderPanel.querySelectorAll('.bo-up').forEach(btn => {"
idx3 = js.find(search_listeners)
if idx3 != -1:
    end3 = js.find("});", js.find("orderPanel.querySelectorAll('.bo-dn').forEach", idx3)) + 4
    
    drag_logic = """
        // Drag and drop for batting order
        const rows = orderPanel.querySelectorAll('.bo-row');
        rows.forEach((row, rIdx) => {
          row.setAttribute('draggable', 'true');
          row.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', rIdx.toString());
            row.style.opacity = '0.5';
          });
          row.addEventListener('dragend', () => {
            row.style.opacity = '1';
          });
          row.addEventListener('dragover', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(255,255,255,0.1)';
          });
          row.addEventListener('dragleave', (e) => {
            row.style.background = 'rgba(0,0,0,0.25)';
          });
          row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.style.background = 'rgba(0,0,0,0.25)';
            const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (!isNaN(sourceIdx) && sourceIdx !== rIdx) {
              const temp = G.draftBattingOrder[rIdx];
              G.draftBattingOrder[rIdx] = G.draftBattingOrder[sourceIdx];
              G.draftBattingOrder[sourceIdx] = temp;
              renderConfirmationBattingRows();
            }
          });
        });
"""
    js = js[:idx3] + drag_logic + js[end3:]
else:
    print("Could not find up/down listeners")

with open('ui.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("ui.js updated successfully.")
