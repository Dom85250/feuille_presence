// =======================
// Fonctions utilitaires
// =======================

function normalize(str) {
  return str?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// =======================
// Initialisation du canvas de signature
// =======================

function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
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
// Fermeture de modale
// =======================

function closeModal() {
  document.getElementById('signatureModal').style.display = 'none';
  document.getElementById('formateurSignatureModal').style.display = 'none';
  document.getElementById('collectiveSignatureModal').style.display = 'none';
}

// =======================
// Mise à jour de l'état du bouton formateur
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
// Importation fichier Excel
// =======================

document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) {
    console.warn("Aucun fichier sélectionné.");
    return;
  }

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
        if (key) {
          infoMap[key] = value;
        }
      }

      document.getElementById('intitule').value = infoMap['intituledeformation'] || '';
      document.getElementById('date').value = infoMap['date'] || '';
      document.getElementById('adresse').value = infoMap['lieu'] || '';
      document.getElementById('horaire').value = infoMap['horaire'] || '';
      document.getElementById('formateur').value = infoMap['formateur'] || '';

      nomFichier = infoMap['nomfichierpdf'] || '';
      cheminFichier = infoMap['cheminenregistrementpdf'] || '';

      let headerRowIndex = -1;
      for (let i = 10; i < rows.length; i++) {
        const row = rows[i];
        if (row && row.some(cell => typeof cell === 'string' && normalize(cell).includes('stagiaire'))) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        console.error("❌ Impossible de trouver la ligne d'en-tête des stagiaires.");
        return;
      }

      const headers = rows[headerRowIndex];
      headers[0] = 'Stagiaire';

      const normalizedHeaders = headers.map(h => normalize(h));
      const stagiaires = rows.slice(headerRowIndex + 1);
      const tbody = document.querySelector('#stagiairesTable tbody');
      tbody.innerHTML = '';

      stagiaires.forEach((row, index) => {
        if (!row || row.length < 2 || !row[0]) return;

        const stagiaire = {};
        normalizedHeaders.forEach((header, i) => {
          stagiaire[header] = row[i] || '';
        });

        if (!stagiaire['stagiaire']) return;

        addStagiaireRow(stagiaire['stagiaire'], stagiaire['email']);
      });

      const infoPresence = document.getElementById('infoPresence');
      if (infoPresence) {
        infoPresence.style.display = tbody.children.length > 0 ? 'block' : 'none';
      }

      updateFormateurButtonState();

    } catch (error) {
      console.error("💥 Erreur pendant le traitement du fichier Excel :", error);
    }
  };

  reader.readAsArrayBuffer(file);
});

// =======================
// Ajout d’un stagiaire manuellement
// =======================

document.getElementById('addStagiaireBtn').addEventListener('click', () => {
  addStagiaireRow();
});

function addStagiaireRow(stagiaire = '', email = '') {
  const tbody = document.querySelector('#stagiairesTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${stagiaire}</td>
    <td>${email}</td>
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
}

// =======================
// Gestion des signatures
// =======================

let currentRow = null;

function attachSignatureButtons() {
  const buttons = document.querySelectorAll('.sign-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      currentRow = row;

      const nomStagiaire = row.children[0].textContent;
      document.getElementById('stagiaireName').textContent = nomStagiaire;

      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas('signatureCanvas');
      initSignatureCanvas('signatureCanvas');
    });
  });
}

document.getElementById('saveSignature').addEventListener('click', () => {
  const canvas = document.getElementById('signatureCanvas');
  const dataURL = canvas.toDataURL();
  const cell = currentRow.querySelector('.signature-stagiaire');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
  updateFormateurButtonState();
});

document.getElementById('formateurSignBtn').addEventListener('click', () => {
  document.getElementById('formateurSignatureModal').style.display = 'flex';
  clearCanvas('formateurCanvas');
  initSignatureCanvas('formateurCanvas');

  const nomFormateur = document.getElementById('formateur')?.value || '';
  const formateurNameElem = document.getElementById('formateurName');
  if (formateurNameElem) {
    formateurNameElem.textContent = nomFormateur;
  }
});

const clearAllButton = document.getElementById('clearCollectiveSignature');
if (clearAllButton) {
  clearAllButton.addEventListener('click', () => {
    const container = document.getElementById('signatureListContainer');
    container.innerHTML = '';
  });
}
