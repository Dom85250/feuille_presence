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
      const key = rows[i]?.[0];
      const value = rows[i]?.[1];
      if (key) infoMap[key.trim()] = value;
    }

    console.log("Champs trouvés dans le fichier Excel :", infoMap);

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
    const stagiaires = rows.slice(12);

    document.getElementById('nbStagiaires').value = stagiaires.length;

    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = '';

    stagiaires.forEach(row => {
      const nom = row[headers.indexOf('Nom')] || '';
      const prenom = row[headers.indexOf('Prénom')] || '';
      const email = row[headers.indexOf('Email')] || '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nom}</td>
        <td>${prenom}</td>
        <td>${email}</td>
        <td><input type="checkbox" class="presence-checkbox" /></td>
        <td></td>
        <td></td>
      `;
      tbody.appendChild(tr);
    });
  };

  reader.readAsArrayBuffer(file);
});
