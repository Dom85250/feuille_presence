document.getElementById('exportPDF').addEventListener('click', function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Récupération des informations sur la formation
  const centre = document.getElementById('centre').value;
  const formation = document.getElementById('formation').value;
  const intitule = document.getElementById('intitule').value;
  const entreprise = document.getElementById('entreprise').value;
  const adresse = document.getElementById('adresse').value;
  const formateur = document.getElementById('formateur').value;
  const date = document.getElementById('date').value;
  const arrival = document.getElementById('arrival').value;
  const departure = document.getElementById('departure').value;

  // Ajout des informations sur la formation
  doc.setFontSize(12);
  let y = 10;
  const lineHeight = 8;
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
    y += lineHeight;
  });

  // Préparation des données du tableau des stagiaires
  const rows = [];
  document.querySelectorAll('#stagiairesTable tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    const nom = cells[0].textContent;
    const prenom = cells[1].textContent;
    const email = cells[2].textContent;
    const present = cells[3].querySelector('input')?.checked ? 'Oui' : 'Non';
    const signatureStagiaire = cells[4].textContent;
    const signatureFormateur = cells[5].textContent;

    rows.push([nom, prenom, email, present, signatureStagiaire, signatureFormateur]);
  });

  // Ajout du tableau au PDF
  doc.autoTable({
    startY: y + 5,
    head: [['Nom', 'Prénom', 'Email', 'Présent', 'Signature stagiaire', 'Signature formateur']],
    body: rows
  });

  doc.save('feuille_de_presence.pdf');
});
