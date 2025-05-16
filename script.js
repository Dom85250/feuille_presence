// =======================
// Partie 1 : Traitement des lignes de données
// =======================
if (!rows[i] || rows[i].length < 2) continue; // ignore les lignes vides ou incomplètes
const key = normalize(rows[i][0]);
const value = rows[i][1];
if (key) infoMap[key] = value;
}

// =======================
// Partie 2 : Affichage des clés et valeurs extraites
// =======================
console.log("Clés détectées :", Object.keys(infoMap));
console.log("Valeurs lues :", infoMap);

// =======================
// Partie 3 : Remplissage des champs du formulaire
// =======================
document.getElementById('intitule').value = infoMap['intitule de formation'] || '';
document.getElementById('date').value = infoMap['date'] || '';
document.getElementById('adresse').value = infoMap['lieu'] || '';
document.getElementById('horaire').value = infoMap['horaire'] || '';
document.getElementById('formateur').value = infoMap['formateur'] || '';

// =======================
// Partie 4 : Lecture du nom et chemin du fichier PDF
// =======================
nomFichier = infoMap['nom fichier pdf'] || '';
cheminFichier = infoMap['chemin enregistrement pdf'] || '';

// =======================
// Partie 5 : Lecture des stagiaires à partir de la ligne 16
// =======================
const headers = rows[15]; // Ligne des en-têtes
const stagiaires = rows.slice(16); // Lignes suivantes = données

// =======================
// Partie 6 : Réinitialisation du tableau HTML des stagiaires
// =======================
const tbody = document.querySelector('#stagiairesTable tbody');
tbody.innerHTML = '';

// =======================
// Partie 7 : Traitement des données des stagiaires
// =======================
stagiaires.forEach(row => {
  if (row.length === 0 || !row[0]) return; // ignorer les lignes vides
  const stagiaire = {};
  headers.forEach((header, i) => {
    stagiaire[header?.trim()] = row[i] || '';

    console.log("Stagiaire traité :", stagiaire);
    console.log("Nom :", stagiaire['stagiaire'], "| Email :", stagiaire['email']);
  });

  // =======================
  // Partie 8 : Normalisation des en-têtes et ajout des stagiaires
  // =======================
  const normalize = str => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const normalizedHeaders = headers.map(h => normalize(h));

  stagiaires.forEach(row => {
    if (!row || row.length < 2 || !row[0]) return;
    const stagiaire = {};
    normalizedHeaders.forEach((header, i) => {
      stagiaire[header] = row[i] || '';
    });
    addStagiaireRow(stagiaire['stagiaire'], stagiaire['email']);

    console.log("En-têtes détectés :", headers);
    console.log("Nombre de stagiaires détectés :", stagiaires.length);
    console.log("Première ligne brute :", stagiaires[0]);
  });
});

// =======================
// Partie 9 : Attachement des boutons de signature
// =======================
attachSignatureButtons();
};
reader.readAsArrayBuffer(file);
});

// =======================
// Partie 10 : Fonction d'ajout d'une ligne de stagiaire dans le tableau
// =======================
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
// Partie 2 : Gestion des modales et des signatures
// =======================

// Fermeture de toutes les modales
function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// Sauvegarde de la signature du stagiaire
document.getElementById('saveSignature').addEventListener('click', () => {
  const dataURL = signatureCanvas.toDataURL();
  const cell = currentRow.querySelector('.signature-stagiaire');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
  updateFormateurButtonState();
});

// Ajout d’un nouveau stagiaire
document.getElementById('addStagiaireBtn').addEventListener('click', () => {
  addStagiaireRow();
});

// Ouverture de la modale de signature du formateur
document.getElementById('formateurSignBtn').addEventListener('click', () => {
  document.getElementById('formateurSignatureModal').style.display = 'flex';
  clearCanvas();
});

// Sauvegarde de la signature du formateur
document.getElementById('saveFormateurSignature').addEventListener('click', () => {
  const dataURL = formateurCanvas.toDataURL();
  const cell = document.getElementById('formateurSignature');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
});

// =======================
// Partie 3 : Activation du bouton de signature formateur
// =======================
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
// Partie 4 : Signature collective des stagiaires présents
// =======================
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

// =======================
// Partie 5 : Exportation du PDF avec les données et signatures
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
