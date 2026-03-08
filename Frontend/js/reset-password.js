const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulaireResetPassword');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        afficherNotification('Jeton de réinitialisation manquant', 'error');
        setTimeout(() => window.location.href = 'index.html', 3000);
        return;
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const password = document.getElementById('nouveauMotDePasse').value;
        const confirmPassword = document.getElementById('confirmerNouveauMotDePasse').value;

        if (password !== confirmPassword) {
            return afficherNotification('Les mots de passe ne correspondent pas', 'error');
        }

        try {
            const res = await fetch(`${API_URL}/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();
            if (data.SUCCESS) {
                afficherNotification('Mot de passe réinitialisé avec succès !', 'success');
                setTimeout(() => window.location.href = 'index.html', 3000);
            } else {
                afficherNotification(data.message, 'error');
            }
        } catch (err) {
            afficherNotification('Erreur lors de la réinitialisation', 'error');
        }
    };
});

function afficherNotification(message, type = 'success') {
    const conteneur = document.getElementById('conteneurNotifications');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
    `;
    note.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}'></i><span>${message}</span>`;
    conteneur.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        note.style.transform = 'translateX(20px)';
        note.style.transition = '0.3s';
        setTimeout(() => note.remove(), 300);
    }, 4000);
}

// Keyframes
const style = document.createElement('style');
style.innerText = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);
