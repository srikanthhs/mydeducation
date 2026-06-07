/* =========================================================
   MYDEDUCATION DASHBOARD — SHARED ENHANCEMENTS
   Covers: Export, Filters, Breadcrumbs, Global Search,
           Mobile, Last Updated, Sorting, Consistent UI
   ========================================================= */

/* ── 1. BREADCRUMB ──────────────────────────────────────── */
var _SECTION_LABELS = {
  ov:'Overview', sc:'School Analysis', co:'Community & Gender',
  st:'Subject Streams', sb:'Subject Analysis', tc:'Teacher Analysis',
  rk:'Full Rankings', rp:'Reports', fa:'Failure Analysis', tr:'Teachers'
};
function updateBreadcrumb(secId){
  var el = document.getElementById('breadcrumb');
  if(!el) return;
  var label = _SECTION_LABELS[secId] || secId;
  el.innerHTML =
    '<span class="bc-home" onclick="go(\'ov\',document.querySelector(\'.ni\'))">'+
    '<span class="mi material-icons-round" style="font-size:14px;vertical-align:-3px">home</span> Home</span>'+
    (secId!=='ov' ? ' <span class="bc-sep">›</span> <span class="bc-cur">'+label+'</span>' : '');
}

/* ── 2. LAST UPDATED TIMESTAMP ──────────────────────────── */
function stampSection(secId){
  var el = document.getElementById('lu-'+secId);
  if(!el) return;
  var now = new Date();
  el.textContent = 'Data: March 2026  •  Page loaded: '
    + now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
    + ' ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}
function stampAll(){
  Object.keys(_SECTION_LABELS).forEach(function(id){ stampSection(id); });
}

/* ── 3. UNIVERSAL TABLE EXPORT ──────────────────────────── */
function _tableToRows(tbl){
  var rows = [];
  tbl.querySelectorAll('thead tr').forEach(function(tr){
    rows.push(Array.from(tr.querySelectorAll('th')).map(function(th){
      return th.innerText.replace(/[↑↓⇅]/g,'').trim();
    }));
  });
  tbl.querySelectorAll('tbody tr').forEach(function(tr){
    rows.push(Array.from(tr.querySelectorAll('td')).map(function(td){
      return td.innerText.trim();
    }));
  });
  return rows;
}

function exportTableCSV(tableId, filename){
  var tbl = document.getElementById(tableId);
  if(!tbl){ alert('Table not found: '+tableId); return; }
  var rows = _tableToRows(tbl);
  var csv = rows.map(function(r){
    return r.map(function(v){ return '"'+(v+'').replace(/"/g,'""')+'"'; }).join(',');
  }).join('\r\n');
  var blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (filename||'export')+'_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
}

function exportTableXLSX(tableId, filename){
  if(typeof XLSX === 'undefined'){ alert('Excel library not loaded'); return; }
  var tbl = document.getElementById(tableId);
  if(!tbl){ alert('Table not found: '+tableId); return; }
  var rows = _tableToRows(tbl);
  var ws = XLSX.utils.aoa_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, (filename||'export')+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
}

function exportSectionPDF(secId){
  var sec = document.getElementById('s-'+secId);
  if(!sec) return;
  var label = _SECTION_LABELS[secId]||secId;
  var clone = sec.cloneNode(true);
  var win = window.open('','_blank','width=1000,height=700');
  win.document.write(
    '<html><head><title>'+label+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet"/>'+
    '<style>body{font-family:Roboto,sans-serif;padding:24px;font-size:.82rem;color:#212121}'+
    'table{width:100%;border-collapse:collapse;margin-bottom:16px}'+
    'thead th{background:#1565C0;color:#fff;padding:6px 10px;text-align:left;font-size:.75rem}'+
    'tbody td{padding:5px 10px;border-bottom:1px solid #eee}'+
    'h2{color:#1565C0;margin-bottom:4px}'+
    '.print-hide{display:none!important}'+
    '@media print{button{display:none}}</style></head><body>'+
    '<h2>Mayiladuthurai Education Dashboard — '+label+'</h2>'+
    '<p style="font-size:.75rem;color:#888;margin-bottom:16px">March 2026 | Printed: '+new Date().toLocaleString('en-IN')+'</p>'+
    '<div id="content"></div>'+
    '</body></html>'
  );
  win.document.getElementById('content').appendChild(clone);
  win.document.close();
  setTimeout(function(){ win.print(); }, 600);
}

/* ── 4. GLOBAL SEARCH ───────────────────────────────────── */
var _gsTimer = null;
function globalSearch(q){
  clearTimeout(_gsTimer);
  _gsTimer = setTimeout(function(){
    q = (q||'').toLowerCase().trim();
    var panel = document.getElementById('gs-panel');
    if(!q){ if(panel) panel.style.display='none'; return; }

    // Search school tables
    var hits = [];
    document.querySelectorAll('tbody tr').forEach(function(tr){
      var txt = tr.innerText.toLowerCase();
      if(txt.indexOf(q) !== -1){
        var sec = tr.closest('sec');
        var secId = sec ? sec.id.replace('s-','') : '';
        var label = _SECTION_LABELS[secId]||secId;
        var firstCell = tr.querySelector('td:nth-child(2)');
        if(firstCell && hits.length < 12){
          hits.push({label:label, secId:secId, text:firstCell.innerText.trim().slice(0,60)});
        }
      }
    });

    if(!panel){
      panel = document.createElement('div');
      panel.id = 'gs-panel';
      panel.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:#fff;border-radius:0 0 10px 10px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:200;max-height:320px;overflow-y:auto;border:1px solid #E0E0E0;border-top:none';
      var wrapper = document.getElementById('gs-wrap');
      if(wrapper) { wrapper.style.position='relative'; wrapper.appendChild(panel); }
    }
    panel.style.display = 'block';
    if(hits.length === 0){
      panel.innerHTML = '<div style="padding:14px 16px;font-size:.82rem;color:#9E9E9E">No results found for "'+q+'"</div>';
    } else {
      panel.innerHTML = hits.map(function(h){
        return '<div onclick="go(\''+h.secId+'\',null);document.getElementById(\'gs-inp\').value=\'\';document.getElementById(\'gs-panel\').style.display=\'none\'" '+
          'style="padding:10px 16px;cursor:pointer;border-bottom:1px solid #F5F7FA;display:flex;gap:10px;align-items:center" '+
          'onmouseover="this.style.background=\'#F0F4FF\'" onmouseout="this.style.background=\'#fff\'">'+
          '<span class="mi material-icons-round" style="font-size:16px;color:#1565C0">search</span>'+
          '<div><div style="font-size:.82rem;font-weight:500">'+h.text+'</div>'+
          '<div style="font-size:.71rem;color:#9E9E9E">'+h.label+'</div></div></div>';
      }).join('');
    }
  }, 250);
}

function closeGS(){ var p=document.getElementById('gs-panel'); if(p) p.style.display='none'; }

/* ── 5. SECTION FILTER HELPERS ──────────────────────────── */
function filterTable(tableId, inputIds, colMap){
  var tbl = document.getElementById(tableId);
  if(!tbl) return;
  var filters = inputIds.map(function(id){
    var el = document.getElementById(id);
    return el ? (el.value||'').toLowerCase().trim() : '';
  });
  var shown = 0;
  tbl.querySelectorAll('tbody tr').forEach(function(tr){
    var cells = tr.querySelectorAll('td');
    var pass = filters.every(function(fval, fi){
      if(!fval) return true;
      var col = colMap[fi];
      if(col === -1){
        return tr.innerText.toLowerCase().indexOf(fval) !== -1;
      }
      var cell = cells[col];
      return cell && cell.innerText.toLowerCase().indexOf(fval) !== -1;
    });
    tr.style.display = pass ? '' : 'none';
    if(pass) shown++;
  });
  return shown;
}

/* ── 6. SORTABLE TABLE HELPER ───────────────────────────── */
var _sortState = {};
function sortTable(tableId, colIdx, isNum){
  var key = tableId+'_'+colIdx;
  var asc = !_sortState[key];
  _sortState[key] = asc;

  var tbl = document.getElementById(tableId);
  if(!tbl) return;

  var th = tbl.querySelectorAll('thead th')[colIdx];
  tbl.querySelectorAll('thead th').forEach(function(t){ t.classList.remove('sa','sd'); });
  if(th) th.classList.add(asc?'sa':'sd');

  var tbody = tbl.querySelector('tbody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort(function(a,b){
    var va = a.querySelectorAll('td')[colIdx] ? a.querySelectorAll('td')[colIdx].innerText.trim() : '';
    var vb = b.querySelectorAll('td')[colIdx] ? b.querySelectorAll('td')[colIdx].innerText.trim() : '';
    if(isNum){
      va = parseFloat(va.replace(/[^0-9.\-]/g,''))||0;
      vb = parseFloat(vb.replace(/[^0-9.\-]/g,''))||0;
      return asc ? va-vb : vb-va;
    }
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  rows.forEach(function(r){ tbody.appendChild(r); });
}

/* ── 7. MOBILE SIDEBAR TOGGLE ───────────────────────────── */
function initMobileMenu(){
  var hamBtn = document.getElementById('ham-btn');
  if(!hamBtn) return;
  hamBtn.addEventListener('click', function(){
    var sb = document.getElementById('sb');
    if(sb) sb.classList.toggle('sb-open');
  });
  document.addEventListener('click', function(e){
    var sb = document.getElementById('sb');
    if(!sb) return;
    if(!sb.contains(e.target) && e.target.id !== 'ham-btn'){
      sb.classList.remove('sb-open');
    }
  });
}

/* ── 8. SECTION EXPORT TOOLBAR BUILDER ─────────────────── */
function buildExportBar(secId, tableId, filename){
  var container = document.getElementById('exp-bar-'+secId);
  if(!container) return;
  container.innerHTML =
    '<button class="btn-exp btn-xls" onclick="exportTableXLSX(\''+tableId+'\',\''+filename+'\')">'+
    '<span class="mi material-icons-round" style="font-size:15px">table_chart</span>Excel</button>'+
    '<button class="btn-exp btn-csv2" onclick="exportTableCSV(\''+tableId+'\',\''+filename+'\')">'+
    '<span class="mi material-icons-round" style="font-size:15px">download</span>CSV</button>'+
    '<button class="btn-exp btn-pdf2" onclick="exportSectionPDF(\''+secId+'\')">'+
    '<span class="mi material-icons-round" style="font-size:15px">picture_as_pdf</span>PDF</button>';
}

/* ── 9. COMMUNITY TABLE FILTER ──────────────────────────── */
function filterCommunity(){
  var q = (document.getElementById('co-search')||{}).value||'';
  var gender = (document.getElementById('co-gen-f')||{}).value||'';
  var tbl = document.getElementById('com-tb');
  if(!tbl) return;
  var shown = 0;
  tbl.querySelectorAll('tr').forEach(function(tr){
    var txt = tr.innerText.toLowerCase();
    var pass = txt.indexOf(q.toLowerCase()) !== -1;
    if(gender){
      var genCell = tr.querySelector('td:nth-child(6)');
      if(genCell) pass = pass && genCell.innerText.toLowerCase().indexOf(gender.toLowerCase()) !== -1;
    }
    tr.style.display = pass ? '' : 'none';
    if(pass) shown++;
  });
  var cnt = document.getElementById('co-cnt');
  if(cnt) cnt.textContent = shown+' communities';
}

/* ── 10. INIT ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function(){
  initMobileMenu();
  stampAll();

  // Close global search on outside click
  document.addEventListener('click', function(e){
    if(e.target.id !== 'gs-inp') closeGS();
  });

  // Build export bars for sections with simple tables
  setTimeout(function(){
    buildExportBar('sc','sct','School_Analysis');
    buildExportBar('rk','t-all','Top_Rankings');
    buildExportBar('co','com-tb','Community_Analysis');
    buildExportBar('st','str-tb','Streams_Analysis');
    buildExportBar('fa','fa-tbl','Failure_Analysis');
    buildExportBar('tr','tr-subj-tbl','Teacher_Rankings');
  }, 800);
});

/* Patch the go() navigation to also update breadcrumb + stamp */
(function(){
  var _origGo;
  function patchGo(){
    if(typeof go !== 'undefined'){
      _origGo = go;
      go = function(id, el){
        _origGo(id, el);
        updateBreadcrumb(id);
        stampSection(id);
      };
    } else {
      setTimeout(patchGo, 100);
    }
  }
  patchGo();
})();
