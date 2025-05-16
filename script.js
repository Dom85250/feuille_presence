// =======================
// Fonctions utilitaires
// =======================
function normalize(str) {
  return str?.toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}
// =======================
// Initialisation du canvas de signature (précise souris & tactile)
// =======================
function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // Réinitialise l’arrière-plan en blanc
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
  }

  // Supprime les anciens écouteurs éventuels
  canvas.replaceWith(canvas.cloneNode(true));
  const cleanCanvas = document.getElementById(canvasId);
  cleanCanvas.addEventListener('mousedown', start);
  cleanCanvas.addEventListener('mousemove', move);
  cleanCanvas.addEventListener('mouseup', end);
  cleanCanvas.addEventListener('mouseout', end);
  cleanCanvas.addEventListener('touchstart', start, { passive: false });
  cleanCanvas.addEventListener('touchmove', move, { passive: false });
  cleanCanvas.addEventListener('touchend', end);
}

// =======================
// Nettoyage du canvas
// =======================
function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// =======================
// Réinitialisation des modales (non déplaçables)
// =======================

function closeModal() {
  document.getElementById('signatureModal').style.display = 'none';
  document.getElementById('formateurSignatureModal').style.display = 'none';
  document.getElementById('collectiveSignatureModal').style.display = 'none';
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
document.getElementById('addStagiaireBtn').disabled = true;
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
// Association des boutons "Signer en présentiel"
// =======================

function attachSignatureButtons() {
  document.querySelectorAll('.sign-btn').forEach(button => {
    button.onclick = (e) => {
      const row = e.target.closest('tr');
      const checkbox = row.querySelector('.presence-checkbox');
      if (!checkbox?.checked) {
        alert("Ce stagiaire est absent et ne peut pas signer.");
        return;
      }
      currentRow = row;
      const nom = row.children[0].textContent;
      document.getElementById('stagiaireName').textContent = nom;
      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas('signatureCanvas');
      initSignatureCanvas('signatureCanvas');
    };
  });

  document.querySelectorAll('.presence-checkbox').forEach(cb => {
    cb.onchange = updateFormateurButtonState;
  });
}


// =======================
// Sauvegarde de la signature stagiaire (individuelle ou collective)
// =======================

document.getElementById('saveSignature').addEventListener('click', () => {
  const canvas = document.getElementById('signatureCanvas');
  const dataURL = canvas.toDataURL();

  // Cas : signature dans le tableau principal
  if (currentRow) {
    const cell = currentRow.querySelector('.signature-stagiaire');
    cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
    currentRow = null;
    closeModal();
  }

  // Cas : signature dans la signature collective
else if (currentCollectiveSignatureTarget) {
  currentCollectiveSignatureTarget.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;

  // Trouve la ligne correspondante et injecte aussi dans le tableau HTML
  const nom = document.getElementById('stagiaireName').textContent.trim().toLowerCase();
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(row => {
    const rowNom = row.children[0].textContent.trim().toLowerCase();
    if (rowNom === nom) {
      const cell = row.querySelector('.signature-stagiaire');
      cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
    }
  });

  currentCollectiveSignatureTarget = null;
  document.getElementById('signatureModal').style.display = 'none';
  document.getElementById('collectiveSignatureModal').style.display = 'flex';
}

  updateFormateurButtonState();
});


// =======================
// Signature collective
// =======================
document.getElementById('signAllBtn').addEventListener('click', () => {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  if (rows.length === 0) {
    alert("Veuillez d'abord importer les stagiaires.");
    return;
  }

  document.getElementById('signatureListContainer').innerHTML = '';
  document.getElementById('collectiveSignatureModal').style.display = 'flex';
});


// =======================
// Gestion de la signature collective (présentiel)
// =======================

// =======================
// Signature collective
// =======================
document.getElementById('signAllBtn').addEventListener('click', () => {
  const btn = document.getElementById('signAllBtn');
  if (btn.disabled) return;
  document.getElementById('signatureListContainer').innerHTML = '';
  document.getElementById('collectiveSignatureModal').style.display = 'flex';
});

// =======================
// Gestion de la signature collective (présentiel)
// =======================
document.getElementById('signInPerson').addEventListener('click', () => {
  const container = document.getElementById('signatureListContainer');
  container.innerHTML = '';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  container.style.gap = '10px';

  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  rows.forEach(row => {
    const nom = row.children[0].textContent;
    const present = row.querySelector('.presence-checkbox')?.checked;

    const bloc = document.createElement('div');
    bloc.className = 'bloc-stagiaire';
    bloc.style.border = '1px solid #ccc';
    bloc.style.padding = '10px';
    bloc.style.borderRadius = '6px';
    bloc.style.background = '#f9f9f9';
    bloc.style.textAlign = 'center';

    const titre = document.createElement('p');
    titre.innerHTML = `<strong>${nom}</strong>`;
    bloc.appendChild(titre);

    const signaturePreview = document.createElement('div');
    signaturePreview.className = 'signature-preview';
    signaturePreview.style.marginBottom = '5px';
    bloc.appendChild(signaturePreview);

    if (present) {
      const btn = document.createElement('button');
      btn.textContent = 'Signer';
      btn.className = 'sign-btn-collective';
      btn.onclick = () => {
        currentCollectiveSignatureTarget = signaturePreview;
        document.getElementById('collectiveSignatureModal').style.display = 'none';
        document.getElementById('signatureModal').style.display = 'flex';
        document.getElementById('stagiaireName').textContent = nom;
        clearCanvas('signatureCanvas');
        initSignatureCanvas('signatureCanvas');
      };
      bloc.appendChild(btn);
    } else {
      signaturePreview.textContent = '❌ Absent';
    }

    container.appendChild(bloc);
  });

  container.style.display = 'grid';
});

// =======================
// Nettoyage automatique de l’ancienne poignée draggable si présente
// =======================
window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('collectiveSignatureModal')?.querySelector('div');
  if (modal) {
    const header = modal.querySelector('div');
    if (header && header.textContent.includes('Déplacer la fenêtre')) {
      modal.removeChild(header);
    }
  }

  // Désactive le bouton "Faire signer" tant que pas de stagiaires
  const signBtn = document.getElementById('signAllBtn');
  signBtn.disabled = true;
});



// =======================
// Mise à jour de l'état des boutons
// =======================
function updateFormateurButtonState() {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  let tousSignes = true;
  let auMoinsUnPresent = false;

  rows.forEach(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire img');
    if (present) {
      auMoinsUnPresent = true;
      if (!signature) tousSignes = false;
    }
  });

  const bouton = document.getElementById('formateurSignBtn');
  const consigne = document.getElementById('consigneFormateur');
  const collectiveBtn = document.getElementById('signAllBtn');

  // Activer le bouton formateur uniquement si tous les présents ont signé
  bouton.disabled = !tousSignes;

  // Cacher ou afficher la consigne en fonction de l'état
  if (consigne) consigne.style.display = tousSignes ? 'none' : 'block';

  // Activer le bouton collectif uniquement s'il reste des signatures à faire
  collectiveBtn.disabled = !auMoinsUnPresent || tousSignes;
}


// =======================
// Sauvegarde de la signature du formateur
// =======================
document.getElementById('saveFormateurSignature').addEventListener('click', () => {
  const canvas = document.getElementById('formateurCanvas');
  const dataURL = canvas.toDataURL();

  const container = document.getElementById('formateurSignature');
  container.style.display = 'block';
  container.innerHTML = `
    <div style="text-align:center; margin-top: 10px;">
      <strong>Signature du formateur :</strong><br>
      <img src="${dataURL}" alt="Signature formateur" style="max-width:120px;" />
    </div>
  `;

  closeModal();
  afficherBoutonQuitter();
});

// =======================
// Ouverture de la modale formateur
// =======================
document.getElementById('formateurSignBtn').addEventListener('click', () => {
  const allRows = document.querySelectorAll('#stagiairesTable tbody tr');
  let tousSignes = true;

  allRows.forEach(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire img');
    if (present && !signature) tousSignes = false;
  });

  if (!tousSignes) {
    alert("Tous les stagiaires présents n'ont pas encore signé.");
    return;
  }

  document.getElementById('formateurSignatureModal').style.display = 'flex';
  clearCanvas('formateurCanvas');
  initSignatureCanvas('formateurCanvas');
  document.getElementById('formateurName').textContent = document.getElementById('formateur')?.value || '';
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
document.getElementById('addStagiaireBtn').disabled = false;
document.getElementById('signAllBtn').disabled = false;

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
