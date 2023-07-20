const ggsUrl = 'https://script.google.com/macros/s/AKfycbzhnbLXUrN8pwJ6F7osVhCSUQSOvAw4C3F6qFODuzRJ_0XRv6Me7Uojm8R-b26k1HmvkA/exec'

$(document).ready(function () {
    let loginItem = sessionStorage.getItem("loginItem");
    if (loginItem == 'success') {
        window.location.href = './main.html';
    }
});

$('#loginForm').on('submit', function (e) {
    fetch(ggsUrl + '?action=setLogin', { method: 'POST', body: JSON.stringify({ string: $('#passInput').val() }) })
        .then(res => res.text())
        .then(data => {
            if (data == 'success') {
                sessionStorage.setItem('loginItem', 'success');
                window.location.href = './index.html';
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