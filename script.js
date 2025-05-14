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
    document.getElementById('entreprise').value = infoMap["Entreprise 1234 Inc."] || infoMap["Entreprise cliente"] || '';
    document.getElementById('adresse').value = infoMap["Adresse de l'entreprise cliente"] || '';
    document.getElementById('formateur').value = infoMap['Ville John Doe'] || infoMap['Nom du formateur'] || '';
    document.getElementById('date').value = formatDate(infoMap['2025-09-16'] || infoMap['Date']);
    document.getElementById('arrival').value = infoMap["9H00 (Heure de début)"] || infoMap['Heure de début'] || '';
    document.getElementById('departure').value = infoMap["12H30 (Heure de fin)"] || infoMap['Heure de fin'] || '';

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
        <td>${stagiaire['Signature formateur'] || ''}</td>
        <td><button class="sign-btn">Signer en présentiel</button><button class="email-btn">Envoyer par mail</button></td>
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
let currentRow = null;

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
  const dataURL = canvas.toDataURL();
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
  const dataURL = canvas.toDataURL();
  const cell = document.getElementById('formateurSignature');
  cell.innerHTML = `<img src="${dataURL}" alt="Signature" style="max-width:100px;" />`;
  closeModal();
});

function clearCanvas() {
  const canvas = document.getElementById('signatureCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function closeModal() {
  document.getElementById('signatureModal').style.display = 'none';
  document.getElementById('formateurSignatureModal').style.display = 'none';
}
document.getElementById('exportPDF').addEventListener('click', function () {
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

  doc.setFontSize(12);
  let y = 10;
  const infos = [
    `Centre de formation : ${centre}`,
    `Nom de la formation : ${formation}`,
    `Intitulé : ${intitule}`,
    `Entreprise cliente : ${entreprise}`,
    `Adresse : ${adresse}`,
    `Nom du formateur : ${formateur}`,
    `Date : ${date}`,
    `Heure d'arrivée : ${arrival}`,
    `Heure de départ : ${departure}`
  ];

  infos.forEach(info => {
    doc.text(info, 10, y);
    y += 8;
  });

  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    const nom = cells[0].textContent;
    const prenom = cells[1].textContent;
    const email = cells[2].textContent;
    const present = cells[3].querySelector('input')?.checked ? 'Oui' : 'Non';
    const signatureStagiaire = cells[4].querySelector('img')?.src || '';
    const signatureFormateur = cells[5].textContent;

    rows.push([nom, prenom, email, present, signatureStagiaire, signatureFormateur]);
  });

  doc.autoTable({
    startY: y + 5,
    head: [['Nom', 'Prénom', 'Email', 'Présent', 'Signature stagiaire', 'Signature formateur']],
    body: rows,
    didDrawCell: function (data) {
      if (data.column.index === 4 && data.cell.raw) {
        const img = new Image();
        img.src = data.cell.raw;
        doc.addImage(img, 'PNG', data.cell.x + 2, data.cell.y + 2, 20, 10);
      }
    }
  });

  const formateurSignature = document.getElementById('formateurSignature').querySelector('img')?.src || '';
  if (formateurSignature) {
    const img = new Image();
    img.onload = function () {
      const finalY = doc.lastAutoTable.finalY || y + 10;
      doc.text("Signature du formateur :", 10, finalY + 10);
      doc.addImage(img, 'PNG', 10, finalY + 15, 50, 20);
      doc.save('feuille_de_presence.pdf');
    };
    img.src = formateurSignature;
  } else {
    doc.save('feuille_de_presence.pdf');
  }
});
