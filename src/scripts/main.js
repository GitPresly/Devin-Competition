// --- API ENDPOINTS ---
const API_BASE_URL = 'http://127.0.0.1:4000';
const PAINTINGS_URL = `${API_BASE_URL}/paintings`;
const TICKETS_URL = `${API_BASE_URL}/tickets`;
const PURCHASES_URL = `${API_BASE_URL}/purchases`;

// --- DOM ELEMENT VARIABLES ---
let galleryGridContainer, ticketOptionsContainer, modalTicketOptionsContainer, modal, closeModalBtn;
let mobileNavToggle, mobileNavClose, mobileNav, mobileNavLinks;
let step1, step2, step3;
let purchaseForm, formTicketType, formTicketPrice, successTicketPrice;

let selectedTicket = {};

// --- RENDER FUNCTIONS ---
function renderPaintings(paintings) {
    if (!galleryGridContainer) {
        console.error("CRITICAL ERROR: The gallery container element was not found!");
        return;
    }

    // This simplified version uses only the main image file from the API.
    // It will work once you rename your .png files to match the API's .jpg names (e.g., anihora.png).
    const htmlToRender = paintings.map(p => {
        // The API expects a .jpg, but your files are .png. We will use the base name and add .png.
        // This assumes you have renamed your files as per Solution 1.
        const imageName = p.image;

        return `
        <article class="artwork-card">
            <div class="artwork-header">
                <h4>${p.name}</h4>
                <span>(${p.year} Г.)</span>
            </div>
            
            <!-- Simplified to use only the .png file you have -->
            <img src="/paintings/${imageName}" alt="${p.name}" loading="lazy">

            <p>${p.description}</p>
        </article>
    `}).join('');

    galleryGridContainer.innerHTML = htmlToRender;
}

function renderTickets(tickets, container, cardClass) {
    if (!container) return;
    container.innerHTML = tickets.map(t => {
        const currencySymbol = t.currency === 'GBP' ? '£' : '$';
        if (cardClass === 'ticket-card') {
            return `
            <div class="ticket-card" data-id="${t.id}" data-type="${t.name}" data-price="${t.price}">
                <div class="ticket-info">
                    <p>ИЗЛОЖБА ИВАН МИЛЕВ // <br> 1 ЮЛИ – 12 АВГУСТ 2025 // <br> TATE MODERN, ЛОНДОН</p>
                    <span class="price">${currencySymbol}${t.price}</span>
                </div>
                <div class="ticket-action">
                    <h4>${t.name.toUpperCase()}</h4>
                    <button class="cta-button buy-ticket-btn">Купи билет</button>
                </div>
            </div>`;
        } else {
            return `
            <div class="ticket-card-modal" data-id="${t.id}" data-type="${t.name}" data-price="${t.price}">
                <div class="ticket-info">
                    <p>ИЗЛОЖБА ИВАН МИЛЕВ // <br> 1 ЮЛИ – 12 АВГУСТ 2025 // <br> TATE MODERN, ЛОНДОН</p>
                    <span class="price">${currencySymbol}${t.price}</span>
                </div>
                <div class="ticket-action">
                    <h4>${t.name.toUpperCase()}</h4>
                    <button class="cta-button-small">Избери</button>
                </div>
            </div>`;
        }
    }).join('');
}

// --- EVENT HANDLING & LOGIC ---
function setupEventListeners() {
    if (mobileNavToggle) mobileNavToggle.addEventListener('click', () => mobileNav.classList.add('is-open'));
    if (mobileNavClose) mobileNavClose.addEventListener('click', () => mobileNav.classList.remove('is-open'));
    mobileNavLinks.forEach(link => link.addEventListener('click', () => mobileNav.classList.remove('is-open')));
    document.body.addEventListener('click', (e) => { if (e.target.matches('.buy-ticket-btn')) openModal(); });
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modalTicketOptionsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.ticket-card-modal');
        if (!card) return;
        selectedTicket = { id: card.dataset.id, type: card.dataset.type, price: card.dataset.price };
        formTicketType.textContent = selectedTicket.type.toUpperCase();
        formTicketPrice.textContent = `£${selectedTicket.price}`;
        step1.style.display = 'none';
        step2.style.display = 'block';
    });
    purchaseForm.addEventListener('submit', handlePurchase);
}

function openModal() { modal.classList.add('is-open'); resetModal(); }
function closeModal() { modal.classList.remove('is-open'); }
function resetModal() { step1.style.display = 'block'; step2.style.display = 'none'; step3.style.display = 'none'; purchaseForm.reset(); }

async function handlePurchase(e) {
    e.preventDefault();
    const formData = new FormData(purchaseForm);
    const purchaseData = { ticketId: parseInt(selectedTicket.id), name: formData.get('name'), email: formData.get('email'), purchaseDate: new Date().toISOString() };
    try {
        const response = await fetch(PURCHASES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(purchaseData) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to complete purchase.'); }
        console.log('Purchase successful:', await response.json());
        successTicketPrice.textContent = `£${selectedTicket.price}`;
        step2.style.display = 'none';
        step3.style.display = 'block';
    } catch (error) { console.error('Error during purchase:', error); alert(`An error occurred: ${error.message}`); }
}

// --- INITIALIZATION ---
async function initializeApp() {
    // Assign DOM elements
    galleryGridContainer = document.getElementById('gallery-grid-container');
    ticketOptionsContainer = document.getElementById('ticket-options-container');
    modalTicketOptionsContainer = document.getElementById('modal-ticket-options-container');
    modal = document.getElementById('ticket-modal');
    closeModalBtn = document.getElementById('close-modal-btn');
    mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    mobileNavClose = document.querySelector('.mobile-nav-close');
    mobileNav = document.querySelector('.mobile-nav');
    mobileNavLinks = document.querySelectorAll('.mobile-nav a');
    step1 = document.getElementById('modal-step-1');
    step2 = document.getElementById('modal-step-2');
    step3 = document.getElementById('modal-step-3');
    purchaseForm = document.getElementById('purchase-form');
    formTicketType = document.getElementById('form-ticket-type');
    formTicketPrice = document.getElementById('form-ticket-price');
    successTicketPrice = document.getElementById('success-ticket-price');

    if (!closeModalBtn) { console.error("FATAL: Element with ID 'close-modal-btn' not found."); return; }

    try {
        const [paintingsResponse, ticketsResponse] = await Promise.all([fetch(PAINTINGS_URL), fetch(TICKETS_URL)]);
        if (!paintingsResponse.ok || !ticketsResponse.ok) { throw new Error('Failed to fetch initial data from the server.'); }
        const [paintings, tickets] = await Promise.all([paintingsResponse.json(), ticketsResponse.json()]);

        renderPaintings(paintings);
        renderTickets(tickets, ticketOptionsContainer, 'ticket-card');
        renderTickets(tickets, modalTicketOptionsContainer, 'ticket-card-modal');

        setupEventListeners();

    } catch (error) {
        console.error("A FATAL ERROR occurred during initialization:", error);
        if (galleryGridContainer) {
            galleryGridContainer.innerHTML = `<p style="color: red; text-align: center;">Грешка при зареждане на картините. Моля, проверете конзолата (F12).</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);