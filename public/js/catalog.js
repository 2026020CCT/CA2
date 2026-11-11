const itemContainer = document.getElementById('item-container');
const basketStorageKey = 'basket';

function createProductCard(item) {
    const card = document.createElement('article');
    card.className = 'item';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'item-img';
    const image = document.createElement('img');
    image.src = `/images/${encodeURIComponent(item.pictureName)}`;
    image.alt = item.name;
    imageContainer.append(image);

    const details = document.createElement('div');
    details.className = 'item-info';
    const name = document.createElement('h2');
    name.textContent = item.name;
    const description = document.createElement('p');
    description.textContent = item.description;
    const price = document.createElement('p');
    price.textContent = `$${Number(item.price).toFixed(2)}`;
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-primary add-to-basket';
    addButton.textContent = 'Add to basket';
    addButton.dataset.itemId = item.id;

    details.append(name, description, price, addButton);
    card.append(imageContainer, details);
    return card;
}

async function loadCatalog() {
    try {
        const response = await fetch('/api/items');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not load items.');
        }

        itemContainer.replaceChildren();
        if (result.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'catalog-message';
            emptyMessage.textContent = 'No items are available yet.';
            itemContainer.append(emptyMessage);
            return;
        }

        itemContainer.append(...result.items.map(createProductCard));
    } catch (error) {
        itemContainer.replaceChildren();
        const errorMessage = document.createElement('p');
        errorMessage.className = 'catalog-message error';
        errorMessage.textContent = error.message || 'Could not connect to the server.';
        itemContainer.append(errorMessage);
    }
}

itemContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.add-to-basket');
    if (!button) return;

    const productCard = button.closest('.item');
    const productName = productCard.querySelector('h2').textContent;
    const productDescription = productCard.querySelector('.item-info p').textContent;
    const productPriceText = productCard.querySelector('.item-info p:nth-of-type(2)').textContent;
    const productImage = productCard.querySelector('img').getAttribute('src');
    const product = {
        id: button.dataset.itemId,
        name: productName,
        description: productDescription,
        price: Number(productPriceText.replace('$', '')),
        pictureName: decodeURIComponent(productImage.slice('/images/'.length)),
        quantity: 1
    };

    try {
        const basket = JSON.parse(localStorage.getItem(basketStorageKey) || '[]');
        if (!Array.isArray(basket)) {
            throw new Error('Your saved basket data is invalid.');
        }

        const existingItem = basket.find((item) => item.id === product.id);
        if (existingItem) {
            existingItem.quantity = Math.min(Number(existingItem.quantity) + 1, 99);
        } else {
            basket.push(product);
        }

        localStorage.setItem(basketStorageKey, JSON.stringify(basket));
        button.textContent = 'Added to basket';
        window.setTimeout(() => {
            button.textContent = 'Add to basket';
        }, 1200);
    } catch (error) {
        window.alert(error.message || 'Could not add this item to your basket.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const signedIn = Boolean(sessionStorage.getItem('token'));
    for (const id of ['register-link', 'logout-link', 'cart-link', 'profile-link', 'add-item-link']) {
        const link = document.getElementById(id);
        if (link) link.hidden = id === 'register-link' ? signedIn : !signedIn;
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        });
    }
});

loadCatalog();
