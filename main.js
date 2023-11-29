const proxyArr = [
  { link: "https://mywebapp.abcworker.workers.dev/", active: true },
  { link: "https://cors-proxy.fringe.zone/", active: false },
  { link: "https://api.codetabs.com/v1/proxy?quest=", active: false },
  { link: "none", active: false },
];
let URL_CORS = proxyArr[0].link;
const collectionsArr = [
  {
    name: "english",
    collection: "hoctuvung2",
    pass: "passed",
    history: "history",
    schedule: "schedule",
    active: true,
  },
  {
    name: "日本語",
    collection: "hoctuvung1",
    pass: "passed1",
    history: "history1",
    schedule: "schedule1",
    active: false,
  },
];
let CURRENT_COLLECTION = collectionsArr[0];
const MAIN_PAGE_URL =
  "https://www.getdailyart.com/en/21/paul-signac/the-red-buoy-saint-tropez";

const START_MINUTES = "06";
const START_SECOND = "00";
let duration;
let notifyMessageFlag = false;
let timerTimeout = null;
let tickTimeout = null;

const renderTomatoTick = () => {
  let timeCount = parseInt(START_SECOND, 10) + 60 * parseInt(START_MINUTES, 10);
  function tick() {
    let count = 0;
    let t = 60;
    if (timeCount > 0) {
      tickTimeout = setTimeout(tick, t * 1000);
      $("#tomatoText").show();
      $("#tomatoText").html(timeCount / 60 + "m");
      timeCount = timeCount - t;
      count++;
    } else {
      $("#tomatoText").text("");
      $("#tomatoText").hide();
      clearTimeout(tickTimeout);
      return;
    }
  }
  tick();
};

const startHandler = () => {
  const timeCount =
    parseInt(START_SECOND, 10) * 1000 + 60 * parseInt(START_MINUTES, 10) * 1000;
  $("#tomatoText").show();
  clearTimeout(timerTimeout);
  clearTimeout(tickTimeout);
  renderTomatoTick();
  timerTimeout = setTimeout(() => {
    $("#tomatoText").hide();
    showDesktopNotification();
    const audioEl = document.getElementById("tts-audio");
    audioEl.src = "./sound/Vivaldi Four Seasons Winter.mp3";
    audioEl.volume = 1;
    audioEl.play();
  }, timeCount);
};

const resetHandler = () => {
  clearTimeout(tickTimeout);
  clearTimeout(timerTimeout);
  $("#tomatoText").hide();
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
};

const showDesktopNotification = () => {
  let bodyText = notifyMessageFlag ? "Start Focusing" : "Take a Short Break";
  const img = "https://cdn-icons-png.flaticon.com/512/1790/1790418.png";
  const notification = new Notification(bodyText, {
    icon: img,
    requireInteraction: true, //requireInteraction In macos set notification Chrome to Alert not Banner
  });

  notification.addEventListener("click", (e) => {
    startHandler();
  });

  notification.onclose = (event) => {
    resetHandler();
    startAutoPlayWord();
  };
};

if (Notification.permission !== "granted") {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      showDesktopNotification();
    }
  });
}

$("#tomatoButton").click(function (e) {
  startHandler();
});

$("#tomatoText").click(function (e) {
  resetHandler();
});

let historyImgArr = [];

const fetchImgLinkArr = () => {
  $.get(URL_CORS + MAIN_PAGE_URL, function (html) {
    historyImgArr = $(html)
      .find(".also__item > a")
      .map(function () {
        return $(this).attr("href");
      })
      .get();
    fetchRenderImgBackground(0);
  });
};

fetchImgLinkArr();

const fetchRenderImgBackground = (numb) => {
  $.get(URL_CORS + historyImgArr[numb], function (html) {
    let imgSrcGet = $(html).find(".main-image img").attr("src");
    let imgDateGet = $(html).find(".main-description__share-date");
    let imgTitleGet = $(html).find(".main-description__title");
    let imgAttGet = $(html).find(".main-description__attr");
    let imgAuthorGet = $(html).find(".main-description__authors");
    let imgTextGet = $(html).find(".main-description__text-content");
    $("#imgSrc").attr("src", imgSrcGet);
    $("#imgSrcBlurred").attr("src", imgSrcGet);
    $("#imgDesc")
      .html(imgDateGet)
      .append(imgTitleGet, imgAttGet, imgAuthorGet, imgTextGet);
    // $(".mainFixedContent").css("background-image", "url(" + imgSrcGet + ")");
    $(".calendarFooterBlurImg").css(
      "background-image",
      "url(" + imgSrcGet + ")"
    );
    // $('.flashCardContainer').css('background-image', 'url(' + imgSrcGet + ')');
  });
};

let slideImgIndex = 0;

const showImage = (n) => {
  if (n > historyImgArr.length - 1) {
    slideImgIndex = 0;
  }
  if (n < 0) {
    slideImgIndex = historyImgArr.length - 1;
  }
  fetchRenderImgBackground(slideImgIndex);
};

$(".imgBtnLeft").click(function (e) {
  showImage((slideImgIndex += -1));
});

$(".imgBtnRight").click(function (e) {
  showImage((slideImgIndex += 1));
});

$(".footerBtn").click(function (e) {
  $(".footerBtn").removeClass("footerBtnActive");
  $(this).addClass("footerBtnActive");
  switch (this.name) {
    case "tab1":
      showTab(1);
      break;
    case "tab2":
      showTab(2);
      break;
    case "tab3":
      showTab(3);
      break;
    default:
      break;
  }
});

const showLastTimeLog = () => {
  let time = sessionStorage.getItem("lastTime");
  let date1 = new Date(time * 1);
  let date2 = new Date();
  let diff = date2.getTime() - date1.getTime();
  let msec = diff;
  let dd = Math.floor(msec / (1000 * 3600 * 24));
  msec -= dd * 1000 * 3600 * 24;
  let hh = Math.floor(msec / 1000 / 60 / 60);
  msec -= hh * 1000 * 60 * 60;
  let mm = Math.floor(msec / 1000 / 60);
  msec -= mm * 1000 * 60;
  let resMsg =
    dd > 0
      ? dd + " days ago"
      : hh > 0
        ? hh + " hours ago"
        : mm + " minutes ago";
  $(".timeLog").html("Last opened " + resMsg);
};

var tabIndex = 1;
const showTab = (n) => {
  tabIndex = n;
  if (n > 3) {
    tabIndex = 1;
  }
  if (n < 1) {
    tabIndex = 3;
  }
  $(".city").hide();
  $(`#tab${tabIndex}`).show();
  $(".footerBtn").removeClass("footerBtnActive");
  $(`.tabButton[name="tab${tabIndex}"]`).addClass("footerBtnActive");

  if (tabIndex == 2) {
    fetchAndRenderCalendarData();
    showLastTimeLog();
  }
};

var textInput = "";
$(document).keydown(function (e) {
  if ($(e.target).is("input,select")) return;
  switch (e.keyCode) {
    case 37:
      showTab((tabIndex += -1));
      break;
    case 39:
      showTab((tabIndex += 1));
      break;
    case 38:
      if (tabIndex == 2) {
        showSlides((slideIndex += 1));
        e.preventDefault();
      }
      break;
    case 40:
      if (tabIndex == 2) {
        if (slideIndex == dataHistory.length) {
          $("#calendarContent").html("");
        }
        showSlides((slideIndex += -1));
        e.preventDefault();
      }
      break;
    default:
      break;
  }
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
          "%",
      });
  });

//get quote from sheets

const ggquote = "https://script.google.com/macros/s/AKfycbwoQdwSwrevYk3Ml_61iehDX0NBqsbG5VBQqWoFZcLPPFfWMCed2rgd-JBitqXaymak/exec";
const fetchGetQuote = (num) => {
  fetch(ggquote + `?action=getBookmark&num=${num}`)
    .then((res) => res.json())
    .then((data) => {
      let body = `
      <div class="explainContainer">
        <div class="explainHeader">
        <button class="closeBtn closeBtnSVG" onclick="handleDelete('quoteContainer')">
          <i class='bx bx-x'></i>
        </button>
        </div>
        <div class="explainBody">
          <div class="quoteBtnContainer">
          <button class="quoteBtn" onclick="fetchGetQuote(-1)">
            <i class='bx bxs-left-arrow'></i>
          </button>
          <button class="quoteBtn quoteBtnBookmark" onclick="checkQuote(${!data.check})">
            ${data.check
          ? `<i class='bx bxs-book-bookmark' style="color: #f3f302;"></i>`
          : `<i class='bx bx-book-bookmark' ></i>`
        }
          </button>
          <button class="quoteBtn" onclick="fetchGetQuote(1)">
            <i class='bx bxs-right-arrow' ></i>
          </button>
          <button class="quoteBtn quoteBtnClipboard" id="clipboardBtn" onclick="copyQuote()">
            <i class='bx bx-copy'></i>
          </button>
          </div>
          <div id="quoteContent">${data.value}</div>
        </div>
      </div>  
        `;
      $("#quoteContainer").html(body);
    });
};

const checkQuote = (check) => {
  fetch(ggquote + `?action=setBookmark&check=${check}`)
    .then((res) => res.text())
    .then((data) => {
      fetchGetQuote(0);
    });
};

const copyQuote = () => {
  let textToCopy = $("#quoteContent").text();
  navigator.clipboard.writeText(textToCopy).then((res) => {
    $("#clipboardBtn").html(`<i class='bx bxs-copy' ></i>`);
  });
};

const renderRssNews = () => {
  document.getElementById("rssHeaderContainer").innerHTML = `
  <div class="explainContainer" style="font-size: 12px;line-height: 1rem;">
  <div class="explainHeader">
  <button class="closeBtn closeBtnSVG" onclick="handleDelete('rssHeaderContainer')">
    <i class='bx bx-x'></i>
  </button>
  </div>
  <div class="explainBody">
  <div class="rssBtnContainer">
    <button class="rssBtn" onclick="renderRssNYT()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAPFBMVEVHcEwYGBgTExMSEhITExMSEhISEhISEhISEhISEhIaGhoSEhISEhISEhIUFBQSEhIUFBQTExMSEhISEhKEQ9J+AAAAFHRSTlMADkynKmHI4tT/BvG6ITywGYyZe8Y/Bk0AAADpSURBVHgBxdLBbkURFIXhBbBwgPd/10au2xbttP0GJvtPZAf8EyGVxkkY67wya2BpsAuenGIyAYCje/a55ZdoI0m5BZmnIzCkK8lHfvJ1CyS9BoRulovBpvoOPK0FwBTrXMo46I4RFYBhIHLGTSR66EZ2oFbcLDmy5a9BJ30NK5ADJx3JAvEKcmTDoc3JCjLniV0i2VYwa6+xcyTVO8BIAMIV2BWsLeS5JGMO34JHnVuSZXbteQWpHI81NWUwVSHU8VrCc7J1fT/PqLHRXJIqliQHDoObiEuOXNZdF9351gV+JnsppRv8rQ8S0A3fpn5NfAAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssNikkei()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACwklEQVR4AbzUAQaEQBgF4CjUiI4QaA7QASIEhACCiBBdJSBAutECukUBCFnePpld7Ca1pccHmfH+fox2IA6l1NKDRnoqo/rWUqrOXhZJHU2EnSZ1xztTbFFNM+FPM9Uk6FA86gkX6Y9sw6eBcLGBfNqMt1l+3rC1CXHl2jf0ZNFPasJN6rXVz4SbzCTpk27PxSAI0DTNwjCMk0OwU8XZ+8hUVYV3TNM8O8CkurWUoCx/FkURyrJEkiSwbXt1ANd1kWUZ8jyHlHK1RAiBOI5RFAXCMISu699nUnrxVQYYCEVBFBUEEQSqpIQIRIK0gVCUkghEQEBrSFFaQ5uoUgpAS4gIIKqqkFK/bu7w8p++f3go79+5Zmbmyf4GTyKRwHq9hpnj8YhCofBn4Ha7QfH5fDAYDLSs5HI57HY7mFmtVojH42YDjC2PCHw+nwSz4vV6IZ1OiwE7aIJaqVQKz+cTVuz3e3i9XmWAseUlQ6/XA3m/32g0GvB4PMhms7heryDz+VwzMJ1OEYlE5MxmM5UJlkP95rfUoJZoUpt0u11lgLHlOcVyuQSZTCZanTqdDsjj8RARRTgc/t0JhUJQ1Go13O93kHa7rWlVq1U0m02Uy2X1n/FnYDQaaR9RRFGv16EIBoPqDhtSM0CzpNVqaVqlUkmymM/nNQN/JWDXsvszmQwulwsUsVhM0kyGwyH8fr8EH4/HWgkWiwXI+XyWiXK5XKKpStDv97US/JrwcDjADo4oG82uCdXCMgwDVpxOJwQCAa0Jbcdwu91qBjhqDCSZsBlDppvBzGw2GySTSX0M7RYRl0c0GkWlUpHjcDjUPaaaS8h2EbndbhSLRWleltPpdFouot8q/o6eGGonH0plRGc8F7XlS//qWHWAGySYgJOOTTKuAW2UDmizfAh0TBCAi4pdM04GCoAqBZ1TNUKGD3j3HAAm9vfIGp6+kgAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssSCMP()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAjUlEQVR4AWP4Q2NAZQtGLRi14O/fv/8pBkBDaGQBAhCy4PmK/6dY/5+VRUcnGCD6GXiDpXXi0RCDdMjEaSuJ88HTpUCzgHago2MwCxicGcSD0BGD94SpK6hlgRvQveiIwRvoA1pbMGrBqAWjFgz+ouIE3AJvBulwBhlUxOBPrA8oBzSvcIZYnTxqwagFAH35Im3PxoFeAAAAAElFTkSuQmCC">  
    </button>
    <button class="rssBtn" onclick="renderRssWSP()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADbQS4qAAAAEXRSTlMAWI8Iov/xgTwWudt0McmxRlLFJScAAADUSURBVHgBzdEFloQwAATRRioGkfufdpOHs+7TOPlxPUq6ftBbGXmnPuZtMILVmuH8WD/kAK8wSfLMqglmUFSHW0UCl2Gq5TQRwPi5A8oCMoSOKmwPROcMuBCrYwGh0QgsjbUa2FnaQa5g/cwb6E7ApxvoDZQDRLiAGOAC8h0YO13AfB9DVLgAKVyBXgLuAOVF0EtUVkHSwuwJjEB2BuhykNQ3W42p+hBWE9Cv5Q2cNlkzrSQvf+hTBcvA9pTj7soySO/1WhYgfQuM9k2QRsm/BYr+NE9POwppQTNhSQAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssAlJaz()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAclBMVEX///9sbGwAAABFRUWWlpa2trYAAAAAAAAtLS2Hh4cuLi6lpaWFhYVsbGxFRUXV1dVXV1ctLS2qqqp3d3eqqqpWVlbCwsLCwsJra2v29vbr6+uWlpZWVlZ4eHizs7Ph4eHPz8////+GhoampqbR0dGzs7OhBokDAAAAJnRSTlMBR///XQfD371tjUsvh6sHX/8VewObK/////////////////8dPTLMEPAAAAEuSURBVHgBfVJHcsQwDHOo7b3ZlEVVKvn/F+PCg+viCgiFo2IJP6A2xRdsdwD7w3FdcIIGjeS8wl8ag15yXQ0Q7G/rASAx9xn/EAPBc8q/xvz+PeE/E75cKyA4TN9P+H1VCFCfTmK+WKB+TrlpgKFWYt1zKUBMPNhA5NYXBhcxUfRrC9BFxZgwexaD8yiAqDYu15454bMXjO3RmNj4q2BQK9sJhn8qWuJYp5SfiI1QzzuEjCmZzIpCikpKHEcKYKPRsmFn4anVzIJ0JueVagqoJ/cm+9/BCpet5RxSh2dzpPMBYFDTOHK+Z03w+/KvKO7l8JTUWJuGjZ7IaznB5jzc6Vs+k/fEz7KYA11qUKecGeC4IAg6Cagpt+rQwOhlQWYR1A7gvCAgEkG0AKOf9A81wB9aDk7trQAAAABJRU5ErkJggg==">  
    </button>
    <button class="rssBtn" onclick="renderRssYahoo()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAMFBMVEUAAAACJ2IDKGAEJ2EFKWIHJ18AJ18DJ2ErSnpGYYtjeZ3Ezdrp7PF+ka6jscX////L9Dq8AAAACHRSTlMBYJnh/yAggEFSUK0AAAEaSURBVHgBTJElVEVBEIYHj2jHqTj12Y879IP1g/aEQ8MLXnB3l4L39OprVHyYuXbut/6t75JBWHpBIC+OHBoKoGSRRTgsOsggWvuHlgEEmklpA8rPX8ZHQ0CRNaDs6qcX1Rwyh0QAQf4CoDZHRI/08T2AUV6GX2YAWyxVoFzzZtmz7I25F0JQRApFoob5G0qliBxKQhXzH5SyXsBHGZhj/oWNnwoQdIuAiHfmL5cArtwCjqhYFQA4U8qlOHWvoZsti7C3tYXfPpgtfNSol/12hFcfVC7niBSKAoJStUUdUYbO2bdEqf2En4YYN54wqkCe6KdXxAkCdSQ0AhVXj71zJ0AhCToEmFkGjAFKDCxSnM+GEsgkh/8hJQcA9drEYU3H20EAAAAASUVORK5CYII=">  
    </button>
    <button class="rssBtn" onclick="renderRssTheconversation()">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACB0lEQVR4Ae3TA4xkWRiA0bVtK1jbwdq2bW+wtm2Mbdu2bdu2Gv+cSaom3TepcVxfcsKHy922o3z58h3Na/zBMxxKthN5i994lAPZpR1HEwoJNlCZgzmLbhQTrOWvXT2ID4jEeh7kByKxhnvZZZUhSL3NFywiEm+yQ+3PU/zPH1zFtwSp17iRiUQJRTzDLfzDv9zNXmyxPfiCNUTGJD5iNulPHuUnIjGcj5lHZCzlObbY+cwkEi1oRpSwgqv5iEj8Ry8iMZTjydk9bCASy6jKKiJjKifzIAVExhwqsI5ILOZicnYeMwhSdelOZPTmQC5hMZFRi1YEqUEcR8724H1WEYlZNKSIoBa7czxjCFbxHwuJxEIeY4sdzBm8xEgiUYuxBF+zqf1oS9CZukSiN49wMvvnmvlTdGciLfiGOqwhMkbThvSeVyb4jwlExnLK8w0dmEhLbqBUtzGfKGEJVfiacQQFNGA+z5DtLyZQg2KCoXxGDVYQJYzmPEp9IEgV05PPaUgBfWnDjWR7l4r0YT3V+ZyBRA6vsLl/iS2Yyz98y1iqcDLZLqMCI/mK/1lIbMEbbO4xVhNbUEgHPuUp9iXbfjzHZ3SjiNiCxVxLqQ98yCwKcigkmMInHE62I/ic6QSFFOQwk7fYi1LtyXncz0Nb8Aj3cSzZjud+HmFL7z7AefiXlC9fvnwbAdT9MQ6KtWmjAAAAAElFTkSuQmCC">  
    </button>
  </div>
  </div>`;
};

const renderRssNYT = () => {
  $.get(
    URL_CORS + "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let img = el.find("media\\:content, content").attr("url");
          let link = el.find("link").text();
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};

const renderRssNikkei = () => {
  $.get(
    URL_CORS + "https://abcnews.go.com/abcnews/usheadlines",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let img = el.find("media\\:thumbnail, thumbnail").attr("url");
          let link = el.find("link").text();
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};

const renderRssSCMP = () => {
  $.get(URL_CORS + "https://www.scmp.com/rss/91/feed", function (data) {
    // console.log(data);
    document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
        <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
    $(data)
      .find("item")
      .each(function () {
        const el = $(this);
        let img = el.find("enclosure").last().attr("url");
        let link = el.find("link").text();
        let title = el.find("title").text();
        let pubDate = el.find("pubDate").text();
        let description = el.find("description").text();

        let dt1 = new Date(pubDate);
        let dt2 = new Date(new Date().toISOString());

        let diff = dt2.getTime() - dt1.getTime();
        let hours = Math.floor(diff / (1000 * 60 * 60));
        let diffRes = hours + 1 + " hours ago";
        if (hours >= 24) {
          let days = Math.floor(hours / 24);
          diffRes = days + " day ago";
        }

        document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
            ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
            : ""
          }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
      });
  });
};

const renderRssAlJaz = () => {
  $.get(
    URL_CORS + "https://www.newyorker.com/feed/news",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let img = el.find("media\\:thumbnail, thumbnail").attr("url");
          let link = el.find("link").text();
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};

const renderRssYahoo = () => {
  $.get(
    URL_CORS + "https://www.theguardian.com/us-news/rss",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let img = el.find("media\\:content, content").attr("url");
          let link = el.find("link").text();
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};

const renderRssTheconversation = () => {
  $.get(
    URL_CORS + "https://feeds.nbcnews.com/nbcnews/public/world",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
    <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let img = el.find("media\\:thumbnail, thumbnail").attr("url");
          let link = el.find("link").text();
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};

const renderRssWSP = () => {
  $.get(
    URL_CORS +
    "https://feeds.washingtonpost.com/rss/politics?itid=lk_inline_manual_2",
    function (data) {
      // console.log(data);
      document.getElementById("rssContainer").innerHTML += `
    <div class="rssCardHeader">
        <button class="closeBtn" onclick="handleDelete('rssContainer')">
      <i class='bx bx-x'></i>
    </button>
    </div>`;
      $(data)
        .find("item")
        .each(function () {
          const el = $(this);
          let link = el.find("link").text();
          let img = el.find("media\\:thumbnail, content").attr("url");
          let title = el.find("title").text();
          let pubDate = el.find("pubDate").text();
          let description = el.find("description").text();

          let dt1 = new Date(pubDate);
          let dt2 = new Date(new Date().toISOString());

          let diff = dt2.getTime() - dt1.getTime();
          let hours = Math.floor(diff / (1000 * 60 * 60));
          let diffRes = hours + 1 + " hours ago";
          if (hours >= 24) {
            let days = Math.floor(hours / 24);
            diffRes = days + " day ago";
          }

          document.getElementById("rssContainer").innerHTML += `
        <div class="rssCard">
          ${img
              ? `<div class="rssCardImg" style="background-image: url('${img}');">
          </div>`
              : ""
            }
            <div class="rssCardText">
              <p class="rssCardDate">${diffRes}</p>
              <a href="${link}" target="_blank">
                <p class="rssCardTitle">${title}</p>
              </a>
              <p class="rssCardDescription">${description}</p>
            </div>
        </div>
      `;
        });
    }
  );
};
