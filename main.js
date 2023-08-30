
const proxyArr = [
  { link: "https://mywebapp.abcworker.workers.dev/", active: true },
  { link: "https://cors-proxy.fringe.zone/", active: false },
  { link: "https://api.codetabs.com/v1/proxy?quest=", active: false },
  { link: "none", active: false }
]
let urlCors = proxyArr[0].link;
const mainPageUrl = "https://www.getdailyart.com/en/21/paul-signac/the-red-buoy-saint-tropez";
const ggsUrl = 'https://script.google.com/macros/s/AKfycbyLGSgS2kd2i5gLEH-cfuAsOxgj7pFCu1qaFQEDCP11nXbBVViA4P-KP008NZ8r1d7G7g/exec'



const START_MINUTES = "06";
const START_SECOND = "00";
let duration;
let notifyMessageFlag = false;
let timerTimeout = null;
let tickTimeout = null;



const renderTomatoTick = () => {
  let timeCount = parseInt(START_SECOND, 10) + 60 * parseInt(START_MINUTES, 10);

  function tick() {
    let t = 60;
    if (timeCount > 0) {
      tickTimeout = setTimeout(tick, t * 1000);
      $('#tomatoText').show();
      $('#tomatoText').text(timeCount / 60 + 'm');
      timeCount = timeCount - t;
      const audioEl = document.getElementById("tts-audio");
      audioEl.src = 'https://mobcup.net/va/Eebd354329c9608a5b5544cb04c7996b9';
      audioEl.volume = 0.01;
      audioEl.play();
    }
    else {
      $('#tomatoText').text('');
      $('#tomatoText').hide();
      clearTimeout(tickTimeout);
      return;
    }
  }
  tick();
}


const startHandler = () => {
  $('#tomatoText').show();
  $('#tomatoButton').css('margin-right', '6px');
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();

  clearTimeout(timerTimeout);
  clearTimeout(tickTimeout);

  renderTomatoTick();

  timerTimeout = setTimeout(() => {
    $('#tomatoText').hide();
    $('#tomatoText').toggleClass('tomatoFocus');
    audioEl.src = 'https://mobcup.net/va/66kjwO3ODzg';
    audioEl.volume = 1;
    audioEl.play();
    $('.toogleItemLeft').removeClass('toogleItemShowLeft');
    $('.footerBtn').removeClass("footerBtnActive");
    setTimeout(() => {
      $('.toogleItemLeft').addClass('toogleItemShowLeft');
      $('.footerBtnToggleLeft').addClass("footerBtnActive");
    }, 500);
    showDesktopNotification();
  }, 360000);
}

const resetHandler = () => {
  clearTimeout(tickTimeout);
  clearTimeout(timerTimeout);
  $('#tomatoText').hide();
  $('#tomatoButton').css('margin-right', '0px');
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
}

const showDesktopNotification = () => {
  let bodyText = notifyMessageFlag ? "Start Focusing" : "Take a Short Break";
  const img = 'https://cdn-icons-png.flaticon.com/512/1790/1790418.png';
  const notification = new Notification(bodyText, {
    icon: img,
    requireInteraction: true  //requireInteraction In macos set notification Chrome to Alert not Banner
  })

  notification.addEventListener('click', (e) => {
    startHandler();
  })

  notification.onclose = (event) => {
    resetHandler();
  };
}

if (Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      showDesktopNotification();
    }
  })
}

$('#tomatoButton img').click(function (e) {
  startHandler();
});

$('#tomatoText').click(function (e) {
  resetHandler();
});

let historyImgArr = [];

const fetchImgLinkArr = () => {
  $.get(urlCors + mainPageUrl, function (html) {
    historyImgArr = $(html).find('.also__item > a').map(function () {
      return $(this).attr('href');
    }).get();
    fetchRenderImgBackground(0)
  });
}

fetchImgLinkArr();

const fetchRenderImgBackground = (numb) => {
  fetch(urlCors + historyImgArr[numb]).then(res => res.text())
    .then(data => {
      let regMainImg = new RegExp('<div class="main-image">\n<img srcset="((.|\n)+?) 800w,', 'i');
      let regMainDate = new RegExp('<span class="main-description__share-date round_btn">((.|\n)+?)</span>', 'i');
      let regMainTitle = new RegExp('<h1 class="main-description__title">((.|\n)+?)</h1>', 'i');
      let regMainAtt = new RegExp('<div class="main-description__attr">((.|\n)+?)</div>', 'i');
      let regMainAuthor = new RegExp('<ul class="main-description__authors">((.|\n)+?)</ul>', 'i');
      let regMainDesc = new RegExp('<div class="main-description__text-content">((.|\n)+?)</div>', 'i');

      let imgSrcGet = regMainImg.exec(data)[1]
      let imgDateGet = regMainDate.exec(data)[0]
      let imgTitleGet = regMainTitle.exec(data)[0]
      let imgAttGet = regMainAtt.exec(data)[0]
      let imgAuthorGet = regMainAuthor.exec(data)[0]
      let imgTextGet = regMainDesc.exec(data)[0]
      let imgDescGet = imgDateGet + imgTitleGet + imgAttGet + imgAuthorGet + imgTextGet;

      $('#imgSrc').attr('src', imgSrcGet);
      $('#imgSrcBlurred').attr('src', imgSrcGet);
      $('#imgDesc').html(imgDescGet);

    })
}

let slideImgIndex = 0;

const showImage = (n) => {
  if (n > historyImgArr.length - 1) {
    slideImgIndex = 0
  }
  if (n < 0) {
    slideImgIndex = historyImgArr.length - 1;
  }
  fetchRenderImgBackground(slideImgIndex);
}

$('.imgBtnLeft').click(function (e) {
  showImage(slideImgIndex += -1);
});

$('.imgBtnRight').click(function (e) {
  showImage(slideImgIndex += 1);
});

$('.footerBtn').click(function (e) {
  $('.footerBtn').removeClass("footerBtnActive");
  $(this).addClass("footerBtnActive");
  switch (this.name) {
    case 'tab1':
      showTab(1);
      break;
    case 'tab2':
      showTab(2);
      break;
    case 'tab3':
      showTab(3);
      break;
    default:
      break;
  }
});

let tabIndex = 1;
const showTab = (n) => {
  tabIndex = n;
  if (n > 3) {
    tabIndex = 1
  }
  if (n < 1) {
    tabIndex = 3;
  }
  $('.city').hide();
  $(`#tab${tabIndex}`).show();
  $('.footerBtn').removeClass("footerBtnActive");
  $(`.tabButton[name="tab${tabIndex}"]`).addClass("footerBtnActive");
  if (tabIndex == 1) {
    $('.toogleItemLeft').removeClass('toogleItemShowLeft');
    $('.toogleItemLeft').addClass('toogleItemShowLeft');
  }
  else {
    $('.toogleItemLeft').removeClass('toogleItemShowLeft');
  }

  switch (n) {
    case 1:
      break;
    case 2:
      fetchAndRenderCalendarData();
      break;
    case 3:
      break;
    default:
      break;
  }
}

$(document).keydown(function (e) {
  // console.log(e.keyCode);
  if (e.keyCode == 27) {
    handleDelete();
    $('#searchInput').focus();
  }
  if ($(e.target).is('input,select')) return;
  switch (e.keyCode) {
    case 37:
      showTab(tabIndex += -1);
      break;
    case 39:
      showTab(tabIndex += 1);
      break;
    case 38:
      if (tabIndex == 2) {
        showSlides(slideIndex += 1);
      }
      break;
    case 40:
      if (tabIndex == 2) {
        if (slideIndex == dataHistory.length) {
          $('#calendarContent').html('');
        }
        showSlides(slideIndex += -1);
      }
      break;
    case 78:
      fetchAndRenderMonthImg();
      break;

    default:
      break;
  }
});



$('.footerBtnToggleLeft').click(function (e) {
  $('.toogleItemLeft').toggleClass('toogleItemShowLeft');
});

let rightBtnSwitch = false;
showRightToggleItem = () => {
  if (rightBtnSwitch) {
    $('.toogleItemRight').removeClass('toogleItemShowRight');
    rightBtnSwitch = false;
  } else {
    $('.toogleItemRight').addClass('toogleItemShowRight');
    rightBtnSwitch = true;
  }
}

$('.footerBtnToggleRight').click(function (e) {
  showRightToggleItem();
});

$('.toogleItemRight').mouseover(function () {
  $('.toogleItemRight').removeClass('toogleItemShowRight');
  $('.toogleItemRight').addClass('toogleItemShowRight');
});

$('.toogleItemRight').mouseleave(function () {
  $('.toogleItemRight').removeClass('toogleItemShowRight');
});





// -------Zoomimage----------

let isActiveMode = false;

$(".zoom_image")
  .on("click", function () {
    (isActiveMode = !isActiveMode)
      ? ($(this).addClass("zoom_mode_active"),
        $(window).width() > 767
          ? $(this).children("img").css({ transform: "scale(3.5)" })
          : $(this).children("img").css({ transform: "scale(5)" }))
      : ($(this).removeClass("zoom_mode_active"),
        $(this).children("img").css({ transform: "scale(1)" }));
  })
  .on("mousemove", function (e) {
    $(this)
      .children("img")
      .css({
        "transform-origin":
          ((e.pageX - $(this).offset().left) / $(this).width()) * 100 +
          "% " +
          ((e.pageY - $(this).offset().top) / $(this).height()) * 100 +
          "%"
      });
  });

//get quote from sheets

const ggquote = 'https://script.google.com/macros/s/AKfycbwoQdwSwrevYk3Ml_61iehDX0NBqsbG5VBQqWoFZcLPPFfWMCed2rgd-JBitqXaymak/exec';

const fetchGetQuote = (num) => {
  fetch(ggquote + `?action=getBookmark&num=${num}`).then(res => res.json())
    .then(data => {
      let body = `
      <div class="explainContainer" style="font-size: 12px;line-height: 1rem;">
        <div class="explainHeader">
        <button class="closeBtn" onclick="handleDeleteQuote()">
           <img src="./img/close_circle.png" width="15" height="15">
        </button>
        </div>
        <div class="explainBody">
          <div class="wordType">
          <button class="quoteBtn" onclick="fetchGetQuote(-1)">
            <img src="./img/left.png" height="16">
          </button>
          <button class="quoteBtn" onclick="checkQuote(${!data.check})">
            ${data.check ? '<img src="./img/star.png" width="15">' : '<img src="./img/star-outline.png" width="15">'}
          </button>
          <button class="quoteBtn" onclick="fetchGetQuote(1)">
            <img src="./img/right.png" height="16">
          </button>
          <button class="quoteBtn" id="clipboardBtn" onclick="copyQuote()">
            <img src="./img/clipboard-none.png" height="16">
          </button>
          </div>
          <div id="quoteContent">${data.value}</div>
        </div>
      </div>  
        `
      $('#quoteBody').html(body);
    })
}

const handleDeleteQuote = () => {
  $('#quoteBody').html('');
}

const checkQuote = (check) => {
  fetch(ggquote + `?action=setBookmark&check=${check}`).then(res => res.text())
    .then(data => {
      fetchGetQuote(0)
    })
}

const copyQuote = () => {
  let textToCopy = $('#quoteContent').text();
  navigator.clipboard.writeText(textToCopy).then((res) => {
    $('#clipboardBtn').html('<img src="./img/clipboard.png" width="16">')
  })
}

const renderRssNews = () => {
  document.getElementById('quoteBody').innerHTML = `
  <div class="explainContainer" style="font-size: 12px;line-height: 1rem;">
  <div class="explainHeader">
  <button class="closeBtn" onclick="handleDeleteQuote()">
     <img src="./img/close_circle.png" width="15" height="15">
  </button>
  </div>
  <div class="explainBody">
  <div class="rssBtnContainer">
    <button class="rssBtn" onclick="renderRssNYT()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAPFBMVEVHcEwYGBgTExMSEhITExMSEhISEhISEhISEhISEhIaGhoSEhISEhISEhIUFBQSEhIUFBQTExMSEhISEhKEQ9J+AAAAFHRSTlMADkynKmHI4tT/BvG6ITywGYyZe8Y/Bk0AAADpSURBVHgBxdLBbkURFIXhBbBwgPd/10au2xbttP0GJvtPZAf8EyGVxkkY67wya2BpsAuenGIyAYCje/a55ZdoI0m5BZmnIzCkK8lHfvJ1CyS9BoRulovBpvoOPK0FwBTrXMo46I4RFYBhIHLGTSR66EZ2oFbcLDmy5a9BJ30NK5ADJx3JAvEKcmTDoc3JCjLniV0i2VYwa6+xcyTVO8BIAMIV2BWsLeS5JGMO34JHnVuSZXbteQWpHI81NWUwVSHU8VrCc7J1fT/PqLHRXJIqliQHDoObiEuOXNZdF9351gV+JnsppRv8rQ8S0A3fpn5NfAAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssNikkei()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAMFBMVEUAdr8AdL8ggcQAbrw6jMlLk8xcnNC71etyqNbo8/qRut4AZrna6vX///+nyeXN4PDis/X7AAABQklEQVR4AWOgChBgYGQUEAAhQSBgYGBUZhARUnQUCHAUcAhNUhFgYK4wsLRaONsmabal671n6QYMzG+DLa0Wz/5hdPqo6W9jkEDppJ1Wi8+9Fvq+WPRYIkigjNPGavG9yUK3JovOeggWMD0D1LJ80+l3W38bggWEc60WT96ZdNjS9aMCSGCpgIVE42ORB49FH/3/4WXAwGAIcpgBoyEQGRsK43Q9EDAawPmMgSDSYiFcQOiqAFCVzWW4gN11A0ZjYWFDY2OoLtu7jIJ/b26fvfbuYzCfubd3sd21OPvbr9pvgZVwn9wz2e4G9/7L1huugwVE7nFdM5p73/52zl2IgN3du/c3b3nbf+G+MliAUfaQUy1Xcm7/lXvbwALMa5uFfV/dvb/n9t87EBVAlwswsygLMJo4Qz0B8o2gACMQClInZgE033H1ovn+2QAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssSCMP()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAjUlEQVR4AWP4Q2NAZQtGLRi14O/fv/8pBkBDaGQBAhCy4PmK/6dY/5+VRUcnGCD6GXiDpXXi0RCDdMjEaSuJ88HTpUCzgHago2MwCxicGcSD0BGD94SpK6hlgRvQveiIwRvoA1pbMGrBqAWjFgz+ouIE3AJvBulwBhlUxOBPrA8oBzSvcIZYnTxqwagFAH35Im3PxoFeAAAAAElFTkSuQmCC">  
    </button>
    <button class="rssBtn" onclick="renderRssAlJaz()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAaVBMVEX6kAD8uFz6lAr7oSj8u2L7pzT92qn////+4777nBv/9ej9yYT8wG790pf6lQz+4bv+79r8xHj+8+P7qjv+37b9zo/9z5H+6s7916P9zIn7rUL93bD8tFP/+fH7rkb6mRX905v8xnz7pC4m+LyJAAAA30lEQVR4AazSNRLDUAAD0TXKzMz2/Q+ZPn/CefWOKvF/ls1Tjstzns8L4oVAPBdG4gnFCUp5JMuLsrKQxwOW6qaWg3gkUesiygdFqCDschCKMdGoJih7GEaEqReEQzHRMtMF3FvERJGsRNgSMgLZtU8xbruD1NP6RgD7aHWAI6zYnAjCgYopnvFAoRnM0nJwalKPeswgjlCJSkCC0AhCSRNzD1oRlRHU7pxcTopSwZbIvF4OWzOyqYnHSBUGPyaRo73yJbVgkuQzIB7yvCTTJRqHR5IKielxwClN3EZvAAAI0Arm0fKq0AAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssYahoo()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAaVBMVEVgAdJ8Ltrk1PeufujGpO7///+DOdxwG9b8+/7gzva0iOqZXOJmC9P07vzu5frbxvTAmu2jbOWqeOeUVOD49f1pENSWWOHo2/jr3/mlcOWRUOC7kuvWvvPYwvR2JNiIQd23jOrKq/DSuPJgXEy7AAAAsUlEQVR4Ad3SxRHDQBAEwDGImRnzD9Ijxiv/1Z9j3MWTvd70gdhXIhlCispxDWK6RAaETIvjtomNww4X9GHFgSeRj52AHWHEis1KjGRq7qXsyqaJNnKJChxk7HoD5bh1JVF9c62mHrc2E3Jx0nKsK6a7mqbga9SQE15RL6kFrjpp1E+/HONClkY53hLdxGm6ewIUojgFEnmA6aZajBs5xy0TYsMntRB7cVyt/+RQh6f6AanbCL/9Rz1bAAAAAElFTkSuQmCC">  
    </button>
    <button class="rssBtn" onclick="renderRssTheconversation()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACX0lEQVR4Ae1WA7AdMRRNbQxrM8krd5Pa7XjqjqtBjWFt22PWdke1bSWpbXNU5Ja76eJh36/+mVkF55y9uQHKRCaC8AmhrIJXrac4magYXisZPiAZPR58QRuyRjEyCfoCR+LCnVA2wWg3TXRTX59SvG4CV9xGLtepXlIyfAw6R3wdBe5A8UuM1tQN70UpbFx3QcNT/KKFi0lG7/h0fKJsvAzGVXI6OOiCfJGcbNDXay8u0LjAaFEz2bLoyr0eHR4qjrsct6wcKEFcrlOxoOR4uOZ472FiN2j+aCxYrL3ZSDFy/ovTFCGsqtU8I2uTNj8a6YLTZshTEjdzq24MewzJKQS4UJtW9Ah9dxQxNOcAU+eyFavgVfH0etOyuVHEuFyxYi7J6AvXMNu0LxiYa4zNepQmALfbAJmHJCerjQhMR2mCYHiB2wBeBhFYZRiYm7YIMDrbqQX7CxIcz3IWCkbXoTRBC252aWltJGzaz4jAc0iYqMX1YpZXc790aXHSC4m6Vcvqj4+GiQHRhx/3NjQ+XmGxUt8rjxnOXl+uQ0mKmsYOS54bBvY6p0cbj8XonuK0Rqri8JeaS/3Cz2lzY4qQbR4m3itGR12vWbNwosKwmAmb9NQczzx4V/k5veWzHb8VNt2iGJkRuh1DG0bWGKue46JnYaf03TQMx9FeNrn4I/G8cIHS/IbzKK9VskGVAmELRZ/ohfEBM+E8AScUCJEzAXXnccqiDZVNRn85ZjGyP+xYDsmsBRfpvgO/bLfx4qKNWznEd0A+oIyEFt0ERyc4A6KMhqpXuYSwyUwjSf4PfAZay1f064LokgAAAABJRU5ErkJggg==">  
    </button>
  </div>
  </div>`
}

const renderRssNYT = () => {
  $.get(urlCors + 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("item").each(function () {
      const el = $(this);
      let img = el.find('media\\:content, content').attr('url')
      let link = el.find("link").text();
      let title = el.find("title").text();
      let pubDate = el.find("pubDate").text();
      let description = el.find("description").text();

      let dt1 = new Date(pubDate);
      let dt2 = new Date(new Date().toISOString());

      let diff = (dt2.getTime() - dt1.getTime());
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let diffRes = hours + 1 + ' hours ago';
      if (hours >= 24) {
        let days = Math.floor(hours / 24);
        diffRes = days + ' day ago'
      }

      document.getElementById('contentBody').innerHTML += `
        <div class="rssCard">
          ${img ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`: ''}
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `
    })
  })
}


const renderRssNikkei = () => {
  $.get(urlCors + 'https://asia.nikkei.com/rss/feed/nar', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("item").each(function () {
      const el = $(this);
      let link = el.find("link").text();
      let title = el.find("title").text();
      fetch('https://jsonlink.io/api/extract?url=' + link).then(res => res.json())
        .then(html => {
          document.getElementById('contentBody').innerHTML += `
            <div class="rssCard">
                ${html.images[0] ? `<div class="rssCardImg" style="background-image: url('${html.images[0]}');">
                  </div>`: ''}
                <div class="rssCardText">
                  <a href="${link}" target="_blank">
                    <p class="rssCardTitle">${title}</p>
                    <p class="rssCardDescription">${html.description}</p>
                  </a>
                </div>
            </div>
        `
        })

    })
  })
}

const renderRssSCMP = () => {
  $.get(urlCors + 'https://www.scmp.com/rss/91/feed', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("item").each(function () {
      const el = $(this);
      let img = el.find("enclosure").last().attr('url')
      let link = el.find("link").text();
      let title = el.find("title").text();
      let pubDate = el.find("pubDate").text();
      let description = el.find("description").text();

      let dt1 = new Date(pubDate);
      let dt2 = new Date(new Date().toISOString());

      let diff = (dt2.getTime() - dt1.getTime());
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let diffRes = hours + 1 + ' hours ago';
      if (hours >= 24) {
        let days = Math.floor(hours / 24);
        diffRes = days + ' day ago'
      }

      document.getElementById('contentBody').innerHTML += `
        <div class="rssCard">
          ${img ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`: ''}
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `
    })
  })
}

const renderRssAlJaz = () => {
  $.get(urlCors + 'https://www.aljazeera.com/xml/rss/all.xml', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("item").each(function () {
      const el = $(this);
      let img = el.find("enclosure").last().attr('url')
      let link = el.find("link").text();
      let title = el.find("title").text();
      let pubDate = el.find("pubDate").text();
      let description = el.find("description").text();

      let dt1 = new Date(pubDate);
      let dt2 = new Date(new Date().toISOString());

      let diff = (dt2.getTime() - dt1.getTime());
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let diffRes = hours + 1 + ' hours ago';
      if (hours >= 24) {
        let days = Math.floor(hours / 24);
        diffRes = days + ' day ago'
      }

      fetch('https://jsonlink.io/api/extract?url=' + link).then(res => res.json())
        .then(html => {
          document.getElementById('contentBody').innerHTML += `
            <div class="rssCard">
                ${html.images[0] ? `<div class="rssCardImg" style="background-image: url('${html.images[0]}');">
                  </div>`: ''}
                <div class="rssCardText">
                  <p class="rssCardDate">${diffRes}</p>
                  <a href="${link}" target="_blank">
                    <p class="rssCardTitle">${title}</p>
                  </a>
                  <p class="rssCardDescription">${description}</p>
                </div>
            </div>
        `
        })


    })
  })
}

const renderRssYahoo = () => {
  $.get(urlCors + 'https://www.yahoo.com/news/rss', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("item").each(function () {
      const el = $(this);
      let link = el.find("link").text();
      let img = el.find('media\\:content, content').attr('url')
      let title = el.find("title").text();
      let pubDate = el.find("pubDate").text();

      let dt1 = new Date(pubDate);
      let dt2 = new Date(new Date().toISOString());

      let diff = (dt2.getTime() - dt1.getTime());
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let diffRes = hours + 1 + ' hours ago';
      if (hours >= 24) {
        let days = Math.floor(hours / 24);
        diffRes = days + ' day ago'
      }

      document.getElementById('contentBody').innerHTML += `
        <div class="rssCard">
          ${img ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`: ''}
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
            </div>
        </div>
      `
    })
  })
}

const renderRssTheconversation = () => {
  $.get(urlCors + 'https://theconversation.com/ca/articles.atom', function (data) {
    // console.log(data);
    document.getElementById('contentBody').innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete()">
      <img src="./img/close_circle.png" width="15" height="15">
    </button>
    </div>`
    $(data).find("entry").each(function () {
      const el = $(this);
      let link = el.find("link").attr('href');
      let title = el.find("title").text();
      let pubDate = el.find("published").text();
      let description = el.find("summary").text();

      let dt1 = new Date(pubDate);
      let dt2 = new Date(new Date().toISOString());

      let diff = (dt2.getTime() - dt1.getTime());
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let diffRes = hours + 1 + ' hours ago';
      if (hours >= 24) {
        let days = Math.floor(hours / 24);
        diffRes = days + ' day ago'
      }

      fetch('https://jsonlink.io/api/extract?url=' + link).then(res => res.json())
        .then(html => {
          document.getElementById('contentBody').innerHTML += `
          <div class="rssCard">
              ${html.images[0] ? `<div class="rssCardImg" style="background-image: url('${html.images[0]}');">
                </div>`: ''}
              <div class="rssCardText">
                <p class="rssCardDate">${diffRes}</p>
                <a href="${link}" target="_blank">
                  <p class="rssCardTitle">${title}</p>
                </a>
                <p class="rssCardDescription">${description}</p>
              </div>
          </div>
      `
        })
    })
  })
}
