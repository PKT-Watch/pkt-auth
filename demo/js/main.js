const page = document.querySelector('.page');

// Register
const registerPktAddress = document.querySelector('#registerPktAddress');
const btnRegister = document.querySelector('#btnRegister');
const btnShouldLogin = document.querySelector('#btnShouldLogin');

// Request Login
const requestLoginPktAddress = document.querySelector('#requestLoginPktAddress');
const requestLoginPktAddressDisplay = document.querySelector('#requestLoginPktAddressDisplay');
const requestLoginMessage = document.querySelector('#requestLoginMessage');
const btnRequestLogin = document.querySelector('#btnRequestLogin');
const btnShouldRegister = document.querySelector('#btnShouldRegister');
const loginSteps = document.querySelectorAll('.login-step');

// Verify Signature
const verifySignature = document.querySelector('#verifySignature');
const authenticationToken = document.querySelector('#authenticationToken');
const btnVerifySignature = document.querySelector('#btnVerifySignature');

//const apiUrl = 'http://127.0.0.1:3001';
const apiUrl = 'https://auth.pkt.watch';

btnRegister.addEventListener('click', async _ => {
    const address = registerPktAddress.value;
    if (address === '') return;
    
    let url = `${apiUrl}/register?address=${address}`;
    let response;
    let json;
    try {
        response = await fetch(url);
        json = await response.json();
    } catch (error) {
        console.log('There was an error', error);
    }

    if (response?.ok) {
        if (json) {
            const user = json;
            console.log('User registered', user);
            changeMode();
        }
    } else {
        if (response?.status === 400) {
            console.log('Address is already registered. Try loggin in.');
        }
        console.log(`HTTP Response Code: ${response?.status}`)
    }
});

btnRequestLogin.addEventListener('click', async _ => {
    const address = requestLoginPktAddress.value;
    if (address === '') return;
    
    let url = `${apiUrl}/request-login?address=${address}`;
    let response;
    let json;
    try {
        response = await fetch(url);
        json = await response.text();
    } catch (error) {
        console.log('There was an error', error);
    }

    if (response?.ok) {
        if (json) {
            const authMessage = json;
            requestLoginMessage.value = authMessage;
            requestLoginPktAddressDisplay.value = address;
            console.log('Auth Message', authMessage);
            activateLoginStep(1);
        }
    } else {
        if (response?.status === 400) {
            console.log('User not found.');
        }
        console.log(`HTTP Response Code: ${response?.status}`)
    }
});

btnVerifySignature.addEventListener('click', async _ => {
    const address = requestLoginPktAddress.value;
    const signature = verifySignature.value;
    if (address === '' || signature === '') return;
    
    let url = `${apiUrl}/verify-signature`;
    let response;
    let json;
    let data = {
        address: address,
        signature: signature
    }
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(data)}
        );
        json = await response.text();
    } catch (error) {
        console.log('There was an error', error);
    }

    if (response?.ok) {
        if (json) {
            const token = json;
            console.log('Token', token);
            authenticationToken.value = token;
            activateLoginStep(2);
        }
    } else {
        if (response?.status === 401) {
            console.log('Authentication failed.');
        }
        console.log(`HTTP Response Code: ${response?.status}`)
    }
});

function activateLoginStep(index) {
    loginSteps.forEach(el => {
        el.classList.remove('active');
    });
    loginSteps[index].classList.add('active');
}

function changeMode() {
    page.classList.toggle('mode-login');
    page.classList.toggle('mode-register');
}

btnShouldLogin.addEventListener('click', _ => {
    changeMode();
    activateLoginStep(0);
});
btnShouldRegister.addEventListener('click', _ => {
    changeMode();
});