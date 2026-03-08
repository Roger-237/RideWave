const API_URL = 'https://ride-wave-vbtv.vercel.app/api/auth';
const BOOKINGS_API = 'https://ride-wave-vbtv.vercel.app/api/bookings';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserBookings();
});

async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/check-auth`, { credentials: 'include' });
        const data = await res.json();
        if (!data.SUCCESS) {
            window.location.href = 'index.html';
        } else {
            document.getElementById('userName').innerText = `Salut, ${data.user.name.split(' ')[0]}!`;
        }
    } catch (err) {
        window.location.href = 'index.html';
    }
}

async function loadUserBookings() {
    const grid = document.getElementById('bookingsGrid');
    try {
        const res = await fetch(`${BOOKINGS_API}/my-bookings`, { credentials: 'include' });
        const data = await res.json();

        if (data.SUCCESS) {
            renderBookings(data.data);
        } else {
            grid.innerHTML = `<p class="loading-state">Erreur: ${data.message}</p>`;
        }
    } catch (err) {
        grid.innerHTML = `<p class="loading-state">Erreur lors du chargement des réservations.</p>`;
    }
}

function renderBookings(bookings) {
    const grid = document.getElementById('bookingsGrid');
    if (bookings.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <i class='bx bx-calendar-x' style="font-size: 3rem; display: block; margin-bottom: 20px;"></i>
                <p>Tu n'as pas encore de réservations.</p>
                <a href="index.html#louer" style="color: var(--main-color); text-decoration: none; margin-top: 10px; display: inline-block;">Louer ma première voiture →</a>
            </div>
        `;
        return;
    }

    grid.innerHTML = bookings.map(b => {
        const carImage = b.car ? b.car.image : 'images/car-placeholder.png'; // Fallback image
        const carName = b.car ? b.car.name : '<Véhicule non disponible>';
        const carType = b.car ? b.car.type : 'N/A';

        return `
        <div class="booking-card">
            <span class="booking-status status-${b.status.replace(' ', '-')}">${b.status}</span>
            <img src="${carImage}" alt="${carName}">
            <div class="booking-info">
                <h3>${carName}</h3>
                <div class="info-item">
                    <span class="info-label">Type</span>
                    <span class="info-value">${carType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Lieu</span>
                    <span class="info-value">${b.pickupLocation || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Période</span>
                    <span class="info-value">Du ${b.startDate ? new Date(b.startDate).toLocaleDateString('fr-FR') : '?'} au ${b.endDate ? new Date(b.endDate).toLocaleDateString('fr-FR') : '?'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total</span>
                    <span class="info-value" style="color: var(--main-color); font-weight: bold;">${(b.totalPrice || 0).toLocaleString()} F CFA</span>
                </div>
                
                ${b.cancelReason ? `
                    <div class="cancel-reason">
                        <strong>Raison:</strong> ${b.cancelReason}
                    </div>
                ` : ''}

                ${b.status === 'en attente' ? `
                    <div class="booking-actions">
                        <button class="btn-delete-booking" onclick="deleteBooking('${b._id}')">
                            <i class='bx bx-trash'></i> Annuler la réservation
                        </button>
                    </div>
                ` : (b.status === 'annulé' || b.status === 'terminé' ? `
                    <div class="booking-actions">
                        <button class="btn-delete-booking" onclick="deleteBooking('${b._id}')">
                            <i class='bx bx-history'></i> Supprimer de l'historique
                        </button>
                    </div>
                ` : '')}

            </div>
        </div>
        `;
    }).join('');
}

async function deleteBooking(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette réservation ?')) return;

    try {
        const res = await fetch(`${BOOKINGS_API}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.SUCCESS) {
            afficherNotification('Réservation supprimée avec succès', 'success');
            loadUserBookings();
        } else {
            afficherNotification(data.message, 'error');
        }
    } catch (err) {
        afficherNotification('Erreur lors de la suppression', 'error');
    }
}

async function logout() {
    try {
        await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = 'index.html';
    } catch (err) {
        window.location.href = 'index.html';
    }
}

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
