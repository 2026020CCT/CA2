document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const accountSwitch = document.getElementById('remember-switch');
    const switchContainer = document.getElementById('remember-switch-container');
    const loginMessage = document.getElementById('message');
    const registerMessage = document.getElementById('message1');
    const accountStatus = document.getElementById('account-status');
    const logoutButton = document.getElementById('logout-button');

    const navigation = {
        addItem: document.getElementById('add-item-link'),
        basket: document.getElementById('cart-link'),
        profile: document.getElementById('profile-link'),
        register: document.getElementById('register-link'),
        logout: document.getElementById('logout-link')
    };

    function setFormMode(isRegistering) {
        loginForm.hidden = isRegistering;
        registerForm.hidden = !isRegistering;
        accountSwitch.checked = isRegistering;
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    }

    function setNavigationForSignedInUser(isSignedIn) {
        navigation.addItem.hidden = !isSignedIn;
        navigation.basket.hidden = !isSignedIn;
        navigation.profile.hidden = !isSignedIn;
        navigation.register.hidden = isSignedIn;
        navigation.logout.hidden = !isSignedIn;
    }

    async function readResponse(response) {
        try {
            return await response.json();
        } catch {
            throw new Error('The server returned an invalid response. Please try again.');
        }
    }

    async function submitForm(form, endpoint, messageElement, progressMessage) {
        messageElement.textContent = progressMessage;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const formData = new FormData(form);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData.entries()))
            });
            const result = await readResponse(response);

            if (!response.ok) {
                messageElement.textContent = result.error || 'The request could not be completed.';
                return null;
            }

            return result;
        } catch (error) {
            console.error(`Request to ${endpoint} failed:`, error);
            messageElement.textContent = error.message || 'Could not reach the server. Please try again.';
            return null;
        } finally {
            submitButton.disabled = false;
        }
    }

    setNavigationForSignedInUser(Boolean(sessionStorage.getItem('token')));

    if (sessionStorage.getItem('token')) {
        switchContainer.hidden = true;
        loginForm.hidden = true;
        registerForm.hidden = true;
        accountStatus.textContent = 'You are already signed in. Use the navigation to view your account or log out.';
    } else {
        setFormMode(false);
    }

    accountSwitch.addEventListener('change', () => {
        setFormMode(accountSwitch.checked);
    });

    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;

        const result = await submitForm(loginForm, '/api/login', loginMessage, 'Signing in…');
        if (!result) return;

        if (!result.token || !result.user) {
            loginMessage.textContent = 'The server returned an invalid login response.';
            return;
        }

        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        window.location.assign('/');
    });

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!registerForm.reportValidity()) return;

        const result = await submitForm(
            registerForm,
            '/api/register',
            registerMessage,
            'Creating your account…'
        );
        if (!result) return;

        const email = registerForm.elements.email.value;
        registerForm.reset();
        setFormMode(false);
        loginForm.elements.email.value = email;
        loginMessage.textContent = 'Account created. You can now sign in.';
    });
});
