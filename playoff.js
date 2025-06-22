// In futuro qui possiamo caricare i dati dinamicamente da Google Sheets
document.querySelectorAll('.team').forEach(t => {
  t.addEventListener('click', () => {
    alert(`Hai cliccato su: ${t.textContent}`);
  });
});
