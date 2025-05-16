// =======================
// Fonctions utilitaires
// =======================
const normalize = str => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function attachSignatureButtons() {
  const buttons = document.querySelectorAll('.sign-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      currentRow = row;
      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas();
    });
  });
}

function clearCanvas() {
  const canvas = document.getElementById('signatureCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// =======================
// Importation fichier Excel
// =======================
document.getElementById('fileInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const infoMap = {};

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i] || rows[i].length < 2) continue;
      const key = normalize(rows[i][0]);
      const value = rows[i][1];
      if (key) infoMap[key] = value;
    }

    document.getElementById('intitule').value = infoMap['intitule de formation'] || '';
    document.getElementById('date').value = infoMap['date'] || '';
    document.getElementById('adresse').value = infoMap['lieu'] || '';
    document.getElementById('horaire').value = infoMap['horaire'] || '';
    document.getElementById('formateur').value = infoMap['formateur'] || '';

    nomFichier = infoMap['nom fichier pdf'] || '';
    cheminFichier = infoMap['chemin enregistrement pdf'] || '';

    const headers = rows[15];
    const normalizedHeaders = headers.map(h => normalize(h));
    const stagiaires = rows.slice(16);

    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = '';

    stagiaires.forEach(row => {
      if (!row || row.length < 2 || !row[0]) return;
      const stagiaire = {};
      normalizedHeaders.forEach((header, i) => {
        stagiaire[header] = row[i] || '';
      });
      addStagiaireRow(stagiaire['stagiaire'], stagiaire['email']);
    });
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
    <td class="centered"><input type="checkbox" class="presence-checkbox" /></td>
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
document.getElementById('saveSignature').addEventListener('click', () => {
  const dataURL = signatureCanvas.toDataURL();
  const cell = currentRow.querySelector('.signature-stagiaire');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
  updateFormateurButtonState();
});

document.getElementById('formateurSignBtn').addEventListener('click', () => {
  document.getElementById('formateurSignatureModal').style.display = 'flex';
  clearCanvas();
});

document.getElementById('saveFormateurSignature').addEventListener('click', () => {
  const dataURL = formateurCanvas.toDataURL();
  const cell = document.getElementById('formateurSignature');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
});

function updateFormateurButtonState() {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  const allSigned = Array.from(rows).every(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire')?.innerHTML.trim();
    return !present || (signature && signature !== '');
  });
  document.getElementById('formateurSignBtn').disabled = !allSigned;
}

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
    if (signatureImg && signatureImg.startsWith("data:image")) {
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

  if (formateurSignature && formateurSignature.startsWith("data:image")) {
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
