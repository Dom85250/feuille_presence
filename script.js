let currentRow = null;

// Initialisation des canvas
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureCtx = signatureCanvas.getContext('2d');
const formateurCanvas = document.getElementById('formateurCanvas');
const formateurCtx = formateurCanvas.getContext('2d');

document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const infoMap = {};
    for (let i = 6; i < 12; i++) {
      const key = rows[i]?.[1];
      const value = rows[i]?.[2];
      if (key) infoMap[key.trim()] = value;
    }

document.getElementById('intitule').value = infoMap['Intitulé de Formation'] || '';
document.getElementById('date').value = infoMap['Date'] || '';
document.getElementById('adresse').value = infoMap['Lieu'] || '';
document.getElementById('horaire').value = infoMap['Horaire'] || '';
document.getElementById('formateur').value = infoMap['Formateur'] || '';


    const headers = rows[13];
    const stagiaires = rows.slice(14).filter(row => row.length > 0);


    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = '';
    stagiaires.forEach(row => {
      const stagiaire = {};
      headers.forEach((header, i) => {
        stagiaire[header] = row[i] || '';
      });
      addStagiaireRow(stagiaire['Stagiaire'], stagiaire['Email']);
    });

    attachSignatureButtons();
  };
  reader.readAsArrayBuffer(file);
});

function formatDate(excelDate) {
  if (typeof excelDate === 'string') return excelDate;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

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

function clearCanvas() {
  if (signatureCtx) signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  if (formateurCtx) formateurCtx.clearRect(0, 0, formateurCanvas.width, formateurCanvas.height);
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
function attachSignatureButtons() {
  document.querySelectorAll('.sign-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRow = btn.closest('tr');
      const stagiaire = currentRow.children[0].textContent;
      document.getElementById('stagiaireName').textContent = stagiaire;
      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas();
    });
  });

  document.querySelectorAll('.email-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.closest('tr').children[1].textContent;
      alert(`Un lien de signature serait envoyé à : ${email} (fonctionnalité à intégrer avec EmailJS)`);
    });
  });

  updateFormateurButtonState();
}

function updateFormateurButtonState() {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  const allSigned = Array.from(rows).every(row => {
    const present = row.querySelector('.presence-checkbox')?.checked;
    const signature = row.querySelector('.signature-stagiaire')?.innerHTML.trim();
    return !present || (signature && signature !== '');
  });
  document.getElementById('formateurSignBtn').disabled = !allSigned;
}

// Signature collective
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

  const centre = document.getElementById('centre').value;
  const formation = document.getElementById('formation').value;
  const intitule = document.getElementById('intitule').value;
  const entreprise = document.getElementById('entreprise').value;
  const adresse = document.getElementById('adresse').value;
  const formateur = document.getElementById('formateur').value;
  const date = document.getElementById('date').value;
  const horaire = document.getElementById('horaire').value;
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

  doc.save(`feuille-emargement-${date}.pdf`);
}
