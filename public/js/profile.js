const profileName = document.getElementById('profile-name');
const profileFullName = document.getElementById('profile-full-name');
const profileEmail = document.getElementById('profile-email');
const profileAvatar = document.getElementById('profile-avatar');
const loginLink = document.getElementById('profile-login-link');
const registerLink = document.getElementById('register-link');
const logoutLink = document.getElementById('logout-link');
const addItemLink = document.getElementById('add-item-link');

let user;
try {
    user = JSON.parse(sessionStorage.getItem('user') || 'null');
} catch (error) {
    console.error('Could not read saved profile:', error);
    user = null;
}

if (
    sessionStorage.getItem('token') &&
    user &&
    typeof user.name === 'string' &&
    typeof user.email === 'string'
) {
    profileName.textContent = `Hello, ${user.name}`;
    profileFullName.textContent = user.name;
    profileEmail.textContent = user.email;
    profileAvatar.textContent = user.name.trim().charAt(0).toUpperCase() || '?';
    loginLink.hidden = true;
    registerLink.hidden = true;
    logoutLink.hidden = false;
    addItemLink.hidden = false;
} else {
    profileName.textContent = 'Welcome';
    profileFullName.textContent = 'Sign in to see your account';
    profileEmail.textContent = '—';
    loginLink.hidden = false;
    registerLink.hidden = false;
    logoutLink.hidden = true;
    addItemLink.hidden = true;
}

document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
});
