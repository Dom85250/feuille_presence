let currentRow = null;

// Initialisation des canvas
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureCtx = signatureCanvas.getContext('2d');
const formateurCanvas = document.getElementById('formateurCanvas');
const formateurCtx = formateurCanvas.getContext('2d');

let nomFichier = '';
let cheminFichier = '';

document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Lecture des infos générales : lignes 7 à 14 (index 6 à 13)
const normalize = str => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const infoMap = {};


for (let i = 5; i <= 13; i++) {
  if (!rows[i] || rows[i].length < 2) continue; // ignore les lignes vides ou incomplètes
  const key = normalize(rows[i][0]);
  const value = rows[i][1];
  if (key) infoMap[key] = value;
}


console.log("Clés détectées :", Object.keys(infoMap));
console.log("Valeurs lues :", infoMap);

// Remplissage des champs du formulaire
document.getElementById('intitule').value = infoMap['intitule de formation'] || '';
document.getElementById('date').value = infoMap['date'] || '';
document.getElementById('adresse').value = infoMap['lieu'] || '';
document.getElementById('horaire').value = infoMap['horaire'] || '';
document.getElementById('formateur').value = infoMap['formateur'] || '';

// Lecture du nom de fichier et chemin depuis infoMap
nomFichier = infoMap['nom fichier pdf'] || '';
cheminFichier = infoMap['chemin enregistrement pdf'] || '';

// Lecture des stagiaires à partir de la ligne 16 (index 15)
const headers = rows[15]; // Ligne des en-têtes
const stagiaires = rows.slice(16); // Lignes suivantes = données

const tbody = document.querySelector('#stagiairesTable tbody');
tbody.innerHTML = '';

stagiaires.forEach(row => {
  if (row.length === 0 || !row[0]) return; // ignorer les lignes vides
  const stagiaire = {};
  headers.forEach((header, i) => {
    stagiaire[header?.trim()] = row[i] || '';
  });
  addStagiaireRow(stagiaire['Stagiaire'], stagiaire['Email']);
});



    attachSignatureButtons();
  };
  reader.readAsArrayBuffer(file);
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
function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

document.getElementById('saveSignature').addEventListener('click', () => {
  const dataURL = signatureCanvas.toDataURL();
  const cell = currentRow.querySelector('.signature-stagiaire');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
  updateFormateurButtonState();
});

document.getElementById('addStagiaireBtn').addEventListener('click', () => {
  addStagiaireRow();
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

document.getElementById('signAllBtn').addEventListener('click', () => {
  const modal = document.getElementById('collectiveSignatureModal');
  const container = document.getElementById('signatureListContainer');
  container.innerHTML = '';
  modal.style.display = 'flex';

  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  rows.forEach(row => {
    const stagiaire = row.children[0].textContent;
    const present = row.querySelector('.presence-checkbox').checked;
    const div = document.createElement('div');
    div.style.marginBottom = '20px';

    if (present) {
      div.innerHTML = `
        <strong>${stagiaire}</strong><br/>
        <canvas width="300" height="100" style="border:1px solid #ccc;"></canvas>
      `;
    } else {
      div.innerHTML = `<strong>${stagiaire}</strong> — <em>Absent</em>`;
    }

    container.appendChild(div);
  });
});

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
