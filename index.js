
const urlCors = "https://mycorspass.up.railway.app/";
// const urlCors = 'https://cors-proxy.fringe.zone/';
// const urlCors = 'https://api.codetabs.com/v1/proxy?quest=';
const mainPageUrl = "https://www.getdailyart.com/en/21/paul-signac/the-red-buoy-saint-tropez";
const ggsUrl = 'https://script.google.com/macros/s/AKfycbzhnbLXUrN8pwJ6F7osVhCSUQSOvAw4C3F6qFODuzRJ_0XRv6Me7Uojm8R-b26k1HmvkA/exec'


let historyImgArr = [];
const fetchRenderImgBackground = () => {
  $.get(urlCors + mainPageUrl, function (html) {
    let newLink = $(html).find('.also__list li:first a').attr('href');
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

let slideIndex = 0;
const showImage = (n) => {
  $('#imgSrc').attr('srcset', historyImgArr[n].img);
  $('#imgSrcBlurred').attr('srcset', historyImgArr[n].img);
  $('#imgDesc').html(historyImgArr[n].desc);
}

const showNextSlice = () => {
  if (slideIndex == 0) { fetchRenderImgBackground() }
  if (slideIndex > 0) {
    slideIndex--;
    showImage(slideIndex)
  }
}
showNextSlice();

const showPreviousSlice = () => {
  if (historyImgArr.length > 1) {
    slideIndex++;
    if (slideIndex < historyImgArr.length) {
      showImage(slideIndex);
    }
    else slideIndex = historyImgArr.length - 1;
  }
}


const autocomplete = (inp) => {
  var currentFocus;
  inp.addEventListener("input", function (e) {
    var a,
      b,
      i,
      val = this.value;

    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;

    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    document.getElementById('contentBody').innerHTML = '';
    document.getElementById('contentBody').appendChild(a);

    if (val.length > 2) {
      let arrFilter = dataSheets.filter(item => item.val.search(`^${val}.*$`) > -1);
      if (arrFilter.length == 0) {
        document.getElementById("transInput").value = val;
      }
      for (i = 0; i < arrFilter.length; i++) {
        let currentText = arrFilter[i].val.replace(/(.+?)\s(\||\-)(.+)/, "$1");
        let currentVal = arrFilter[i].val;
        let currentNumb = arrFilter[i].numb;
        let currentRow = arrFilter[i].row;

        b = document.createElement("a");
        b.setAttribute("class", "my-item");
        b.innerHTML = currentText;
        b.addEventListener("click", function (e) {
          inp.value = '';
          playTTSwithValue(currentText);
          renderFlashcard(currentVal, currentNumb, false);
          handleCheckWithRow(currentRow);
          getAllDataSheet();
          closeAllLists();
        });
        a.appendChild(b);
      }
    }

  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("a");
    if (e.keyCode == 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode == 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });


  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    x[currentFocus].classList.add("my-item-active");
  }

  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("my-item-active");
    }
  }

  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

autocomplete(document.getElementById("searchInput"));

function animationInterval(ms, callback) {
  const start = document?.timeline?.currentTime || performance.now()
  function frame(time) {
    if (!runned) return
    callback(time - start);
    scheduleFrame(time);
  }
  function scheduleFrame(time) {
    const elapsed = time - start;
    const roundedElapsed = Math.round(elapsed / ms) * ms;
    const targetNext = start + roundedElapsed + ms;
    const delay = targetNext - performance.now();
    setTimeout(() => requestAnimationFrame(frame), delay)
  }
  scheduleFrame(start)
}

$('#wordNum').click(function (e) {
  resetHandler();
});

$('#tomatoButton').click(function (e) {
  startHandler();
});

let START_MINUTES = "06";
let START_SECOND = "00";
let duration = parseInt(START_SECOND, 10) + 60 * parseInt(START_MINUTES, 10);
let runned = false;
let notifyMessageFlag = false;


const startHandler = () => {
  runned = true;
  animationInterval(1000, renderTimer);
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
}

const resetHandler = () => {
  $('#tomatoText').hide();
  runned = false;
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
}

const renderTimer = (time) => {
  let minutes, seconds;
  let innerTime = Math.floor(time / 1000);
  if (innerTime > duration) {
    resetHandler();
    $('#tomatoText').toggleClass('tomatoFocus');
    notifyMessageFlag = !notifyMessageFlag;
    $('#tts-audio').attr('src', 'https://mobcup.net/va/66kjwO3ODzg');
    document.getElementById("tts-audio").play();
    showDesktopNotification();
  }
  minutes = parseInt(innerTime / 60, 10);
  seconds = parseInt(innerTime % 60, 10);
  $('#tomatoText').show();
  $('#tomatoText').text((minutes + 1) * 1 + 'm');
}

const showDesktopNotification = () => {
  let bodyText = notifyMessageFlag ? "Start Focusing" : "Take a Short Break";
  const img = 'https://cdn-icons-png.flaticon.com/512/1790/1790418.png';
  const notification = new Notification(bodyText, {
    icon: img,
    requireInteraction: true  //requireInteraction In macos set notification Chrome to Alert not Banner
  })
  notification.onclick = (e) => {
    startHandler();
    // notification.close();
  }
  notification.onclose = (e) => {
    resetHandler();
    // notification.close();
  }
}

if (Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      showDesktopNotification();
    }
  })
}

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


