// === MIŠLJENJE MJERENJA ===
// Automatski generira stručno mišljenje za svaki odušnik na temelju izmjerenih vrijednosti

(function () {

  // ─── Granične vrijednosti ──────────────────────────────────────────────────
  var LIMITS = {
    ch4: {
      low:    { val: 1,   label: 'nizak',  class: 'op-ok'   },
      medium: { val: 20,  label: 'srednji',class: 'op-warn' },
      high:   { val: 40,  label: 'visok',  class: 'op-bad'  },
      // Kategorije
      explosive_low:  1,    // >1% = blizu LFL (donja eksplozivna granica)
      explosive_high: 5,    // >5% LFL u zraku = opasnost
    },
    co2: {
      low:  5,   // <5% = niska bioplinska aktivnost
      high: 50,  // >50% = neuobičajeno visok
    },
    o2: {
      aerobic: 10,  // >10% = aerobna zona ili propuštanje
      safe:    5,   // <5% = normalno za aktivnu zonu
    },
    h2s: {
      warning:    10,   // >10 ppm = upozorenje
      danger:     50,   // >50 ppm = IDLH granica
      evacuation: 100,  // >100 ppm = odmah evakuacija
    },
    h2: {
      low:    5,    // <5 ppm = normalno
      medium: 50,   // >50 ppm = svježi otpad
      high:   200,  // >200 ppm = povišeno
    },
    temp: {
      low:  20,   // <20°C = niska aktivnost
      high: 55,   // >55°C = termofazna faza ili gorenje
    }
  };

  // ─── Generiranje mišljenja za jedan odušnik ───────────────────────────────
  function generateVentOpinion(vent) {
    if (vent.status === 'not_measurable') {
      return {
        level: 'info',
        text: 'Mjerenje na predmetnoj mjernoj točki nije provedeno.' + (vent.note ? ' Napomena: ' + vent.note : '')
      };
    }

    var findings = [];  // zapažanja
    var warnings = [];  // upozorenja
    var dangers  = [];  // opasnosti
    var summary  = [];  // sažetak stanja
    var level    = 'ok';

    var ch4 = vent.ch4 !== '' && vent.ch4 != null ? parseFloat(vent.ch4) : null;
    var co2 = vent.co2 !== '' && vent.co2 != null ? parseFloat(vent.co2) : null;
    var o2  = vent.o2  !== '' && vent.o2  != null ? parseFloat(vent.o2)  : null;

    // ── CH₄ analiza ──
    if (ch4 !== null) {
      if (ch4 < 1) {
        findings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol., što ukazuje na odsutnost ili zanemarive količine odlagališnog bioplina na predmetnoj mjernoj točki.');
      } else if (ch4 >= 1 && ch4 < 5) {
        warnings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol. i prelazi prag od 1% vol. Navedena vrijednost se nalazi ispod donje granice eksplozivnosti (LEL = 5% vol.), međutim prisutnost metana zahtijeva pojačan oprez i eliminaciju potencijalnih izvora paljenja na mjernoj lokaciji.');
        level = 'warn';
      } else if (ch4 >= 5 && ch4 < 15) {
        warnings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol. i nalazi se unutar eksplozivnog raspona (LEL–UEL: 5–15% vol. u zraku). Na mjernoj lokaciji potrebno je zabraniti upotrebu otvorenog plamena, iskrenje te korištenje električne opreme koja nije protueksplozivno zaštićena (Ex).');
        level = 'warn';
      } else if (ch4 >= 15 && ch4 < 40) {
        findings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol., što upućuje na umjerenu produkciju odlagališnog bioplina. Anaerobni procesi razgradnje organske tvari su aktivni, međutim bioplin još nije postigao uravnotežen sastav karakterističan za razvijenu fazu metanogeneze.');
      } else if (ch4 >= 40 && ch4 <= 65) {
        findings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol., što odgovara tipičnom sastavu odlagališnog bioplina (40–65% vol.). Anaerobna metanogeneza odvija se u normalnim uvjetima.');
      } else if (ch4 > 65) {
        warnings.push('Izmjerena koncentracija metana (CH₄) iznosi ' + ch4 + '% vol. i premašuje uobičajeni raspon za odlagališni bioplin. Preporučuje se provjera ispravnosti i kalibracije mjernog uređaja, kao i isključivanje mogućnosti dotoka plina iz vanjskog izvora.');
        level = 'warn';
      }
    }

    // ── CO₂ analiza ──
    if (co2 !== null) {
      if (co2 < 5) {
        findings.push('Izmjerena koncentracija ugljičnog dioksida (CO₂) iznosi ' + co2 + '% vol., što ukazuje na slabu mikrobiološku aktivnost ili rano razvojno stadij odlagalnog tijela s nedovoljno razvijenim anaerobnim procesima razgradnje.');
      } else if (co2 >= 5 && co2 <= 50) {
        findings.push('Izmjerena koncentracija ugljičnog dioksida (CO₂) iznosi ' + co2 + '% vol. i nalazi se unutar normalnog raspona za odlagalište otpada.');
      } else if (co2 > 50) {
        warnings.push('Izmjerena koncentracija ugljičnog dioksida (CO₂) iznosi ' + co2 + '% vol. i premašuje uobičajene vrijednosti. Potrebno je provesti dodatnu analizu radi utvrđivanja uzroka povišene koncentracije CO₂.');
        level = 'warn';
      }
    }

    // ── O₂ analiza ──
    if (o2 !== null) {
      if (o2 <= 2) {
        findings.push('Izmjerena koncentracija kisika (O₂) iznosi ' + o2 + '% vol., što potvrđuje prevladavajuće anaerobne uvjete na mjernoj točki, karakteristične za aktivne zone odlaganja komunalnog otpada.');
      } else if (o2 > 2 && o2 <= 5) {
        findings.push('Izmjerena koncentracija kisika (O₂) iznosi ' + o2 + '% vol., što ukazuje na blagu infiltraciju atmosferskog zraka. Preporučuje se provjera brtvljenja odušnika i integriteta pokrovnog sloja.');
      } else if (o2 > 5 && o2 <= 10) {
        warnings.push('Izmjerena koncentracija kisika (O₂) iznosi ' + o2 + '% vol., što upućuje na prisutnost aerobnih uvjeta ili značajno propuštanje atmosferskog zraka. Potrebna je provjera integriteta odušnika, spojeva i okolnog pokrovnog materijala.');
        level = 'warn';
      } else if (o2 > 10) {
        warnings.push('Izmjerena koncentracija kisika (O₂) iznosi ' + o2 + '% vol., što ukazuje na dominantno aerobne uvjete ili izraženu infiltraciju zraka. Na ovoj mjernoj točki produkcija odlagališnog bioplina je zanemariva ili odsutna.');
        level = 'warn';
      }

      // CH₄ + O₂ korelacija — eksplozivni uvjeti
      if (ch4 !== null && ch4 > 5 && ch4 < 15 && o2 > 5) {
        dangers.push('Istovremena prisutnost metana (CH₄ = ' + ch4 + '% vol.) i kisika (O₂ = ' + o2 + '% vol.) rezultira potencijalno eksplozivnom smjesom plina i zraka. Izmjereni sastav nalazi se unutar eksplozivnog raspona. Na mjernoj lokaciji zabraniti svaki izvor paljenja te poduzeti mjere prisilne ventilacije.');
        level = 'danger';
      }
    }

    // ── CH₄ + CO₂ omjer ──
    if (ch4 !== null && co2 !== null && ch4 > 5 && co2 > 5) {
      var ratio = ch4 / co2;
      if (ratio >= 1.2 && ratio <= 2.0) {
        findings.push('Omjer CH₄/CO₂ iznosi ' + ratio.toFixed(2) + ', što je sukladno tipičnom sastavu odlagališnog bioplina.');
      } else if (ratio > 2.0) {
        warnings.push('Omjer CH₄/CO₂ iznosi ' + ratio.toFixed(2) + ' i premašuje uobičajene vrijednosti za odlagališni bioplin. Preporučuje se isključivanje mogućnosti dotoka zemnog plina ili drugog vanjskog izvora metana.');
        if (level === 'ok') level = 'warn';
      } else if (ratio < 1.0) {
        findings.push('Omjer CH₄/CO₂ iznosi ' + ratio.toFixed(2) + ', što ukazuje na neuravnotežen sastav bioplina — anaerobna razgradnja organske tvari nije dostigla optimalnu fazu metanogeneze.');
      }
    }

    // ── Ukupno mišljenje ──
    var totalFindings = findings.length + warnings.length + dangers.length;
    if (totalFindings === 0) {
      summary.push('Za predmetnu mjernu točku nije moguće izraditi analizu uslijed nedostatka izmjerenih vrijednosti (CH₄, CO₂, O₂).');
      level = 'info';
    } else {
      if (level === 'ok') {
        summary.push('Izmjerene koncentracije plinova na predmetnoj mjernoj točki nalaze se unutar uobičajenih granica. Nije utvrđena prisutnost nepravilnosti.');
      } else if (level === 'warn') {
        summary.push('Na predmetnoj mjernoj točki utvrđene su povišene vrijednosti koje odstupaju od uobičajenih granica i zahtijevaju pozornost.');
      } else if (level === 'danger') {
        summary.push('Na predmetnoj mjernoj točki utvrđene su kritične vrijednosti. Potrebno je hitno poduzeti odgovarajuće mjere zaštite.');
      }
    }

    return {
      level:    level,
      summary:  summary,
      findings: findings,
      warnings: warnings,
      dangers:  dangers
    };
  }

  // ─── Generiranje punog mišljenja za mjerenje ──────────────────────────────
  function generateMeasurementOpinion(m) {
    if (!m || !m.vents || m.vents.length === 0) {
      return '<p style="color:#aaa;text-align:center;padding:20px;">Nema izmjerenih odušnika za analizu.</p>';
    }

    var html = '';

    m.vents.forEach(function (vent) {
      var op = generateVentOpinion(vent);

      var headerColor = op.level === 'danger' ? '#c62828' :
                        op.level === 'warn'   ? '#e65100' :
                        op.level === 'info'   ? '#546e7a' : '#2e7d32';
      var headerIcon  = op.level === 'danger' ? '🚨' :
                        op.level === 'warn'   ? '⚠️' :
                        op.level === 'info'   ? 'ℹ️' : '✅';
      var bgColor     = op.level === 'danger' ? 'rgba(198,40,40,0.06)' :
                        op.level === 'warn'   ? 'rgba(230,81,0,0.06)'  :
                        op.level === 'info'   ? 'rgba(84,110,122,0.06)': 'rgba(46,125,50,0.06)';

      html += '<div style="border:1px solid ' + headerColor + ';border-radius:10px;margin-bottom:14px;overflow:hidden;">';

      // Header odušnika
      html += '<div style="background:' + headerColor + ';color:white;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">';
      html += '<strong style="font-size:15px;">' + headerIcon + ' ' + (vent.name || 'Odušnik') + '</strong>';

      // Izmjerene vrijednosti u headeru
      var vals = [];
      if (vent.ch4 != null && vent.ch4 !== '') vals.push('CH₄ ' + vent.ch4 + '%');
      if (vent.co2 != null && vent.co2 !== '') vals.push('CO₂ ' + vent.co2 + '%');
      if (vent.o2  != null && vent.o2  !== '') vals.push('O₂ '  + vent.o2  + '%');
      html += '<span style="font-size:11px;opacity:0.9;">' + vals.join(' · ') + '</span>';
      html += '</div>';

      // Tijelo
      html += '<div style="padding:12px 14px;background:' + bgColor + ';">';

      // Status za ne može se izmjeriti
      if (vent.status === 'not_measurable') {
        html += '<p style="color:#546e7a;margin:0;">' + op.text + '</p>';
        html += '</div></div>';
        return;
      }

      // Sažetak
      op.summary.forEach(function (s) {
        html += '<p style="margin:0 0 8px 0;font-weight:600;color:' + headerColor + ';">' + s + '</p>';
      });

      // Opasnosti
      op.dangers.forEach(function (d) {
        html += '<div style="background:#ffebee;border-left:3px solid #c62828;padding:8px 10px;border-radius:4px;margin-bottom:6px;font-size:13px;color:#b71c1c;">' + d + '</div>';
      });

      // Upozorenja
      op.warnings.forEach(function (w) {
        html += '<div style="background:#fff3e0;border-left:3px solid #e65100;padding:8px 10px;border-radius:4px;margin-bottom:6px;font-size:13px;color:#bf360c;">' + w + '</div>';
      });

      // Zapažanja
      if (op.findings.length > 0) {
        html += '<ul style="margin:6px 0 0 0;padding-left:18px;font-size:13px;color:var(--text-color,#333);">';
        op.findings.forEach(function (f) {
          html += '<li style="margin-bottom:3px;">' + f + '</li>';
        });
        html += '</ul>';
      }

      // Napomena odušnika
      if (vent.note && vent.note.trim()) {
        html += '<p style="margin:8px 0 0 0;font-size:12px;color:#888;font-style:italic;">📝 ' + vent.note + '</p>';
      }

      html += '</div></div>';
    });

    return html;
  }

  // ─── Modal ────────────────────────────────────────────────────────────────
  function injectModal() {
    if (document.getElementById('opinion-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'opinion-modal';
    modal.style.cssText = [
      'display:none',
      'position:fixed',
      'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.65)',
      'z-index:8500',
      'align-items:flex-start',
      'justify-content:center',
      'overflow-y:auto',
      'padding:20px 10px'
    ].join(';');

    modal.innerHTML =
      '<div style="background:var(--card-bg,#fff);border-radius:14px;padding:0;max-width:720px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,0.3);overflow:hidden;">' +

        // Header
        '<div style="background:linear-gradient(135deg,#2e7d32,#4caf50);padding:16px 18px;display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div>' +
            '<div id="opinion-title" style="font-weight:700;font-size:17px;color:white;"></div>' +
            '<div id="opinion-subtitle" style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:3px;"></div>' +
          '</div>' +
          '<button id="opinion-close-btn" style="background:none;border:none;font-size:26px;cursor:pointer;color:rgba(255,255,255,0.8);line-height:1;padding:0;margin-left:10px;">✕</button>' +
        '</div>' +

        // Legenda
        '<div style="display:flex;gap:10px;flex-wrap:wrap;padding:12px 18px 0 18px;font-size:12px;">' +
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:#2e7d32;border-radius:3px;display:inline-block;"></span> Uredno</span>' +
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:#e65100;border-radius:3px;display:inline-block;"></span> Upozorenje</span>' +
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:#c62828;border-radius:3px;display:inline-block;"></span> Kritično</span>' +
          '<span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:#546e7a;border-radius:3px;display:inline-block;"></span> Nije izmjereno</span>' +
        '</div>' +

        // Sadržaj
        '<div id="opinion-content" style="padding:14px 18px 18px 18px;max-height:calc(100vh - 200px);overflow-y:auto;"></div>' +

      '</div>';

    document.body.appendChild(modal);

    document.getElementById('opinion-close-btn').addEventListener('click', closeOpinionModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeOpinionModal();
    });
  }

  function openOpinionModal(idx) {
    var measurements = window.loadMeasurements ? window.loadMeasurements() : [];
    var m = measurements[idx];
    if (!m) return;

    document.getElementById('opinion-title').textContent = (m.landfill && m.landfill.name) || 'Mjerenje';
    document.getElementById('opinion-subtitle').textContent =
      (m.date || '') +
      (m.startTime ? ' · ' + m.startTime : '') +
      (m.measurer  ? ' · ' + m.measurer  : '') +
      (m.device    ? ' · ' + m.device    : '');

    document.getElementById('opinion-content').innerHTML = generateMeasurementOpinion(m);

    var modal = document.getElementById('opinion-modal');
    modal.style.display = 'flex';
    // Scroll na vrh
    setTimeout(function () {
      document.getElementById('opinion-content').scrollTop = 0;
      modal.scrollTop = 0;
    }, 50);
  }

  window.openOpinionModal = openOpinionModal;

  function closeOpinionModal() {
    document.getElementById('opinion-modal').style.display = 'none';
  }

  // ─── Dodavanje gumba u kartice ────────────────────────────────────────────
  function patchHistoryList() {
    var orig = window.updateHistoryList;
    if (!orig) { setTimeout(patchHistoryList, 300); return; }
    window.updateHistoryList = function (filtered) {
      orig.call(this, filtered);
      setTimeout(addOpinionButtons, 150);
    };
  }

  function addOpinionButtons() {
    var allM = window.loadMeasurements ? window.loadMeasurements() : [];
    var items = document.querySelectorAll('#history-list .history-item');
    items.forEach(function (item) {
      if (item.querySelector('.opinion-btn')) return;
      var btnGroup = item.querySelector('.button-group');
      if (!btnGroup) return;

      // Pronađi pravi index
      var h3 = item.querySelector('h3');
      var ps = item.querySelectorAll('p');
      var name = h3 ? h3.textContent.trim() : '';
      var dateText = '';
      ps.forEach(function (p) {
        if (p.textContent.includes('Datum:')) {
          dateText = p.textContent.replace('Datum:', '').trim();
        }
      });
      var realIdx = allM.findIndex(function (m) {
        return m.landfill && m.landfill.name === name && m.date === dateText;
      });
      if (realIdx < 0) return;

      var btn = document.createElement('button');
      btn.className = 'opinion-btn';
      btn.style.cssText = 'background:#6a1b9a;font-size:13px;padding:8px 12px;flex:1;border-radius:6px;color:white;border:none;cursor:pointer;';
      btn.textContent = '📝 Mišljenje';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openOpinionModal(realIdx);
      });
      btnGroup.appendChild(btn);
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    injectModal();
    patchHistoryList();
  });

})();
