$(document).ready(function () {
    let expItem = localStorage.getItem("expItem");
    if (Date.now() - expItem * 1 < 86400000) {
        window.location.href = './main.html';
    }
});

$('#loginForm').on('submit', function (e) {
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/login'
    fetch(url, { method: 'POST', body: JSON.stringify({ string: $('#passInput').val() }) })
        .then(res => res.json())
        .then(string => {
            if (string !== 'failed') {
                const fetchOpRef = {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${string}`
                    }
                }
                fetch('https://realm.mongodb.com/api/client/v2.0/auth/session', fetchOpRef).then(res => res.json())
                    .then(data => {
                        localStorage.setItem('loginItem', JSON.stringify(data));
                        localStorage.setItem('expItem', Date.now());
                        window.location.href = './main.html';
                    })
            }
            else {
                $('#passInput').addClass('myInputPassErr');
            }
        }).catch(err => {
            console.log(err);
        })
});

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


