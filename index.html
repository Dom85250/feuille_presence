document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Lecture des informations sur la formation (lignes 1 à 9)
    const infoMap = {};
    for (let i = 0; i < 9; i++) {
      key = rows[i]?.[0];
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

    // Lecture des stagiaires à partir de la ligne 12
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
        <td>${stagiaire['Téléphone']}</td>
        <td>${stagiaire['Adresse']}</td>
        <td><input type="checkbox" class="presence-checkbox" ${stagiaire['Présent'] === 'Oui' ? 'checked' : ''} /></td>
        <td>${stagiaire['Signature stagiaire']}</td>
        <td>${stagiaire['Signature formateur']}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  reader.readAsArrayBuffer(file);
});

function formatDate(excelDate) {
  if (typeof excelDate === 'string') return excelDate;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// ➕ Ajout manuel d’un stagiaire
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
    <td>${tel}</td>
    <td>${adresse}</td>
    <td><input type="checkbox" class="presence-checkbox" /></td>
    <td></td>
    <td></td>
  `;
  tbody.appendChild(tr);

  const nbStagiairesInput = document.getElementById('nbStagiaires');
  nbStagiairesInput.value = parseInt(nbStagiairesInput.value || 0) + 1;
});

// 📄 Export PDF
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
    const tel = cells[3].textContent;
    const adresse = cells[4].textContent;
    const present = cells[5].querySelector('input')?.checked ? 'Oui' : 'Non';
    const signatureStagiaire = cells[6].textContent;
    const signatureFormateur = cells[7].textContent;

    rows.push([nom, prenom, email, tel, adresse, present, signatureStagiaire, signatureFormateur]);
  });

  doc.autoTable({
    startY: y + 5,
    head: [['Nom', 'Prénom', 'Email', 'Téléphone', 'Adresse', 'Présent', 'Signature stagiaire', 'Signature formateur']],
    body: rows
  });

  doc.save('feuille_de_presence.pdf');
});
