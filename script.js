// =======================
// Fonctions utilitaires
// =======================

function normalize(str) {
  return str?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
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
    e.preventDefault();
    drawing = true;
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
// Effacement du canvas
// =======================

function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// =======================
// Fermeture des modales
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
    message.style.backgroundColor = '#d4edda';
    message.style.borderLeft = '4px solid #28a745';
    message.style.padding = '10px 12px';
    message.style.marginTop = '20px';
    message.style.fontSize = '0.95em';
    message.style.color = '#155724';
    message.style.fontWeight = '500';
    message.style.boxShadow = '0 0 4px rgba(0,0,0,0.1)';
    document.body.appendChild(message);
  }
  message.style.display = 'block';
}

// =======================
// Mise à jour du bouton formateur
// =======================

function updateFormateurButtonState() {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  let tousSignes = true;

  rows.forEach(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire img');
    if (present && !signature) {
      tousSignes = false;
    }
  });

  const bouton = document.getElementById('formateurSignBtn');
  const consigne = document.getElementById('consigneFormateur');
  if (tousSignes) {
    bouton.disabled = false;
    if (consigne) consigne.style.display = 'none';
  } else {
    bouton.disabled = true;
    if (consigne) consigne.style.display = 'block';
  }
}

// =======================
// Variables de contexte
// =======================

let currentRow = null;
let currentCollectiveSignatureTarget = null;

// =======================
// Gestion des signatures stagiaires
// =======================

document.getElementById('saveSignature').addEventListener('click', () => {
  const canvas = document.getElementById('signatureCanvas');
  const dataURL = canvas.toDataURL();

  if (currentCollectiveSignatureTarget) {
    currentCollectiveSignatureTarget.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
    currentCollectiveSignatureTarget = null;
    document.getElementById('signatureModal').style.display = 'none';
    document.getElementById('collectiveSignatureModal').style.display = 'flex';
  } else if (currentRow) {
    const cell = currentRow.querySelector('.signature-stagiaire');
    if (cell) {
      cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
      updateFormateurButtonState();
    }
    closeModal();
  }
});

// =======================
// Ajout manuel de stagiaires
// =======================

document.getElementById('addStagiaireBtn').addEventListener('click', () => {
  const tbody = document.querySelector('#stagiairesTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable="true"></td>
    <td contenteditable="true"></td>
    <td class="centered"><input type="checkbox" class="presence-checkbox" checked /></td>
    <td class="signature-stagiaire"></td>
    <td>
      <button class="sign-btn">Signer en présentiel</button>
      <button class="email-btn">Envoyer par mail</button>
    </td>
  `;
  tbody.appendChild(tr);
  attachSignatureButtons();
  updateFormateurButtonState();
});

// =======================
// Affichage des signatures collectives
// =======================

document.getElementById('signAllBtn').addEventListener('click', () => {
  const modal = document.getElementById('collectiveSignatureModal');
  const container = document.getElementById('signatureListContainer');
  modal.style.display = 'flex';
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
        clearCanvas('signatureCanvas');
        initSignatureCanvas('signatureCanvas');
        document.getElementById('stagiaireName').textContent = nom;
      };
      bloc.appendChild(btn);
    } else {
      signaturePreview.textContent = '❌ Absent';
    }

    container.appendChild(bloc);
  });
});

// =======================
// Association des boutons Signer aux lignes
// =======================

function attachSignatureButtons() {
  document.querySelectorAll('.sign-btn').forEach(button => {
    button.onclick = (e) => {
      currentRow = e.target.closest('tr');
      const nom = currentRow.children[0].textContent;
      document.getElementById('stagiaireName').textContent = nom;
      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas('signatureCanvas');
      initSignatureCanvas('signatureCanvas');
    };
  });
}

// =======================
// Importation des stagiaires depuis Excel
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
