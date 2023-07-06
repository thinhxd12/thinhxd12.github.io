
const urlCors = "https://mycorspass.up.railway.app/";
const mainPageUrl = "https://www.getdailyart.com/en/21/paul-signac/the-red-buoy-saint-tropez";

const extractUrlImg = (start, end, res) => {
  let re = new RegExp(`${start}((.|\n)+?)${end}`);
  let result = re.exec(res);
  if (result !== null) {
    return result;
  }
  return "";
};

function checkShortcuts(event) {
  if (event.keyCode == 27) {
    handleDelete();
    const text_input = document.getElementById("searchInput");
    text_input.focus();
    return false;
  }
}
document.onkeydown = checkShortcuts;


let historyImgArr = [];
const fetchImgBackground = () => {
  fetch(urlCors + mainPageUrl).then((res) => {
    if (res.ok) {
      return res.text();
    }
  }).then((data) => {
    let regex = new RegExp('<ul class="also__list">(\n|.)+<a href="(.+)">');
    let newUrl = data.match(regex)[2];
    fetch(urlCors + newUrl).then(res => {
      if (res.ok) {
        return res.text();
      }
    }).then(rep => {
      let imgSrc = extractUrlImg('<div class="main-image">\n*<img srcset="', '"', rep)[1];
      let imgDesc = extractUrlImg('<div class="main-description__wrapper">', "</footer>\n*</div>", rep)[0];
      historyImgArr.unshift({ img: imgSrc, desc: imgDesc });
      if (historyImgArr.length > 4) {
        historyImgArr.pop();
      }
      document.getElementById("imgSrc").srcset = imgSrc;
      document.getElementById("imgSrcBlurred").srcset = imgSrc;
      document.getElementById("imgDesc").innerHTML = imgDesc;
    })
  });
}

let slideIndex = 0;
const showImage = (n) => {
  document.getElementById("imgSrc").srcset = historyImgArr[n].img;
  document.getElementById("imgSrcBlurred").srcset = historyImgArr[n].img;
  document.getElementById("imgDesc").innerHTML = historyImgArr[n].desc;
}

const showNextSlice = () => {
  if (slideIndex == 0) { fetchImgBackground() }
  if (slideIndex > 0) {
    slideIndex--
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


let START_MINUTES = "06";
let START_SECOND = "00";
let notifyMessageFlag = false;

let currentMinutes = START_MINUTES;
let currentSeconds = START_SECOND;
let isStop = false;
let duration = 0;
let isRunning = false;
let timerInterval = null;

const startHandler = () => {
  duration = parseInt(START_SECOND, 10) + 60 * parseInt(START_MINUTES, 10);
  isRunning = true;
  startTimer();
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
  audioEl.src = '';
};

const stopHandler = () => {
  isStop = true;
  isRunning = false;
  clearInterval(timerInterval);
  document.getElementById("tomatoText").innerHTML = '-';
};

const resetHandler = () => {
  isStop = false;
  isRunning = false;
  clearInterval(timerInterval);
  setTimeout(() => {
    document.getElementById("tomatoText").style.display = 'none';
  }, 0);
  const audioEl = document.getElementById("tts-audio");
  audioEl.src = 'https://mobcup.net/va/66kjwO3ODzg';
  audioEl.play();
  showDesktopNotification();
};

const resumeHandler = () => {
  let newDuration = parseInt(currentMinutes, 10) * 60 + parseInt(currentSeconds, 10);
  duration = newDuration;
  isRunning = true;
  isStop = false;
  startTimer();
};

const startTimer = () => {
  if (isRunning == true) {
    let timer = duration;
    var minutes, seconds;
    timerInterval = setInterval(() => {
      if (--timer == 0) {
        resetHandler();
        document.getElementById("tomatoText").classList.toggle("tomatoFocus");
        notifyMessageFlag = !notifyMessageFlag;
      } else {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);
        // minutes = minutes < 10 ? "0" + minutes : minutes;
        // seconds = seconds < 10 ? "0" + seconds : seconds;
        currentMinutes = minutes;
        currentSeconds = seconds;
      }
      document.getElementById("tomatoText").style.display = 'block';
      // document.getElementById("tomatoText").innerHTML = `${currentSeconds}s`;
      document.getElementById("tomatoText").innerHTML = `${currentMinutes + 1}m`;
    }, 1000);
  } else clearInterval(timerInterval);
}



document.getElementById('tomatoButton').addEventListener("click", () => {
  if (isStop) {
    resumeHandler();
    return
  }
  if (isRunning) {
    stopHandler();
    return
  }
  if (!isRunning && !isStop) {
    startHandler();
    return
  }
})

const resetTomatoTimer = () => {
  isStop = false;
  isRunning = false;
  clearInterval(timerInterval);
  setTimeout(() => {
    document.getElementById("tomatoText").style.display = 'none';
  }, 0);
}

const showDesktopNotification = () => {
  let bodyText = notifyMessageFlag ? "Start Focusing" : "Take a Short Break";
  const img = 'https://cdn-icons-png.flaticon.com/512/1790/1790418.png';
  const notification = new Notification(bodyText, {
    icon: img,
    requireInteraction: true
  })
  notification.onclick = (e) => {
    startHandler();
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

var isActiveMode = false;
const zoomImgDiv = document.getElementById('zoomImage');
let zoomImg = document.getElementById('imgSrc');

zoomImgDiv.addEventListener("click", () => {
  (isActiveMode = !isActiveMode)
    ? (zoomImgDiv.classList.add("zoom_mode_active"),
      window.innerWidth > 767
        ? zoomImg.style.transform = "scale(3.5)"
        : zoomImg.style.transform = "scale(5)")
    : (zoomImgDiv.classList.remove("zoom_mode_active"),
      zoomImg.style.transform = "scale(1)");
});
zoomImgDiv.addEventListener("mousemove", (e) => {
  let corX = ((e.pageX - zoomImgDiv.offsetLeft) / zoomImgDiv.offsetWidth) * 100 + '%';
  let corY = ((e.pageY - zoomImgDiv.offsetTop) / zoomImgDiv.offsetHeight) * 100 + '%';
  zoomImg.style.transformOrigin = `${corX} ${corY}`;
});