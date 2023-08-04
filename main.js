
const urlCors = "https://mycorspass.up.railway.app/";
// const urlCors ="https://mywebapp.abcworker.workers.dev/";
// const urlCors = 'https://cors-proxy.fringe.zone/';
// const urlCors = 'https://api.codetabs.com/v1/proxy?quest=';
// const urlTransWorker = "https://ggtrans.abcworker.workers.dev/";
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
  $('#tomatoButton').css('margin-right', '6px');
});

$('#tomatoText').click(function (e) {
  resetHandler();
  $('#tomatoButton').css('margin-right', '0px');
});

let historyImgArr = [];
const fetchRenderImgBackground = () => {
  $.get(urlCors + mainPageUrl, function (html) {
    let newLink = $(html).find('.also__list li:nth-child(1) a').attr('href');
    $.get(urlCors + newLink, function (html) {
      let imgSrcGet = $(html).find('.main-image img:first').attr('srcset');
      let imgDescGet = $(html).find(".main-description__wrapper")[0]

      historyImgArr.unshift({ img: imgSrcGet, desc: imgDescGet });
      if (historyImgArr.length > 4) {
        historyImgArr.pop();
      }

      $('#imgSrc').attr('srcset', imgSrcGet);
      $('#imgSrcBlurred').attr('srcset', imgSrcGet);
      $('#imgDesc').html(imgDescGet);
    });
  });

}

let slideImgIndex = 0;
const showImage = (n) => {
  $('#imgSrc').attr('srcset', historyImgArr[n].img);
  $('#imgSrcBlurred').attr('srcset', historyImgArr[n].img);
  $('#imgDesc').html(historyImgArr[n].desc);
}

const showNextSlice = () => {
  if (slideImgIndex == 0) { fetchRenderImgBackground() }
  if (slideImgIndex > 0) {
    slideImgIndex--;
    showImage(slideImgIndex)
  }
}
showNextSlice();

const showPreviousSlice = () => {
  if (historyImgArr.length > 1) {
    slideImgIndex++;
    if (slideImgIndex < historyImgArr.length) {
      showImage(slideImgIndex);
    }
    else slideImgIndex = historyImgArr.length - 1;
  }
}


$('.tabButton').click(function (e) {
  showTab(this.name)
});

const showTab = (tab) => {
  $('.city').hide();
  $(`#${tab}`).show();
  $('.footerBtn').removeClass("footerBtnActive");
  $(`.tabButton[name="${tab}"]`).addClass("footerBtnActive");
}

$(document).keydown(function (e) {
  if (e.keyCode == 37) {
    fetchAndRenderMonthImg();
    showTab('tab1');
  }
  if (e.keyCode == 39) {
    fetchAndRenderCalendarData();
    showTab('tab2');
  }
});

$('.footerBtn').click(function (e) {
  $('.footerBtn').removeClass("footerBtnActive");
  $(this).addClass("footerBtnActive");
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

$('.footerBtnToggleRight').mouseover(function () {
  $('.toogleItemRight').removeClass('toogleItemShowRight');
  $('.toogleItemRight').addClass('toogleItemShowRight');
  rightBtnSwitch = true;
});

$('.footerBtn[name="tab1"]').click(function (e) {
  fetchAndRenderMonthImg();
});

$('.footerBtn[name="tab2"]').click(function (e) {
  fetchAndRenderCalendarData();
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
