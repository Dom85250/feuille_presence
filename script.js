// =======================
// Fonctions utilitaires
// =======================

function normalize(str) {
  return str?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')     // Supprime accents
    .replace(/[^a-z0-9]/g, '');          // Supprime tout sauf lettres/chiffres
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

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
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
          console.log(`Champ détecté : "${key}" => "${value}"`);
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

      if (!headers || headers.length < 2) {
        console.error("⚠️ En-têtes des stagiaires absents ou incomplets en ligne " + (headerRowIndex + 1));
        return;
      }

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
});

document.getElementById('formateurSignBtn').addEventListener('click', () => {
  document.getElementById('formateurSignatureModal').style.display = 'flex';
  clearCanvas('formateurCanvas');
  initSignatureCanvas('formateurCanvas');
});

// =======================
// Exportation en PDF
// =======================

document.getElementById('exportPDF').addEventListener('click', exportPDF);

async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const centre = document.getElementById('centre')?.value || '';
  const formation = document.getElementById('formation')?.value || '';
  const intitule = document.getElementById('intitule')?.value || '';
  const entreprise = document.getElementById('entreprise')?.value || '';
  const adresse = document.getElementById('adresse')?.value || '';
  const formateur = document.getElementById('formateur')?.value || '';
  const date = document.getElementById('date')?.value || '';
  const horaire = document.getElementById('horaire')?.value || '';
  const formateurSignature = document.querySelector('#formateurSignature img')?.src;

  doc.setFontSize(12);
  doc.text(`Centre de formation : ${centre}`, 10, 10);
  doc.text(`Formation : ${formation}`, 10, 20);
  doc.text(`Intitulé : ${intitule}`, 10, 30);
  doc.text(`Entreprise : ${entreprise}`, 10, 40);
  doc.text(`Adresse : ${adresse}`, 10, 50);
  doc.text(`Formateur : ${formateur}`, 10, 60);
  doc.text(`Date : ${date}`, 10, 70);
  doc.text(`Horaire : ${horaire}`, 10, 80);

  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const stagiaire = tr.children[0].textContent;
    const email = tr.children[1].textContent;
    const present = tr.querySelector('.presence-checkbox').checked ? 'Oui' : 'Non';
    const signatureCell = tr.querySelector('.signature-stagiaire');
    const signatureImg = signatureCell.querySelector('img')?.src || null;
    rows.push([stagiaire, email, present, signatureImg]);
  });

  const tableData = rows.map(row => row.slice(0, 3));
  doc.autoTable({
    head: [['Stagiaire', 'Email', 'Présent']],
    body: tableData,
    startY: 90,
  });

  let yOffset = doc.lastAutoTable.finalY + 10;
  for (let i = 0; i < rows.length; i++) {
    const [stagiaire, , , signatureImg] = rows[i];
    if (signatureImg?.startsWith("data:image")) {
      const img = new Image();
      img.src = signatureImg;
      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = 40;
          const imgHeight = (img.height * imgWidth) / img.width;
          doc.addImage(signatureImg, 'PNG', 20, yOffset, imgWidth, imgHeight);
          doc.text(stagiaire, 70, yOffset + imgHeight / 2);
          yOffset += imgHeight + 10;
          resolve();
        };
        img.onerror = resolve;
      });
    }
  }

  if (formateurSignature?.startsWith("data:image")) {
    const img = new Image();
    img.src = formateurSignature;
    await new Promise((resolve) => {
      img.onload = () => {
        const imgWidth = 40;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(formateurSignature, 'PNG', 20, yOffset + 10, imgWidth, imgHeight);
        doc.text("Signature du formateur", 70, yOffset + 10 + imgHeight / 2);
        resolve();
      };
      img.onerror = resolve;
    });
  }

  const nomFinal = nomFichier || `feuille-emargement-${date}`;
  doc.save(`${nomFinal}.pdf`);
}
