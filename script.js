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
    document.getElementById('intitule').value = infoMap['Intitulé'] || '';
    document.getElementById('entreprise').value = infoMap['Entreprise cliente'] || '';
    document.getElementById('adresse').value = infoMap['Adresse du lieu de formation'] || '';
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
        <td>${stagiaire['Signature formateur'] || ''}</td>
        <td><button class="sign-btn">Faire signer</button></td>
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

document.getElementById('ajouterStagiaire').addEventListener('click', () => {
  const nom = prompt("Nom du stagiaire :");
  const prenom = prompt("Prénom du stagiaire :");
  const email = prompt("Email :");
  const tel = prompt("Téléphone :");
  const adresse = prompt("Adresse :");

  if (!nom || !prenom || !email || !tel || !adresse) {
    alert("Tous les champs sont obligatoires.");
    return;
  }

  const tbody = document.querySelector('#stagiairesTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${nom}</td>
    <td>${prenom}</td>
    <td>${email}</td>
    <td><input type="checkbox" class="presence-checkbox" /></td>
    <td class="signature-stagiaire"></td>
    <td></td>
    <td><button class="sign-btn">Faire signer</button></td>
  `;
  tbody.appendChild(tr);

  document.getElementById('nbStagiaires').value =
    parseInt(document.getElementById('nbStagiaires').value || 0) + 1;

  attachSignatureButtons();
});

document.getElementById('signAllBtn').addEventListener('click', () => {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  rows.forEach(row => {
    const cell = row.querySelector('.signature-stagiaire');
    if (!cell.querySelector('img')) {
      cell.innerHTML = `<img src="signature_par_defaut.png" alt="Signature" style="max-width:100px;" />`;
    }
  });
});

document.getElementById('signTrainerBtn').addEventListener('click', () => {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  let allSigned = true;

  rows.forEach(row => {
    const isPresent = row.querySelector('.presence-checkbox')?.checked;
    const hasSignature = row.querySelector('.signature-stagiaire img');
    if (isPresent && !hasSignature) {
      allSigned = false;
    }
  });

  if (!allSigned) {
    alert("Tous les stagiaires présents doivent avoir signé avant que le formateur puisse signer.");
    return;
  }

  document.getElementById('trainerSignatureModal').style.display = 'flex';
  clearTrainerCanvas();
});

document.get
