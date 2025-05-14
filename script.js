// === Import Excel, remplissage des infos et affichage des stagiaires ===
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

    // === Remplir les champs d'information (ligne 1)
    const info = rows[1];
    document.getElementById('centre').value = info[0] || '';
    document.getElementById('formation').value = info[1] || '';
    document.getElementById('intitule').value = info[2] || '';
    document.getElementById('entreprise').value = info[3] || '';
    document.getElementById('adresse').value = info[4] || '';
    document.getElementById('formateur').value = info[5] || '';

    // === Extraire les stagiaires à partir de la ligne 2
    const headers = rows[2];
    const stagiaires = rows.slice(3);

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

// === Export PDF ===
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
    const email = cells[2].textContent;
    const present = cells[3].querySelector('input').checked ? "Oui" : "Non";
    rows.push([nom, prenom, email, present, "", ""]);
  });

  doc.autoTable({
    head: [['Nom', 'Prénom', 'Email', 'Présent', 'Signature stagiaire', 'Signature formateur']],
    body: rows,
    startY: 60
  });

  doc.save("feuille_presence.pdf");
});

// === Gestion du canvas de signature ===
const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);
canvas.addEventListener('mousemove', draw);

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

// === Effacer la signature ===
document.getElementById('clear-signature').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// === Soumission du formulaire manuel ===
document.getElementById('attendance-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert("Formulaire soumis avec succès !");
});
