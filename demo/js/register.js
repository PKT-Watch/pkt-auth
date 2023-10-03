
const registerPktAddress = document.querySelector('#registerPktAddress');
const btnRegister = document.querySelector('#btnRegister');

btnRegister.addEventListener('click', async e => {
    e.preventDefault();
    const address = registerPktAddress.value;
    if (address === '') return;
    
    let url = `http://127.0.0.1:3001/register?address=${address}`;
    let response;
    let json;
    try {
        response = await fetch(url);
        json = await response.text();
    } catch (error) {
        if (error instanceof SyntaxError) {
            // Unexpected token < in JSON
            //console.log('There was a SyntaxError', error);
        } else {
            console.log('There was an error', error);
        }
    }

    if (response?.ok) {
        if (json) {
            const user = json;
            console.log('User registered', user);
        }
    } else {
        if (response?.status === 400) {
            console.log('Address is already registered. Try loggin in.');
        }
        console.log(`HTTP Response Code: ${response?.status}`)
    }
});