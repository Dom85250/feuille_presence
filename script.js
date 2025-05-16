// =======================
// Fonctions utilitaires
// =======================
function normalize(str) {
  return str?.toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

// =======================
// Initialisation du canvas de signature
// =======================
function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  let drawing = false;

  function getX(e) {
    return (e.touches?.[0]?.clientX ?? e.clientX) - canvas.getBoundingClientRect().left;
  }

  function getY(e) {
    return (e.touches?.[0]?.clientY ?? e.clientY) - canvas.getBoundingClientRect().top;
  }

  function startDrawing(e) {
    e.preventDefault(); drawing = true;
    ctx.beginPath();
    ctx.moveTo(getX(e), getY(e));
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    ctx.lineTo(getX(e), getY(e));
    ctx.stroke();
  }

  function stopDrawing(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

// =======================
// Fermeture des modales
// =======================
function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// =======================
// Message de fin
// =======================
function afficherBoutonQuitter() {
  let message = document.getElementById('messageFin');
  if (!message) {
    message = document.createElement('p');
    message.id = 'messageFin';
    message.innerHTML = '✅ Toutes les signatures ont été enregistrées. Vous pouvez maintenant fermer cette page.';
    message.style.cssText = 'background-color:#d4edda;border-left:4px solid #28a745;padding:10px 12px;margin-top:20px;font-size:0.95em;color:#155724;font-weight:500;box-shadow:0 0 4px rgba(0,0,0,0.1)';
    document.body.appendChild(message);
  }
  message.style.display = 'block';
}

// =======================
// Variables globales
// =======================
let currentRow = null;
let currentCollectiveSignatureTarget = null;

// =======================
// Mise à jour des boutons
// =======================
function updateFormateurButtonState() {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  let tousSignes = true;
  rows.forEach(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire img');
    if (present && !signature) tousSignes = false;
  });

  const bouton = document.getElementById('formateurSignBtn');
  const consigne = document.getElementById('consigneFormateur');
  const collectiveBtn = document.getElementById('signAllBtn');

  bouton.disabled = !tousSignes;
  collectiveBtn.disabled = tousSignes;

  if (consigne) consigne.style.display = tousSignes ? 'none' : 'block';
}

// =======================
// Signature stagiaire individuelle
// =======================
function attachSignatureButtons() {
  document.querySelectorAll('.sign-btn').forEach(button => {
    button.onclick = (e) => {
      const row = e.target.closest('tr');
      if (!row.querySelector('.presence-checkbox').checked) return;
      currentRow = row;
      const nom = row.children[0].textContent;
      document.getElementById('stagiaireName').textContent = nom;
      clearCanvas('signatureCanvas');
      initSignatureCanvas('signatureCanvas');
      document.getElementById('signatureModal').style.display = 'flex';
    };
  });
}

// =======================
// Sauvegarde signature stagiaire
// =======================
document.getElementById('saveSignature').addEventListener('click', () => {
  const dataURL = document.getElementById('signatureCanvas').toDataURL();
  if (currentRow) {
    currentRow.querySelector('.signature-stagiaire').innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
    currentRow = null;
  }
  if (currentCollectiveSignatureTarget) {
    currentCollectiveSignatureTarget.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
    currentCollectiveSignatureTarget = null;
    document.getElementById('collectiveSignatureModal').style.display = 'flex';
  }
  closeModal();
  updateFormateurButtonState();
});

// =======================
// Signature collective
// =======================
document.getElementById('signAllBtn').addEventListener('click', () => {
  document.getElementById('signatureListContainer').innerHTML = '';
  document.getElementById('collectiveSignatureModal').style.display = 'flex';
});

document.getElementById('signInPerson').addEventListener('click', () => {
  const container = document.getElementById('signatureListContainer');
  container.innerHTML = '';
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  rows.forEach(row => {
    const nom = row.children[0].textContent;
    const present = row.querySelector('.presence-checkbox').checked;
    const signed = !!row.querySelector('.signature-stagiaire img');
    const bloc = document.createElement('div');
    bloc.className = 'bloc-stagiaire';
    bloc.style.cssText = 'border:1px solid #ccc;padding:10px;border-radius:6px;background:#f9f9f9;text-align:center;';

    bloc.innerHTML = `<p><strong>${nom}</strong></p><div class="signature-preview" style="margin-bottom:5px;"></div>`;

    const preview = bloc.querySelector('.signature-preview');

    if (!present) {
      preview.textContent = '❌ Absent';
    } else if (signed) {
      preview.innerHTML = row.querySelector('.signature-stagiaire').innerHTML;
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Signer';
      btn.onclick = () => {
        currentCollectiveSignatureTarget = preview;
        clearCanvas('signatureCanvas');
        initSignatureCanvas('signatureCanvas');
        document.getElementById('stagiaireName').textContent = nom;
        document.getElementById('collectiveSignatureModal').style.display = 'none';
        document.getElementById('signatureModal').style.display = 'flex';
      };
      bloc.appendChild(btn);
    }

    container.appendChild(bloc);
  });
});

// =======================
// Signature formateur
// =======================
document.getElementById('formateurSignBtn').addEventListener('click', () => {
  clearCanvas('formateurCanvas');
  initSignatureCanvas('formateurCanvas');
  document.getElementById('formateurName').textContent = document.getElementById('formateur')?.value || '';
  document.getElementById('formateurSignatureModal').style.display = 'flex';
});

document.getElementById('saveFormateurSignature').addEventListener('click', () => {
  const dataURL = document.getElementById('formateurCanvas').toDataURL();
  document.getElementById('formateurSignature').style.display = 'block';
  document.getElementById('formateurSignature').innerHTML = `<img src="${dataURL}" style="max-width:120px;" alt="Signature formateur"/>`;
  closeModal();
  afficherBoutonQuitter();
});

// =======================
// Ajout manuel de stagiaire
// =======================
document.getElementById('addStagiaireBtn').addEventListener('click', () => {
  const tbody = document.querySelector('#stagiairesTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td class="centered"><input type="checkbox" class="presence-checkbox" checked /></td>
    <td class="signature-stagiaire"></td>
    <td><button class="sign-btn">Signer en présentiel</button><button class="email-btn">Envoyer par mail</button></td>`;
  tbody.appendChild(tr);
  attachSignatureButtons();
  updateFormateurButtonState();
});

// =======================
// Import Excel
// =======================
document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const infoMap = {};
      for (let i = 0; i < 9; i++) {
        if (!rows[i] || rows[i].length < 2) continue;
        const key = normalize(rows[i][0]);
        const value = rows[i][1];
        if (key) infoMap[key] = value;
      }

      document.getElementById('intitule').value = infoMap['intituledeformation'] || '';
      document.getElementById('date').value = infoMap['date'] || '';
      document.getElementById('adresse').value = infoMap['lieu'] || '';
      document.getElementById('horaire').value = infoMap['horaire'] || '';
      document.getElementById('formateur').value = infoMap['formateur'] || '';

      const headerRowIndex = rows.findIndex(row => row?.some(cell => typeof cell === 'string' && normalize(cell).includes('stagiaire')));
      if (headerRowIndex === -1) return;

      const headers = rows[headerRowIndex].map(h => normalize(h));
      const stagiaires = rows.slice(headerRowIndex + 1);
      const tbody = document.querySelector('#stagiairesTable tbody');
      tbody.innerHTML = '';

      stagiaires.forEach(row => {
        if (!row || row.length < 2 || !row[0]) return;
        const data = {};
        headers.forEach((h, i) => data[h] = row[i] || '');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${data['stagiaire']}</td>
          <td>${data['email']}</td>
          <td class="centered"><input type="checkbox" class="presence-checkbox" checked /></td>
          <td class="signature-stagiaire"></td>
          <td>
            <button class="sign-btn">Signer en présentiel</button>
            <button class="email-btn">Envoyer par mail</button>
          </td>`;
        tbody.appendChild(tr);
      });

      document.getElementById('infoPresence').style.display = tbody.children.length > 0 ? 'block' : 'none';
      attachSignatureButtons();
      updateFormateurButtonState();
    } catch (err) {
      console.error("Erreur de lecture Excel:", err);
    }
  };
  reader.readAsArrayBuffer(file);
});

// =======================
// Modale collective déplaçable
// =======================
window.addEventListener('DOMContentLoaded', () => {
  const modalWrapper = document.getElementById('collectiveSignatureModal');
  const modal = modalWrapper?.querySelector('div');
  let isDragging = false, startX = 0, startY = 0, offsetX = 0, offsetY = 0;

  if (!modal) return;

  const header = document.createElement('div');
  header.textContent = '✥ Déplacer la fenêtre';
  header.style.cursor = 'move';
  header.style.background = '#003366';
  header.style.color = 'white';
  header.style.padding = '8px';
  header.style.borderTopLeftRadius = '8px';
  header.style.borderTopRightRadius = '8px';
  header.style.fontSize = '14px';
  header.style.userSelect = 'none';
  modal.insertBefore(header, modal.firstChild);

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    modal.style.position = 'absolute';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    modal.style.left = `${offsetX}px`;
    modal.style.top = `${offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
});
