// === Import Excel et affichage des stagiaires ===
document.getElementById('excelFile').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = '';

    json.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.Nom || ''}</td>
        <td>${row.Prénom || ''}</td>
        <td>${row.Email || ''}</td>
        <td><input type="checkbox" class="presence-checkbox" /></td>
      `;
      tbody.appendChild(tr);
    });
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});

// === Export PDF ===
document.getElementById('exportPDF').addEventListener('click', function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Feuille de Présence", 10, 10);

  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    const nom = cells[0].textContent;
    const prenom = cells[1].textContent;
    const email = cells[2].textContent;
    const present = cells[3].querySelector('input').checked ? "Oui" : "Non";
    rows.push([nom, prenom, email, present]);
  });

  doc.autoTable({
    head: [['Nom', 'Prénom', 'Email', 'Présent']],
    body: rows,
    startY: 20
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

// === Soumission du formulaire ===
document.getElementById('attendance-form').addEventListener('submit', function(e) {
  e.preventDefault();
  alert("Formulaire soumis avec succès !");
  // Tu peux ici ajouter du code pour enregistrer les données ou les envoyer à un serveur
});
