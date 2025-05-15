let currentRow = null;

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
    for (let i = 0; i < 10; i++) {
      const key = rows[i]?.[0];
      const value = rows[i]?.[1];
      if (key) infoMap[key.trim()] = value;
    }

    document.getElementById('centre').value = infoMap['Centre de formation'] || '';
    document.getElementById('formation').value = infoMap['Nom de la formation'] || '';
    document.getElementById('intitule').value = infoMap['Intitulé de la formation'] || '';
    document.getElementById('entreprise').value = infoMap['Entreprise cliente'] || '';
    document.getElementById('adresse').value = infoMap["Adresse de l'entreprise cliente"] || '';
    document.getElementById('formateur').value = infoMap['Nom du formateur'] || '';
    document.getElementById('date').value = formatDate(infoMap['Date']);
    document.getElementById('arrival').value = infoMap['Heure de début'] || '';
    document.getElementById('departure').value = infoMap['Heure de fin'] || '';

    const headers = rows[11];
    const stagiaires = rows.slice(12).filter(row => row.length > 0);
    document.getElementById('nbStagiaires').value = stagiaires.length;

    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = '';
    stagiaires.forEach(row => {
      const stagiaire = {};
      headers.forEach((header, i) => {
        stagiaire[header] = row[i] || '';
      });
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${stagiaire['Nom']}</td>
        <td>${stagiaire['Prénom']}</td>
        <td>${stagiaire['Email']}</td>
        <td><input type="checkbox" class="presence-checkbox" ${stagiaire['Présent'] === 'Oui' ? 'checked' : ''} /></td>
        <td class="signature-stagiaire">${stagiaire['Signature stagiaire'] || ''}</td>
        <td>
          <button class="sign-btn">Signer en présentiel</button>
          <button class="email-btn">Envoyer par mail</button>
        </td>
      `;
      tbody.appendChild(tr);
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
function attachSignatureButtons() {
  document.querySelectorAll('.sign-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRow = btn.closest('tr');
      const nom = currentRow.children[0].textContent;
      const prenom = currentRow.children[1].textContent;
      document.getElementById('stagiaireName').textContent = `${prenom} ${nom}`;
      document.getElementById('signatureModal').style.display = 'flex';
      clearCanvas();
    });
  });

  document.querySelectorAll('.email-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.closest('tr').children[2].textContent;
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

function clearCanvas() {
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  formateurCtx.clearRect(0, 0, formateurCanvas.width, formateurCanvas.height);
}

function closeModal() {
  document.getElementById('signatureModal').style.display = 'none';
  document.getElementById('formateurSignatureModal').style.display = 'none';
}
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
  const arrival = document.getElementById('arrival').value;
  const departure = document.getElementById('departure').value;
  const formateurSignature = document.querySelector('#formateurSignature canvas')?.toDataURL();

  doc.setFontSize(12);
  doc.text(`Centre de formation : ${centre}`, 10, 10);
  doc.text(`Formation : ${formation}`, 10, 20);
  doc.text(`Intitulé : ${intitule}`, 10, 30);
  doc.text(`Entreprise : ${entreprise}`, 10, 40);
  doc.text(`Adresse : ${adresse}`, 10, 50);
  doc.text(`Formateur : ${formateur}`, 10, 60);
  doc.text(`Date : ${date}`, 10, 70);
  doc.text(`Heure : ${arrival} - ${departure}`, 10, 80);

  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const nom = tr.children[0].textContent;
    const prenom = tr.children[1].textContent;
    const email = tr.children[2].textContent;
    const present = tr.querySelector('.presence-checkbox').checked ? 'Oui' : 'Non';
    const signatureCell = tr.querySelector('.signature-stagiaire');
    const signatureImg = signatureCell.querySelector('img')?.src || null;

    rows.push([nom, prenom, email, present, signatureImg]);
  });

  const tableData = rows.map(row => row.slice(0, 4));
  doc.autoTable({
    head: [['Nom', 'Prénom', 'Email', 'Présent']],
    body: tableData,
    startY: 90,
  });

  // Ajout des signatures stagiaires
  let yOffset = doc.lastAutoTable.finalY + 10;
  for (let i = 0; i < rows.length; i++) {
    const [nom, prenom, , , signatureImg] = rows[i];
    if (signatureImg && signatureImg.startsWith("data:image")) {
      const img = new Image();
      img.src = signatureImg;
      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = 40;
          const imgHeight = (img.height * imgWidth) / img.width;
          doc.addImage(signatureImg, 'PNG', 20, yOffset, imgWidth, imgHeight);
          doc.text(`${prenom} ${nom}`, 70, yOffset + imgHeight / 2);
          yOffset += imgHeight + 10;
          resolve();
        };
        img.onerror = resolve;
      });
    }
  }

  // Ajout de la signature du formateur
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
