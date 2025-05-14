document.getElementById('signAllBtn').addEventListener('click', () => {
  const rows = document.querySelectorAll('#stagiairesTable tbody tr');
  rows.forEach(row => {
    const cell = row.querySelector('.signature-stagiaire');
    // Vérifie si une signature existe déjà
    if (!cell.querySelector('img')) {
      // Ajoute une signature par défaut (tu peux remplacer l'URL par ton image)
      cell.innerHTML = `<img src="signature_par_defaut.png" alt="Signature" style="max-width:100px;" />`;
    }
  });
});
