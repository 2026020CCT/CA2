const itemForm = document.getElementById('item-form');
const formMessage = document.getElementById('form-message');

const isSignedIn = Boolean(sessionStorage.getItem('token'));
document.getElementById('register-link').hidden = isSignedIn;
document.getElementById('logout-link').hidden = !isSignedIn;
document.getElementById('cart-link').hidden = !isSignedIn;
document.getElementById('profile-link').hidden = !isSignedIn;

document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
});

itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formMessage.textContent = '';
    formMessage.className = '';

    try {
        const formData = new FormData(itemForm);
        const response = await fetch('/api/items', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not save the item.');
        }

        formMessage.textContent = 'Item saved successfully.';
        formMessage.className = 'success';
        itemForm.reset();
    } catch (error) {
        formMessage.textContent = error.message || 'Could not connect to the server.';
        formMessage.className = 'error';
    }
});
