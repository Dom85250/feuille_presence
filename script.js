document.getElementById('excelFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) return;

    const info = rows[1];
    document.getElementById('centre').value = info[0] || '';
    document.getElementById('formation').value = info[1] || '';
    document.getElementById('intitule').value = info[2] || '';
    document.getElementById('entreprise').value = info[3] || '';
    document.getElementById('adresse').value = info[4] || '';
    document.getElementById('formateur').value = info[5] || '';

    const = rows.slice(3);

    const dateIndex = headers.indexOf('Date');
    const debutIndex = headers.indexOf('Heure de début');
    const finIndex = headers.indexOf('Heure de fin');

    if (stagiaires.length > 0 && dateIndex !== -1 && debutIndex !== -1 && finIndex !== -1) {
      document.getElementById('date').value = formatDate(stagiaires[0][dateIndex]);
      document.getElementById('arrival').value = stagiaires[0][debutIndex];
      document.getElementById('departure').value = stagiaires[0][finIndex];
    }

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

function formatDate(excelDate) {
  if (typeof excelDate === 'string') return excelDate;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
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

  doc.setFontSize(12);
  doc.text(`Centre : ${centre}`, 10, 10);
  doc.text(`Formation : ${formation}`, 10, 18);
  doc.text(`Intitulé : ${intitule}`, 10, 26);
  doc.text(`Entreprise cliente : ${entreprise}`, 10, 34);
  doc.text(`Adresse : ${adresse}`, 10, 42);
  doc.text(`Formateur : ${formateur}`, 10, 50);

  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    const nom = cells[0].textContent;
    const prenom = cells[1].textContent;
    const email = cells[2].
