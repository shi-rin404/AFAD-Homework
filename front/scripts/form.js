const form = document.querySelector(".form-container");
const modal = document.querySelector("#submit-modal");
const modalTitle = document.querySelector("#submit-modal-title");
const modalClose = document.querySelector("#submit-modal-close");

const showModal = (message) => {
  modalTitle.textContent = message;
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
};

const hideModal = () => {
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showModal("Gonderiliyor...");

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      body: new URLSearchParams(formData),
    });
    const message = await response.text();

    if (!response.ok) {
      showModal(message || "Sunucu hatasi.");
      return;
    }

    showModal(message || "Rapor alindi.");
    form.reset();
  } catch (error) {
    showModal("Baglanti hatasi.");
  }
});

modalClose.addEventListener("click", hideModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    hideModal();
  }
});
