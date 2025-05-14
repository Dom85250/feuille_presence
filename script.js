document.getElementById('excelFile').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    const tbody = document.querySelector('#stagiairesTable tbody');
    tbody.innerHTML = ''; // vide le tableau

    json.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.Nom || ''}</td>
        <td>${row.Prénom || ''}</td>
        <td>${row.Email || ''}</td>
      `;
      tbody.appendChild(tr);
    });
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});
