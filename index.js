$(document).ready(function () {
    let loginItem = sessionStorage.getItem("loginItem");
    if (loginItem == 'success') {
        window.location.href = './main.html';
    }
});

$('#loginForm').on('submit', function (e) {
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/login'
    fetch(url, { method: 'POST', body: JSON.stringify({ string: $('#passInput').val() }) })
        .then(res => res.json())
        .then(data => {
            if (data == 'success') {
                sessionStorage.setItem('loginItem', 'success');
                window.location.href = './main.html';
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


