const basketItemsContainer = document.getElementById('basket-items');
const basketSubtotal = document.getElementById('basket-subtotal');
const basketMessage = document.getElementById('basket-message');
const checkoutButton = document.getElementById('checkout-button');
const basketStorageKey = 'basket';

function readBasket() {
    const basket = JSON.parse(localStorage.getItem(basketStorageKey) || '[]');
    if (!Array.isArray(basket)) {
        throw new Error('Your saved basket data is invalid.');
    }

    return basket.filter((item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0
    ).map((item) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        pictureName: typeof item.pictureName === 'string' ? item.pictureName : ''
    }));
}

function saveBasket(basket) {
    localStorage.setItem(basketStorageKey, JSON.stringify(basket));
}

function createBasketItem(item) {
    const row = document.createElement('article');
    row.className = 'basket-item';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'basket-item-image';
    const image = document.createElement('img');
    image.src = `/images/${encodeURIComponent(item.pictureName || '')}`;
    image.alt = item.name;
    imageContainer.append(image);

    const details = document.createElement('div');
    const name = document.createElement('h2');
    name.textContent = item.name;
    details.append(name);

    if (item.description) {
        const description = document.createElement('p');
        description.className = 'basket-item-description';
        description.textContent = item.description;
        details.append(description);
    }

    const price = document.createElement('p');
    price.className = 'basket-item-price';
    price.textContent = `$${Number(item.price).toFixed(2)} each`;
    details.append(price);

    const controls = document.createElement('div');
    controls.className = 'basket-item-controls';
    controls.setAttribute('aria-label', `Quantity controls for ${item.name}`);

    const quantityControl = document.createElement('div');
    quantityControl.className = 'quantity-control';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.action = 'decrease';
    decrease.dataset.itemId = item.id;
    decrease.setAttribute('aria-label', `Decrease ${item.name} quantity`);
    decrease.textContent = '−';
    const quantity = document.createElement('span');
    quantity.textContent = String(item.quantity);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.action = 'increase';
    increase.dataset.itemId = item.id;
    increase.setAttribute('aria-label', `Increase ${item.name} quantity`);
    increase.textContent = '+';
    quantityControl.append(decrease, quantity, increase);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-item';
    remove.dataset.action = 'remove';
    remove.dataset.itemId = item.id;
    remove.textContent = 'Remove';
    controls.append(quantityControl, remove);
    row.append(imageContainer, details, controls);
    return row;
}

function renderBasket() {
    try {
        const basket = readBasket();
        basketItemsContainer.replaceChildren();

        if (basket.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'basket-empty';
            const heading = document.createElement('h2');
            heading.textContent = 'Your basket is empty';
            const text = document.createElement('p');
            text.textContent = 'Browse the shop and add something you like.';
            const link = document.createElement('a');
            link.href = '/';
            link.textContent = 'Explore items';
            emptyState.append(heading, text, link);
            basketItemsContainer.append(emptyState);
        } else {
            basketItemsContainer.append(...basket.map(createBasketItem));
        }

        const subtotal = basket.reduce(
            (total, item) => total + Number(item.price) * Number(item.quantity),
            0
        );
        basketSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        checkoutButton.disabled = basket.length === 0;
        basketMessage.textContent = '';
    } catch (error) {
        basketItemsContainer.replaceChildren();
        basketMessage.textContent = error.message || 'Could not load your basket.';
        checkoutButton.disabled = true;
    }
}

basketItemsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    try {
        const basket = readBasket();
        const item = basket.find((entry) => entry.id === button.dataset.itemId);
        if (!item) return;

        if (button.dataset.action === 'remove') {
            saveBasket(basket.filter((entry) => entry.id !== item.id));
        } else if (button.dataset.action === 'increase' && item.quantity < 99) {
            item.quantity += 1;
            saveBasket(basket);
        } else if (button.dataset.action === 'decrease') {
            if (item.quantity <= 1) {
                saveBasket(basket.filter((entry) => entry.id !== item.id));
            } else {
                item.quantity -= 1;
                saveBasket(basket);
            }
        }

        renderBasket();
    } catch (error) {
        basketMessage.textContent = error.message || 'Could not update your basket.';
    }
});

document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
});

checkoutButton.addEventListener('click', () => {
    basketMessage.textContent = 'Checkout is not available yet.';
});

const isSignedIn = Boolean(sessionStorage.getItem('token'));
document.getElementById('register-link').hidden = isSignedIn;
document.getElementById('logout-link').hidden = !isSignedIn;
document.getElementById('add-item-link').hidden = !isSignedIn;

renderBasket();
