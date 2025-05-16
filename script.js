// =======================
// Fonctions utilitaires
// =======================

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

      // === Lecture des champs haut du tableau (0 à 14) ===
      for (let i = 0; i < 9; i++) {
        if (!rows[i] || rows[i].length < 2) continue;
        const key = normalize(rows[i][0]);
        const value = rows[i][1];
        if (key) {
          infoMap[key] = value;
          console.log(`Champ détecté : "${key}" => "${value}"`);
        }
      }

      // === Injection des champs dans le formulaire HTML ===
      document.getElementById('intitule').value = infoMap['intituledeformation'] || '';
      document.getElementById('date').value = infoMap['date'] || '';
      document.getElementById('adresse').value = infoMap['lieu'] || '';
      document.getElementById('horaire').value = infoMap['horaire'] || '';
      document.getElementById('formateur').value = infoMap['formateur'] || '';

      nomFichier = infoMap['nomfichierpdf'] || '';
      cheminFichier = infoMap['cheminenregistrementpdf'] || '';

    // === Lecture des en-têtes (ligne 16 = index 15) ===

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
headers[0] = 'Stagiaire'; // Sécurise au cas où le mot serait mal écrit
const normalizedHeaders = headers.map(h => normalize(h));
console.log("✅ Ligne d'en-tête trouvée (index " + headerRowIndex + ") :", headers);
console.log("🔍 En-têtes normalisés :", normalizedHeaders);

      
if (!headers || headers.length < 2) {
  console.error("⚠️ En-têtes des stagiaires absents ou incomplets en ligne 16.");
  return;
}

// 🛠️ Correction ici : forcer l'intitulé de la première colonne
headers[0] = 'Stagiaire';

console.log("✅ En-têtes détectés :", headers);

const normalizedHeaders = headers.map(h => normalize(h));
console.log("🔍 En-têtes normalisés :", normalizedHeaders);


    const stagiaires = rows.slice(headerRowIndex + 1);// Lignes 17 et +
      const tbody = document.querySelector('#stagiairesTable tbody');
      tbody.innerHTML = '';

      stagiaires.forEach((row, index) => {
        if (!row || row.length < 2 || !row[0]) {
          console.warn(`⛔ Ligne ${index + 17} ignorée (vide ou incomplète) :`, row);
          return;
        }

        const stagiaire = {};
        normalizedHeaders.forEach((header, i) => {
          stagiaire[header] = row[i] || '';
        });

        console.log(`📌 Stagiaire ligne ${index + 17} :`, stagiaire);
        console.log("Clés disponibles :", Object.keys(stagiaire));

        // Vérifie si le champ 'stagiaire' existe et est non vide
        if (!stagiaire['stagiaire']) {
          console.warn(`⚠️ Aucun nom de stagiaire détecté à la ligne ${index + 17}`);
          return;
        }

        // Affiche le stagiaire dans le tableau HTML (nom + email uniquement ici)
        addStagiaireRow(stagiaire['stagiaire'], stagiaire['email']);
      });

    } catch (error) {
      console.error("💥 Erreur pendant le traitement du fichier Excel :", error);
    }
  };

  reader.readAsArrayBuffer(file);
});

// =======================
// Fonction normalize robuste
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
