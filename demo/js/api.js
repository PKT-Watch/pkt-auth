(function (API) {
    const baseUrl = 'http://127.0.0.1:3001';

    API.register = async (address) => {
        let response;
        let json;
        let url = `${baseUrl}/register?address=${address}`;

        console.log(url);

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
                return json;
            }
        } else {
            console.log(`HTTP Response Code: ${response?.status}`)
        }
    }
}(window.API = window.API || {}));