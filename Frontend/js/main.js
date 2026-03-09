
document.addEventListener('DOMContentLoaded', function () {

    // ouvrir l'input de recherche
    let search = document.querySelector('.search-box');

    document.querySelector(".search-icon").onclick = () => {
        search.classList.toggle('active');
    }

    // ouverture et fermeture du menu 
    let menu = document.querySelector(".menu-icon");

    menu.onclick = () => {
        menu.classList.toggle("move");
        document.querySelector(".nav-liens").classList.toggle("active");
    }

    // ===== GESTION DES FORMULAIRES =====

    // Inscription
    const formInscription = document.getElementById('formulaireInscription');
    if (formInscription) {
        formInscription.onsubmit = async (e) => {
            e.preventDefault();
            const prenom = document.getElementById('prenomInscription').value;
            const nom = document.getElementById('nomInscription').value;
            const email = document.getElementById('emailInscription').value;
            const phone = document.getElementById('telephoneInscription').value;
            const password = document.getElementById('motDePasseInscription').value;
            const confirmPassword = document.getElementById('confirmerMotDePasse').value;

            if (password !== confirmPassword) {
                return afficherNotification('Les mots de passe ne correspondent pas', 'error');
            }

            try {
                const res = await fetch(`${API_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name: `${prenom} ${nom}`, email, password, phone })
                });
                const data = await res.json();
                if (data.SUCCESS) {
                    afficherNotification('Inscription réussie ! Veuillez vérifier votre e-mail.', 'success');
                    ouvrirVerification();
                } else {
                    afficherNotification(data.message, 'error');
                }
            } catch (err) {
                afficherNotification('Erreur lors de l\'inscription', 'error');
            }
        };
    }

    // Connexion
    const formConnexion = document.getElementById('formulaireConnexion');
    if (formConnexion) {
        formConnexion.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailConnexion').value;
            const password = document.getElementById('motDePasseConnexion').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.SUCCESS) {
                    afficherNotification('Connexion réussie !', 'success');
                    fermerToutesLesModales();
                    mettreAJourUI(data.data.user);
                } else {
                    afficherNotification(data.message, 'error');
                }
            } catch (err) {
                afficherNotification('Erreur lors de la connexion', 'error');
            }
        };
    }

    // Vérification Email
    const formVerification = document.getElementById('formulaireVerification');
    if (formVerification) {
        formVerification.onsubmit = async (e) => {
            e.preventDefault();
            const code = document.getElementById('codeVerification').value;

            try {
                const res = await fetch(`${API_URL}/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ code })
                });
                const data = await res.json();
                if (data.SUCCESS) {
                    afficherNotification('Compte vérifié avec succès !', 'success');
                    fermerToutesLesModales();
                    checkAuth(); // Refresh user state
                } else {
                    afficherNotification(data.message, 'error');
                }
            } catch (err) {
                afficherNotification('Erreur lors de la vérification', 'error');
            }
        };
    }

    // Check auth state
    checkAuth();
    loadCarsHome();

    // Formulaire Mot de passe oublié
    const formForgotPassword = document.getElementById('formulaireMotDePasseOublie');
    if (formForgotPassword) {
        formForgotPassword.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailMotDePasseOublie').value;
            const btn = formForgotPassword.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Envoi en cours...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.SUCCESS) {
                    afficherNotification('Lien de réinitialisation envoyé ! Vérifiez votre e-mail.', 'success');
                    fermerModales();
                } else {
                    afficherNotification(data.message, 'error');
                }
            } catch (err) {
                afficherNotification('Erreur réseau', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };
    }
});

async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/check-auth`, {
            credentials: 'include'
        });
        const data = await res.json();
        if (data.SUCCESS) {
            mettreAJourUI(data.user);
        }
    } catch (err) {
        console.log('Utilisateur non connecté');
    }
}

function mettreAJourUI(user) {
    const navDroit = document.querySelector('.nav-droit');
    const navLiens = document.querySelector('.nav-liens');
    const loginBtn = document.querySelector('.login-btn');
    const signUpBtn = document.querySelector('.sign-up-btn');

    // Nettoyer les anciens éléments de menu mobile s'ils existent
    const existingMobileMenu = document.querySelector('.mobile-user-menu');
    if (existingMobileMenu) existingMobileMenu.remove();

    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-user-menu';

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signUpBtn) signUpBtn.style.display = 'none';

        // Version Desktop
        let userInfo = document.querySelector('.user-info-nav');
        if (!userInfo) {
            userInfo = document.createElement('div');
            userInfo.className = 'user-info-nav';

            const userText = document.createElement('span');
            userText.innerText = `Salut, ${user.name.split(' ')[0]}!`;

            const btnReservations = document.createElement('a');
            btnReservations.href = 'dashboard.html';
            btnReservations.innerHTML = '<i class="bx bx-list-ul"></i> <span>Mes Réservations</span>';
            btnReservations.className = 'nav-lien-desk';
            btnReservations.style.cssText = 'cursor: pointer; color: var(--main-color); text-decoration: none; display: flex; align-items: center; gap: 5px; font-size: 0.9rem;';

            const logoutBtnDesk = document.createElement('div');
            logoutBtnDesk.innerHTML = '<i class="bx bx-log-out"></i>';
            logoutBtnDesk.style.cssText = 'cursor: pointer; font-size: 20px; color: var(--main-color);';
            logoutBtnDesk.onclick = logout;

            if (user.role === 'admin') {
                const adminLinkDesk = document.createElement('a');
                adminLinkDesk.href = 'admin.html';
                adminLinkDesk.className = 'nav-lien-desk';
                adminLinkDesk.innerHTML = '<i class="bx bx-shield-quarter"></i> Admin';
                adminLinkDesk.style.cssText = 'color: #f44336; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 5px; margin-right: 10px;';
                userInfo.appendChild(adminLinkDesk);
            }

            userInfo.appendChild(userText);
            userInfo.appendChild(btnReservations);
            userInfo.appendChild(logoutBtnDesk);
            navDroit.appendChild(userInfo);
        }

        // Version Mobile (dans le menu burger)
        const userGreet = document.createElement('p');
        userGreet.style.fontWeight = '600';
        userGreet.style.marginBottom = '10px';
        userGreet.innerText = `Salut, ${user.name}!`;
        mobileMenu.appendChild(userGreet);

        if (user.role === 'admin') {
            const adminLinkMob = document.createElement('a');
            adminLinkMob.href = 'admin.html';
            adminLinkMob.className = 'nav-lien';
            adminLinkMob.innerHTML = '<i class="bx bx-shield-quarter"></i> Admin Panel';
            mobileMenu.appendChild(adminLinkMob);
        }

        const resLinkMob = document.createElement('a');
        resLinkMob.href = 'dashboard.html';
        resLinkMob.className = 'nav-lien';
        resLinkMob.innerHTML = '<i class="bx bx-list-ul"></i> Mes Réservations';
        mobileMenu.appendChild(resLinkMob);

        const logoutLinkMob = document.createElement('a');
        logoutLinkMob.href = '#';
        logoutLinkMob.className = 'nav-lien';
        logoutLinkMob.style.color = 'var(--main-color)';
        logoutLinkMob.innerHTML = '<i class="bx bx-log-out"></i> Déconnexion';
        logoutLinkMob.onclick = (e) => { e.preventDefault(); logout(); };
        mobileMenu.appendChild(logoutLinkMob);

    } else {
        const userInfo = document.querySelector('.user-info-nav');
        if (userInfo) userInfo.remove();
        if (loginBtn) loginBtn.style.display = 'block';
        if (signUpBtn) signUpBtn.style.display = 'block';

        // Version Mobile - Login/Register
        const loginLinkMob = document.createElement('a');
        loginLinkMob.href = '#';
        loginLinkMob.className = 'nav-lien';
        loginLinkMob.innerHTML = '<i class="bx bx-log-in"></i> Connexion';
        loginLinkMob.onclick = (e) => { e.preventDefault(); fermerMenuMobile(); ouvrirConnexion(); };

        const subscribeLinkMob = document.createElement('a');
        subscribeLinkMob.href = '#';
        subscribeLinkMob.className = 'nav-lien';
        subscribeLinkMob.innerHTML = '<i class="bx bx-user-plus"></i> Inscription';
        subscribeLinkMob.onclick = (e) => { e.preventDefault(); fermerMenuMobile(); ouvrirInscription(); };

        mobileMenu.appendChild(loginLinkMob);
        mobileMenu.appendChild(subscribeLinkMob);
    }

    navLiens.appendChild(mobileMenu);
}

function fermerMenuMobile() {
    const menu = document.querySelector(".menu-icon");
    const navLinks = document.querySelector(".nav-liens");
    if (menu.classList.contains("move")) {
        menu.classList.remove("move");
        navLinks.classList.remove("active");
    }
}

async function logout() {
    try {
        const res = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.SUCCESS) {
            afficherNotification('Déconnexion réussie', 'success');
            mettreAJourUI(null);
            window.location.reload();
        }
    } catch (err) {
        afficherNotification('Erreur lors de la déconnexion', 'error');
    }
}

// ===== DYNAMIC CARS LOADING =====
async function loadCarsHome() {
    const louerContainer = document.querySelector('.louer-container');
    if (!louerContainer) return;

    try {
        const res = await fetch('https://ride-wave-vbtv.vercel.app/api/cars', { credentials: 'include' });
        const data = await res.json();
        if (data.SUCCESS) {
            renderCars(data.data);
        }
    } catch (err) {
        console.error('Erreur chargement véhicules:', err);
    }
}

function renderCars(cars) {
    const container = document.querySelector('.louer-container');
    container.innerHTML = ''; // Clear hardcoded cars

    cars.forEach(car => {
        const isEnService = car.status === 'en service';
        const box = document.createElement('div');
        box.className = 'louer-box';
        if (isEnService) {
            box.style.opacity = '0.5';
            box.style.filter = 'grayscale(80%)';
            box.style.pointerEvents = 'none';
        }
        box.innerHTML = `
                <div class="louer-top">
                    <h4>${car.type}</h4>
                    <i class="bx bx-heart"></i>
                </div>
                <img src="${car.image}" alt="${car.name}" class="louer-img">
                <h3>${car.name}</h3>
                <span>${car.transmission}</span>
                <div class="louer-btn-wrapper">
                    <p class="prix"> ${car.price.toLocaleString()} <span>F CFA</span></p>
                    <a href="javascript:void(0)" class="louer-btn" ${isEnService ? 'style="background: #ccc; cursor: not-allowed;"' : `onclick="ouvrirModaleReservation('${car._id}', '${car.name}', ${car.price})"`}>
                        ${isEnService ? 'Indisponible' : 'Louer'}
                    </a>
                </div>
        `;
        container.appendChild(box);
    });
}



// ===== GESTION DES POPUPS MODALES (Connexion / Inscription) =====

// Références aux éléments du DOM
const superposition = document.getElementById('superpositionModale');
const carteConnexion = document.getElementById('carteConnexion');
const carteInscription = document.getElementById('carteInscription');
const carteVerification = document.getElementById('carteVerification');
const carteMotDePasseOublie = document.getElementById('carteMotDePasseOublie');
const conteneurNotifications = document.getElementById('conteneurNotifications');

// API Base URL - Force absolute URL for backend on port 3000
const API_URL = 'https://ride-wave-vbtv.vercel.app/api/auth';

// ===== TOAST NOTIFICATIONS =====
function afficherNotification(message, type = 'success') {
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

    const icone = document.createElement('i');
    icone.className = type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle';
    icone.style.fontSize = '20px';

    const texte = document.createElement('span');
    texte.innerText = message;

    notification.appendChild(icone);
    notification.appendChild(texte);
    conteneurNotifications.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'glisserVersDroite 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation keyframes via JS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes glisserVersGauche { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes glisserVersDroite { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .modale-ouverte { overflow: hidden; }
`;
document.head.appendChild(styleSheet);

// Ouvrir la popup de vérification
function ouvrirVerification() {
    fermerToutesLesModales();
    superposition.classList.add('active');
    carteVerification.classList.add('active');
    document.body.classList.add('modale-ouverte');
}

// Ouvrir la popup de connexion
function ouvrirConnexion() {
    fermerToutesLesModales();
    superposition.classList.add('active');
    carteConnexion.classList.add('active');
    document.body.classList.add('modale-ouverte');
}

// Ouvrir la popup d'inscription
function ouvrirInscription() {
    fermerToutesLesModales();
    superposition.classList.add('active');
    carteInscription.classList.add('active');
    document.body.classList.add('modale-ouverte');
}

// Fermer toutes les modales
function fermerToutesLesModales() {
    superposition.classList.remove('active');
    carteConnexion.classList.remove('active');
    carteInscription.classList.remove('active');
    carteVerification.classList.remove('active');
    carteMotDePasseOublie.classList.remove('active');
    if (document.getElementById('carteReservation')) document.getElementById('carteReservation').classList.remove('active');
    document.body.classList.remove('modale-ouverte');
}

// Fermer les modales (appelée depuis les boutons)
function fermerModales() {
    fermerToutesLesModales();
}

// Ouvrir la popup mot de passe oublié
function ouvrirMotDePasseOublie(e) {
    if (e) e.preventDefault();
    fermerToutesLesModales();
    superposition.classList.add('active');
    carteMotDePasseOublie.classList.add('active');
    document.body.classList.add('modale-ouverte');
}

// Basculer de la connexion vers l'inscription
function basculerVersInscription(e) {
    e.preventDefault();
    carteConnexion.classList.remove('active');
    // Petit délai pour une transition fluide
    setTimeout(() => {
        carteInscription.classList.add('active');
    }, 100);
}

// Basculer de l'inscription vers la connexion
function basculerVersConnexion(e) {
    if (e) e.preventDefault();
    carteInscription.classList.remove('active');
    carteMotDePasseOublie.classList.remove('active');
    // Petit délai pour une transition fluide
    setTimeout(() => {
        carteConnexion.classList.add('active');
    }, 100);
}

// Basculer la visibilité du mot de passe
function basculerMotDePasse(idChamp, icone) {
    const champ = document.getElementById(idChamp);
    if (champ.type === 'password') {
        champ.type = 'text';
        icone.classList.remove('bx-hide');
        icone.classList.add('bx-show');
    } else {
        champ.type = 'password';
        icone.classList.remove('bx-show');
        icone.classList.add('bx-hide');
    }
}

// Fermer la modale en appuyant sur Échap
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        fermerModales();
    }
});

// Empêcher la propagation du clic dans la carte modale
document.querySelectorAll('.carte-modale').forEach(function (carte) {
    carte.addEventListener('click', function (e) {
        e.stopPropagation();
    });
});


// faqs

const accordionItems = document.querySelectorAll(".accordion-item");

accordionItems.forEach((item) => {
    const accordionHeader = item.querySelector(".accordion-header");

    accordionHeader.addEventListener("click", () => {

        const openItem = document.querySelector(".accordion-open");

        if (openItem && openItem !== item) {
            toggle(openItem);
        }
    });
});

const toggle = (item) => {
    const accordionContent = item.querySelector(".accordion-content");

    if (item.classList.contains("accordion-open")) {
        accordionContent.removeAttribute("style");
        item.classList.remove("accordion-open");
    }
    else {
        accordionContent.style.height = accordionContent.scrollHeight + "px";
        item.classList.add("accordion-open");
    }
}

// ===== BOOKING UI LOGIC (GLOBAL) =====
window.ouvrirModaleReservation = (carId, carName, carPrice) => {
    const userInfo = document.querySelector('.user-info-nav');
    if (!userInfo) {
        afficherNotification('Veuillez vous connecter pour louer un véhicule', 'error');
        ouvrirConnexion();
        return;
    }
    document.getElementById('nomVehiculeReservation').innerText = carName;
    document.getElementById('idVehiculeReservation').value = carId;
    document.getElementById('prixParJourReservation').value = carPrice;

    // Reset dates and price
    document.getElementById('dateDebutReservation').value = '';
    document.getElementById('dateFinReservation').value = '';
    document.getElementById('lieuRamassage').value = '';
    document.getElementById('montantTotalAffiche').innerText = '0 F CFA';

    document.getElementById('superpositionModale').classList.add('active');
    document.getElementById('carteReservation').classList.add('active');
    document.body.classList.add('modale-ouverte');
};

// Fonction de calcul du prix total
function calculerPrixTotal() {
    const debut = document.getElementById('dateDebutReservation').value;
    const fin = document.getElementById('dateFinReservation').value;
    const prixParJour = parseInt(document.getElementById('prixParJourReservation').value);
    const affiche = document.getElementById('montantTotalAffiche');

    if (debut && fin) {
        const d1 = new Date(debut);
        const d2 = new Date(fin);
        const diffTime = d2 - d1;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            const total = diffDays * prixParJour;
            affiche.innerText = `${total.toLocaleString()} F CFA`;
            return total;
        } else {
            affiche.innerText = 'Dates invalides';
            return 0;
        }
    }
    return 0;
}


// Initialiser le formulaire de réservation
document.addEventListener('DOMContentLoaded', () => {
    const formRes = document.getElementById('formulaireReservation');
    if (formRes) {
        // Ajout des écouteurs pour le calcul live
        document.getElementById('dateDebutReservation').onchange = calculerPrixTotal;
        document.getElementById('dateFinReservation').onchange = calculerPrixTotal;

        formRes.onsubmit = async (e) => {
            e.preventDefault();
            const carId = document.getElementById('idVehiculeReservation').value;
            const phone = document.getElementById('telephoneReservation').value;
            const pickupLocation = document.getElementById('lieuRamassage').value;
            const startDate = document.getElementById('dateDebutReservation').value;
            const endDate = document.getElementById('dateFinReservation').value;
            const license = document.getElementById('permisConduire').files[0];
            const idCard = document.getElementById('carteIdentite').files[0];

            const total = calculerPrixTotal();
            if (total <= 0) {
                afficherNotification('Veuillez sélectionner des dates valides', 'error');
                return;
            }

            if (!license || !idCard) {
                afficherNotification('Veuillez joindre tous les documents', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('carId', carId);
            formData.append('phone', phone);
            formData.append('pickupLocation', pickupLocation);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            formData.append('totalPrice', total);
            formData.append('driverLicense', license);
            formData.append('idCard', idCard);

            try {
                const res = await fetch('https://ride-wave-vbtv.vercel.app/api/bookings', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                const data = await res.json();
                if (data.SUCCESS) {
                    afficherNotification('Réservation envoyée avec succès !', 'success');
                    fermerModales();
                } else {
                    afficherNotification(data.message, 'error');
                }
            } catch (err) {
                afficherNotification('Erreur réseau lors de la réservation', 'error');
            }
        };
    }
});
