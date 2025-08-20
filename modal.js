const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");

function openModal(title, text) {
    modalTitle.innerText = title;
    modalText.innerHTML = text;
    modal.style.display = "block";

    // Reset scroll to top
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

// Close modal when clicking the close button
modalClose.onclick = () => {
    modal.style.display = 'none';
}

// Close modal when clicking outside modal content
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        modal.style.display = 'none';
    }
});