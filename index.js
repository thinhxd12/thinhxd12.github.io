$('#loginForm').on('submit', function (e) {
    handleSubmit();
});

const handleSubmit = () => {
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/login'
    fetch(url, { method: 'POST', body: JSON.stringify({ string: $('#passInput').val() }) })
        .then(res => res.json())
        .then(string => {
            if (string !== 'failed') {
                // console.log(string);
                getToken(string);
            }
            else {
                $('#passInput').addClass('myInputPassErr');
            }
        }).catch(err => {
            console.log(err);
        })
}

const getToken = (token) => {
    const decode = JSON.parse(atob(token.split('.')[1]));
    // console.log(decode.exp);
    if (decode.exp * 1000 < new Date().getTime()) {
        sessionStorage.clear("loginItem");
        localStorage.clear("expItem");
        let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/loginRefresh';
        fetch(url).then(res => res.json()).then(data => {
            // console.log(data);
            fetch(data.link, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: `{"token": "${data.value}"}`
            }).then(res => res.json())
                .then(data => {
                    // console.log(data);
                    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/loginUpdate';
                    fetch(url, {
                        method: 'POST',
                        body: JSON.stringify({ 'value': data.refresh_token })
                    }).then(res => res.json()).then(data => {
                        window.location.href = './index.html';
                        $('#passInput').val('').focus();
                    })
                })
        })


    }
    else {
        sessionStorage.removeItem('loginItem');
        sessionStorage.setItem('loginItem', token);
        localStorage.setItem('expItem', decode.exp * 1000);
        window.location.href = './main.html'
    }

}




$('#passInput').focus(function (e) {
    $(this).removeClass('myInputPassErr');
});

function checkShortcuts(event) {
    if (event.keyCode == 27) {
        $('#passInput').val('').focus();
        return false;
    }
}
document.onkeydown = checkShortcuts;


