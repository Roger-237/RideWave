const BOOKINGS_API = 'https://ride-wave-vbtv.vercel.app/api/bookings';
const CARS_API = 'https://ride-wave-vbtv.vercel.app/api/cars';
const API_URL = 'https://ride-wave-vbtv.vercel.app/api/auth';

function toggleAdminSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadCars();
    loadBookings();
    loadStats();


    // Tab switch logic (Sidebar)
    window.switchTab = (tab) => {
        const fleetSec = document.getElementById('sectionFleet');
        const bookingsSec = document.getElementById('sectionBookings');
        const tabFleet = document.getElementById('tabFleet');
        const tabBookings = document.getElementById('tabBookings');

        if (tab === 'fleet') {
            fleetSec.style.display = 'block';
            bookingsSec.style.display = 'none';
            tabFleet.classList.add('active');
            tabBookings.classList.remove('active');
        } else {
            fleetSec.style.display = 'none';
            bookingsSec.style.display = 'block';
            tabFleet.classList.remove('active');
            tabBookings.classList.add('active');
            loadBookings();
            // Cacher le badge quand on consulte
            document.getElementById('bookingBadge').style.display = 'none';
        }
    };

    // Image Preview logic
    const imgInput = document.getElementById('carImageFile');
    const preview = document.getElementById('imagePreview');
    const hiddenImg = document.getElementById('carImage');

    imgInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
            };
            reader.readAsDataURL(file);
        }
    };

    // Form submission
    const formCar = document.getElementById('formCar');
    formCar.onsubmit = async (e) => {
        e.preventDefault();
        const carId = document.getElementById('carId').value;
        const file = imgInput.files[0];

        // Show loading state
        const btnText = document.getElementById('btnSubmitText');
        const originalText = btnText.innerText;
        btnText.innerText = 'Chargement...';

        try {
            let finalImageUrl = hiddenImg.value;

            // 1. Upload file if selected
            if (file) {
                const formData = new FormData();
                formData.append('image', file);
                const uploadRes = await fetch(`${CARS_API}/upload`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.SUCCESS) {
                    finalImageUrl = uploadData.imageUrl;
                } else {
                    afficherNotification('Erreur lors du téléchargement de l\'image', 'error');
                    btnText.innerText = originalText;
                    return;
                }
            }

            if (!finalImageUrl) {
                afficherNotification('Veuillez sélectionner une image', 'error');
                btnText.innerText = originalText;
                return;
            }

            const carData = {
                name: document.getElementById('carName').value,
                type: document.getElementById('carType').value,
                transmission: document.getElementById('carTransmission').value,
                price: parseInt(document.getElementById('carPrice').value),
                image: finalImageUrl
            };

            let res;
            if (carId) {
                // Update
                res = await fetch(`${CARS_API}/${carId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(carData)
                });
            } else {
                // Create
                res = await fetch(`${CARS_API}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(carData)
                });
            }

            const data = await res.json();
            if (data.SUCCESS) {
                afficherNotification(carId ? 'Véhicule mis à jour !' : 'Véhicule ajouté !', 'success');
                fermerModales();
                loadCars();
            } else {
                afficherNotification(data.message, 'error');
            }
        } catch (err) {
            afficherNotification('Erreur lors de l\'enregistrement', 'error');
        } finally {
            btnText.innerText = originalText;
        }
    };
});

async function checkAdminAuth() {
    try {
        const res = await fetch(`${API_URL}/check-auth`, { credentials: 'include' });
        const data = await res.json();
        if (!data.SUCCESS || data.user.role !== 'admin') {
            window.location.href = 'index.html';
        } else {
            document.getElementById('adminName').innerText = data.user.name;
        }
    } catch (err) {
        window.location.href = 'index.html';
    }
}

async function loadCars() {
    try {
        const res = await fetch(CARS_API, { credentials: 'include' });
        const data = await res.json();
        if (data.SUCCESS) {
            renderTable(data.data);
        }
    } catch (err) {
        console.error('Erreur chargement voitures');
    }
}

function renderTable(cars) {
    const tbody = document.getElementById('carsTableBody');
    tbody.innerHTML = '';
    cars.forEach(car => {
        const isEnService = car.status === 'en service';
        const tr = document.createElement('tr');
        if (isEnService) tr.classList.add('car-in-service');

        tr.innerHTML = `
            <td><img src="${car.image}" class="car-img-td" alt="${car.name}"></td>
            <td>${car.name}</td>
            <td>${car.type}</td>
            <td>${car.transmission}</td>
            <td>${car.price.toLocaleString()} CFA</td>
            <td>
                <span class="status-badge ${car.status || 'disponible'}">${car.status || 'disponible'}</span>
                <br>
                <button class="btn-status-toggle" onclick="toggleCarStatus('${car._id}', '${car.status}')">
                    Changer
                </button>
            </td>
            <td class="td-actions">
                <div class="btn-action btn-edit" onclick="ouvrirModaleEdition('${car._id}')">
                    <i class="bx bx-edit"></i>
                </div>
                <div class="btn-action btn-delete" onclick="supprimerVoiture('${car._id}')">
                    <i class="bx bx-trash"></i>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadStats() {
    try {
        const res = await fetch(`${BOOKINGS_API}/stats`, { credentials: 'include' });
        const data = await res.json();
        if (data.SUCCESS) {
            const stats = data.data;
            document.getElementById('statTotalCars').innerText = stats.totalCars;
            document.getElementById('statPendingBookings').innerText = stats.pendingBookings;
            document.getElementById('statInService').innerText = stats.carsInService;
            document.getElementById('statTotalRevenue').innerText = `${stats.totalRevenue.toLocaleString()} CFA`;
        }
    } catch (err) {
        console.error('Erreur chargement stats');
    }
}

window.toggleCarStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'en service' ? 'disponible' : 'en service';
    try {
        const res = await fetch(`${CARS_API}/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.SUCCESS) {
            afficherNotification(`Statut mis à jour : ${newStatus}`, 'success');
            loadCars();
            loadStats();
        }
    } catch (err) {
        afficherNotification('Erreur mise à jour statut', 'error');
    }
}


// Global functions for UI
window.ouvrirModaleAjout = () => {
    document.getElementById('modalTitle').innerText = 'Ajouter un Véhicule';
    document.getElementById('formCar').reset();
    document.getElementById('carId').value = '';
    document.getElementById('carImage').value = '';
    document.getElementById('imagePreview').innerHTML = '<span style="color: var(--container-color); font-size: 0.8rem;">Aucun fichier</span>';
    document.getElementById('btnSubmitText').innerText = 'Ajouter';
    document.getElementById('superpositionModale').classList.add('active');
    document.getElementById('modalCar').classList.add('active');
}

window.ouvrirModaleEdition = async (id) => {
    try {
        const res = await fetch(CARS_API);
        const data = await res.json();
        const car = data.data.find(c => c._id === id);

        if (car) {
            document.getElementById('modalTitle').innerText = 'Modifier le Véhicule';
            document.getElementById('carId').value = car._id;
            document.getElementById('carName').value = car.name;
            document.getElementById('carType').value = car.type;
            document.getElementById('carTransmission').value = car.transmission;
            document.getElementById('carPrice').value = car.price;
            document.getElementById('carImage').value = car.image;
            document.getElementById('imagePreview').innerHTML = `<img src="${car.image}" style="width: 100%; height: 100%; object-fit: contain;">`;
            document.getElementById('btnSubmitText').innerText = 'Mettre à jour';

            document.getElementById('superpositionModale').classList.add('active');
            document.getElementById('modalCar').classList.add('active');
        }
    } catch (err) {
        afficherNotification('Erreur chargement données', 'error');
    }
}

window.supprimerVoiture = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
        try {
            const res = await fetch(`${CARS_API}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.SUCCESS) {
                afficherNotification('Véhicule supprimé', 'success');
                loadCars();
            }
        } catch (err) {
            afficherNotification('Erreur suppression', 'error');
        }
    }
}

window.fermerModales = () => {
    document.getElementById('superpositionModale').classList.remove('active');
    document.getElementById('modalCar').classList.remove('active');
    document.getElementById('modalBookingAction').classList.remove('active');
}


// Shared notification logic
function afficherNotification(message, type = 'success') {
    const conteneurNotifications = document.getElementById('conteneurNotifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: glisserVersGauche 0.3s ease-out;
        pointer-events: auto;
    `;

    notification.innerHTML = `
        <i class="bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}" style="font-size: 20px;"></i>
        <span>${message}</span>
    `;

    conteneurNotifications.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        notification.style.transition = '0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

window.logout = async () => {
    try {
        await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = 'index.html';
    } catch (err) {
        window.location.href = 'index.html';
    }
}

// === BOOKING MANAGEMENT ===
async function loadBookings() {
    try {
        const res = await fetch(`${BOOKINGS_API}/admin`, { credentials: 'include' });
        const data = await res.json();
        if (data.SUCCESS) {
            renderBookingsTable(data.data);

            // Notification "Lumière Jaune"
            const hasPending = data.data.some(b => b.status === 'en attente');
            const badge = document.getElementById('bookingBadge');
            if (badge) {
                badge.style.display = hasPending ? 'block' : 'none';
            }
        }
    } catch (err) {
        console.error('Erreur chargement réservations');
    }
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Aucune réservation trouvée</td></tr>';
        return;
    }

    bookings.forEach(b => {
        // Sécurité : Vérifier si le véhicule ou l'utilisateur existe encore
        const carName = b.car ? b.car.name : '<Véhicule Supprimé>';
        const carType = b.car ? b.car.type : 'N/A';
        const userName = b.user ? b.user.name : '<Utilisateur Inconnu>';
        const userEmail = b.user ? b.user.email : 'N/A';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${userName}</strong><br>
                <small>${userEmail}</small><br>
                <small>${b.phone || 'Pas de numéro'}</small>
            </td>
            <td>
                <strong>${carName}</strong><br>
                <small>${carType}</small><br>
                <small style="color: var(--main-color); font-weight: bold;">${(b.totalPrice || 0).toLocaleString()} F CFA</small>
            </td>
            <td>
                <small><strong>Lieu:</strong> ${b.pickupLocation || 'N/A'}</small><br>
                <small><strong>Du:</strong> ${b.startDate ? new Date(b.startDate).toLocaleDateString('fr-FR') : '?'}</small><br>
                <small><strong>Au:</strong> ${b.endDate ? new Date(b.endDate).toLocaleDateString('fr-FR') : '?'}</small>
            </td>
            <td>
                <div style="display: flex; gap: 10px;">
                    ${b.driverLicense ? `
                        <a href="http://localhost:3000/${b.driverLicense}" target="_blank" class="btn-action-doc" title="Voir Permis">
                            <i class="bx bx-id-card"></i> Permis
                        </a>
                    ` : '<small>Pas de permis</small>'}
                    ${b.idCard ? `
                        <a href="http://localhost:3000/${b.idCard}" target="_blank" class="btn-action-doc" title="Voir CNI">
                            <i class="bx bx-file"></i> CNI
                        </a>
                    ` : '<small>Pas de CNI</small>'}
                </div>
            </td>
            <td><span class="status-badge ${b.status}">${b.status}</span></td>
            <td class="td-actions">
                ${b.status === 'en attente' || b.status === 'confirmé' ? `
                    <div class="btn-action btn-confirm" onclick="ouvrirModaleActionReservation('${b._id}', '${b.status}')" title="Gérer">
                        <i class="bx bx-cog"></i>
                    </div>
                ` : '---'}
            </td>


        `;
        tbody.appendChild(tr);
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'confirmé': return '#4CAF50';
        case 'annulé': return '#f44336';
        default: return '#FF9800';
    }
}

window.ouvrirModaleActionReservation = async (id, status) => {
    try {
        const res = await fetch(`${BOOKINGS_API}/admin`, { credentials: 'include' });
        const data = await res.json();
        const booking = data.data.find(b => b._id === id);

        if (booking) {
            const content = document.getElementById('bookingDetailsContent');
            content.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border: 1px solid #eee;">
                    <p><strong>Client:</strong> ${booking.user ? booking.user.name : 'N/A'}</p>
                    <p><strong>Véhicule:</strong> ${booking.car ? booking.car.name : 'N/A'}</p>
                    <p><strong>Total:</strong> <span style="color: var(--main-color); font-weight: bold;">${(booking.totalPrice || 0).toLocaleString()} F CFA</span></p>
                    <p><strong>Période:</strong> ${new Date(booking.startDate).toLocaleDateString()} au ${new Date(booking.endDate).toLocaleDateString()}</p>
                </div>
            `;

            const modal = document.getElementById('modalBookingAction');
            const cancelGroup = document.getElementById('cancelReasonGroup');
            cancelGroup.style.display = 'none';

            const btnConfirm = document.getElementById('btnConfirmBooking');
            const btnRefuse = document.getElementById('btnRefuseBooking');

            if (booking.status === 'confirmé') {
                btnConfirm.innerText = 'Terminer la location';
                btnConfirm.style.background = '#2196F3'; // Blue for finishing
                btnConfirm.onclick = () => executerActionBooking(id, 'terminé');
                btnRefuse.style.display = 'none'; // Cannot refuse already confirmed
            } else {
                btnConfirm.innerText = 'Confirmer';
                btnConfirm.style.background = '#4CAF50';
                btnConfirm.style.display = 'block';
                btnRefuse.style.display = 'block';
                btnConfirm.onclick = () => executerActionBooking(id, 'confirmé');
                btnRefuse.onclick = () => {
                    cancelGroup.style.display = 'block';
                    btnRefuse.onclick = () => {
                        const reason = document.getElementById('cancelReason').value;
                        if (!reason) {
                            afficherNotification('Veuillez donner une raison', 'error');
                            return;
                        }
                        executerActionBooking(id, 'annulé', reason);
                    };
                };
            }

            document.getElementById('superpositionModale').classList.add('active');
            modal.classList.add('active');

        }
    } catch (err) {
        afficherNotification('Erreur chargement détails', 'error');
    }
}

async function executerActionBooking(id, status, cancelReason = '') {
    try {
        const res = await fetch(`${BOOKINGS_API}/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, cancelReason })
        });
        const data = await res.json();
        if (data.SUCCESS) {
            afficherNotification(`Réservation ${status} !`, 'success');
            fermerModales();
            loadBookings();
            loadStats();
            loadCars(); // reload cars to see the status change
        }
    } catch (err) {
        afficherNotification('Erreur mise à jour', 'error');
    }
}

