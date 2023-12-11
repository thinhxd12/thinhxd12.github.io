const chunk = (array, size) =>
  array.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(array.slice(i, i + size));
    return acc;
  }, []);

let dataSheets = [];
let dataHistory = [];
let slideIndex = 1;
let mongoFetchOp = {};

const getToken = () => {
  let loginItem = sessionStorage.getItem("loginItem");
  if (loginItem == null) {
    window.location.href = "./index.html";
  }
  if (loginItem !== null) {
    fetch("https://realm.mongodb.com/api/client/v2.0/auth/session", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginItem}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        sessionStorage.removeItem("accessItem");
        sessionStorage.setItem("accessItem", JSON.stringify(data));
        getWeatherKey(data.access_token);
        getAccesToken();
      });
  }
};

const getWeatherKey = (token) => {
  let urlkey =
    "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/loginGetKeys";
  let opts = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  fetch(urlkey, opts)
    .then((res) => res.json())
    .then((data) => {
      // console.log(data);
      sessionStorage.setItem("weatherKey", JSON.stringify(data));
    });
};

getToken();

const getAccesToken = () => {
  let accessItem = sessionStorage.getItem("accessItem");
  if (accessItem !== null) {
    mongoFetchOp = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${JSON.parse(accessItem).access_token}`,
      },
    };
  }
};

setInterval(() => {
  getToken();
}, 1620000);

const getLocalSheetData = () => {
  let item = localStorage.getItem("sheetData");
  if (item !== null) {
    dataSheets = JSON.parse(item);
  }
};

const getRenderLocalHistoryData = () => {
  let itemH = localStorage.getItem("historyData");
  if (itemH !== null) {
    dataHistory = JSON.parse(itemH);
    dataHistory = dataHistory.sort((a, b) => a.index - b.index);
  }
  slideIndex = dataHistory.length - 1;
  showSlides(slideIndex);
};

const getAllData = async (text) => {
  const res = await fetch(
    `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getAllData?collection=${text}`
  );
  return res.json();
};

const wakeupServer = async () => {
  let url = URL_CORS + `https://myapp-9r5h.onrender.com/wakeup`;
  $(".serverDot").removeClass("serverDotToggle");
  await fetch(url)
    .then((res) => res.text())
    .then((data) => {
      if (data == "ok!") {
        $(".serverDot").addClass("serverDotToggle");
      }
    });
};

$(".serverDot").click(function (e) {
  wakeupServer();
});

setInterval(function () {
  wakeupServer();
  // fetchAndRenderMonthImg();
}, 840000);

const fetchAndRenderCalendarData = async () => {
  await getAllData(CURRENT_COLLECTION.schedule).then((data) => {
    data = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    renderCalendar(data);
  });
};

const fetchStartupData = async () => {
  getAllData(CURRENT_COLLECTION.collection).then((data) => {
    let newdata = data.sort((a, b) => a._id - b._id);
    localStorage.removeItem("sheetData");
    localStorage.setItem("sheetData", JSON.stringify(newdata));
    //save to array script
    getLocalSheetData();
  });
  await fetchAndRenderCalendarData();
  await getAllData(CURRENT_COLLECTION.history).then((data) => {
    localStorage.removeItem("historyData");
    localStorage.setItem("historyData", JSON.stringify(data));
    //save to array script
    getRenderLocalHistoryData();
  });
};

fetchStartupData();
wakeupServer();
// getLocalSheetData();

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
    document.getElementById("searchContainer").innerHTML = "";
    document.getElementById("searchContainer").appendChild(a);

    if (val.length > 2) {
      let arrFilter = dataSheets.filter(
        (item) => item.text.search(`^${val}.*$`) > -1
      );
      if (arrFilter.length == 0) {
        document.getElementById("transInput").value = val;
      }
      for (i = 0; i < arrFilter.length; i++) {
        let item = arrFilter[i];

        b = document.createElement("a");
        b.setAttribute("class", "my-item");
        b.innerHTML = `<small><small>${i + 1}</small></small> ${item.text}`;
        b.addEventListener("click", function (e) {
          inp.value = "";
          playTTSwithValue(item);
          renderFlashcard(item);
          if (item.numb > 1) {
            handleCheckItem(item._id);
            let objIndex = dataSheets.findIndex((obj) => obj._id == item._id);
            dataSheets[objIndex].numb += -1;
            localStorage.setItem("sheetData", JSON.stringify(dataSheets));
          } else {
            handleArchivedItem(item._id, item.text);
          }
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
    } else if (e.keyCode >= 49 && e.keyCode <= 57) {
      e.preventDefault();
      x[e.keyCode - 49].click();
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
};

autocomplete(document.getElementById("searchInput"));

$(document).keydown(function (e) {
  if ($(e.target).is("input,select,textarea")) {
    if (e.keyCode == 27) {
      $("#searchInput").val("");
      $("#transInput").val("");
      textInput = "";
      return;
    }
    return;
  }
  if (e.keyCode == 27 || e.keyCode == 32) {
    $("#searchInput").val("");
    $("#transInput").val("");
    textInput = "";
    closeAllLists();
    e.preventDefault();
    return;
  }
  let x = document.getElementsByClassName("my-item");
  if (e.keyCode >= 49 && e.keyCode <= 57 && x.length > 0) {
    x[e.keyCode - 49].click();
    textInput = "";
    return;
  }
  if (e.keyCode >= 65 && e.keyCode <= 90) {
    textInput += e.key;
    $("#searchInput").val(textInput);
    renderResult();
  }
  if (e.keyCode == 8) {
    textInput = textInput.slice(0, -1);
    $("#searchInput").val(textInput);
    renderResult();
  }

  function renderResult(params) {
    const contentBody = document.getElementById("searchContainer");
    if (textInput.length > 2) {
      let arrFilter = dataSheets.filter(
        (item) => item.text.search(`^${textInput}.*$`) > -1
      );
      if (arrFilter.length == 0) {
        $("#transInput").val(textInput);
        contentBody.innerHTML = "";
      } else {
        contentBody.innerHTML = "";
        let a = document.createElement("DIV");
        a.setAttribute("class", "autocomplete-items");
        contentBody.appendChild(a);
        for (i = 0; i < arrFilter.length; i++) {
          let item = arrFilter[i];
          let b = document.createElement("a");
          b.setAttribute("class", "my-item");
          b.innerHTML = `<small><small>${i + 1}</small></small> ${item.text}`;
          b.addEventListener("click", function (e) {
            $("#searchInput").val("");
            $("#transInput").val("");
            textInput = "";
            playTTSwithValue(item);
            renderFlashcard(item);
            if (item.numb > 1) {
              handleCheckItem(item._id);
              let objIndex = dataSheets.findIndex((obj) => obj._id == item._id);
              dataSheets[objIndex].numb += -1;
              localStorage.setItem("sheetData", JSON.stringify(dataSheets));
            } else {
              handleArchivedItem(item._id, item.text);
            }
            closeAllLists();
          });
          a.appendChild(b);
        }
      }
    }
  }
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i]) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
});

const getTotalDoneWord = (text) => {
  fetch(
    `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/countCollection?collection=${text}`
  )
    .then((res) => res.json())
    .then((data) => {
      $("#wordNum").html(data);
    });
};

getTotalDoneWord(CURRENT_COLLECTION.pass);

const getLastTimeLog = () => {
  let url =
    "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getLogTime";
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      // console.log(data.time);
      sessionStorage.setItem("lastTime", data.time);
      let date1 = new Date(data.time * 1);
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

      let date = new Date().getTime();
      let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/logTime?time=${date}`;
      fetch(url).then((res) => res.json());
    });
};

getLastTimeLog();

let dataCalendar = [];
let todayData;
let checkValidWeek;

const renderCalendar = (data) => {
  let date = new Date();
  const todaysMonth = date.getMonth();
  const todaysWeekDay = date.getDay();
  const todaysYear = date.getFullYear();

  // const startDay = new Date("2023/06/29");
  // const endDay = new Date("2021/07/09");
  const startDay = new Date(data[0].date);
  const endDay = new Date(data[data.length - 1].date);
  todayData = data.find((item) => item.date === formatDate(date));
  // console.log('todayData', data);
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthDays = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  $("#calendarMonth").html(monthDays[todaysMonth]);
  $("#calendarYear").html(todaysYear);
  let dateProgressDivText = `<span>${data[0].startIndex1 + 1}</span><span> &#8226; </span><span>${data[1].startIndex2 + 50}</span>`;
  $(".dateProgressDiv").html(dateProgressDivText);
  $(".calendarHeaderContent").css("background-image", `url(./img/${todaysMonth + 1}.jpg)`);
  let firstDayofMonth = new Date(todaysYear, todaysMonth, 1).getDay();
  let lastDateofMonth = new Date(todaysYear, todaysMonth + 1, 0).getDate();
  let lastDayofMonth = new Date(todaysYear, todaysMonth, lastDateofMonth).getDay();
  let lastDateofLastMonth = new Date(todaysYear, todaysMonth, 0).getDate();

  let monthDateArr = [];
  for (let i = firstDayofMonth; i > 0; i--) {
    monthDateArr.push({
      date: lastDateofLastMonth - i + 1,
      month: todaysMonth - 1,
    });
  }
  for (let i = 1; i <= lastDateofMonth; i++) {
    monthDateArr.push({
      date: i,
      month: todaysMonth,
    });
  }
  for (let i = lastDayofMonth; i < 6; i++) {
    monthDateArr.push({
      date: i - lastDayofMonth + 1,
      month: todaysMonth + 1,
    });
  }

  monthDateArr.map((item, index) => {
    item.month == date.getMonth()
      ? (item["class"] = "calendarDay calendarThisMonthDay")
      : (item["class"] = "calendarDay");

    if (item.date === date.getDate() && item.month === date.getMonth()) {
      item["class"] += " calendarTodayDay";
    }

    if (
      item.date === startDay.getDate() &&
      item.month === startDay.getMonth()
    ) {
      item["class"] += " calendarStartDay";
    }

    if (item.date === endDay.getDate() && item.month === endDay.getMonth()) {
      item["class"] += " calendarEndDay";
    }

    return item;
  });
  let startDayIndex = monthDateArr.findIndex(
    (item) =>
      item.date === startDay.getDate() && item.month === startDay.getMonth()
  );
  let endDayIndex = monthDateArr.findIndex(
    (item) => item.date === endDay.getDate() && item.month === endDay.getMonth()
  );
  // console.log(monthDateArr);
  monthDateArr.map((item, index) => {
    if (index >= startDayIndex && index <= endDayIndex) {
      item["indicate"] = true;
      item["time1"] =
        data[index - startDayIndex].time1 ||
        data[5 + index - endDayIndex].time1;
      item["time2"] =
        data[index - startDayIndex].time2 ||
        data[5 + index - endDayIndex].time2;
      return item;
    }
    return item;
  });

  // renderCalendar---------------
  monthDateArr = chunk(monthDateArr, 7);
  const calendarBodyContent = document.getElementById("calendarBodyContent");
  calendarBodyContent.innerHTML = `
    <div class="calendarWeek">
      <div class="calendarWeekDay">Sun</div>
      <div class="calendarWeekDay">Mon</div>
      <div class="calendarWeekDay">Tue</div>
      <div class="calendarWeekDay">Wed</div>
      <div class="calendarWeekDay">Thu</div>
      <div class="calendarWeekDay">Fri</div>
      <div class="calendarWeekDay">Sat</div>
    </div>
    <div class="calendarBodyContentDays">
      ${monthDateArr.map((item, index) => {
    return `<div class="calendarDays">
            ${item.map((m, n) => {
      let todayDay = m.date == date.getDate() && m.month == date.getMonth();
      let isSunday = m.month == date.getMonth() && n == 0;
      return `<div class="${isSunday ? m.class + ' calendarSundayDay' : m.class}" ${todayDay ? 'id="todayReset" onclick="resetTodaySchedule(true)"' : ''}>
                          <span>${m.date}</span>
                          ${m.indicate ? `<span class="dayIndicateText ${m.time1 > 0 ? "dayIndicateTextDone" : ""}"><span>${m.time1}</span><span>${m.time2}</span></span>` : ""}
                        </div>`
    }).join("")
      }
          </div>`
  }).join("")
    }
    </div>
  `
  checkValidWeek = (date.getDate() > endDay.getDate() && date.getMonth() == endDay.getMonth()) || (date.getDate() < startDay.getDate() && date.getMonth() == startDay.getMonth());
  setTodayProgressHtml(checkValidWeek);
};

const renderHistorySlide = (numb) => {
  const historyTable = document.getElementById("calendarHistoryContent");
  let historyTableItem = dataHistory.find((item) => item.index == numb);
  let historyTableData = historyTableItem.data;
  if (numb == dataHistory.length - 1) {
    historyTable.innerHTML = `
        ${historyTableData.map((item, index) => {
      const check = item.row == todayData.startIndex1 + 1 || item.row == todayData.startIndex1 - 49;
      return `
        <div class="historyItem">
          <div class="historyItemDesc ${item.fromD ? ' historyItemDescComplete' : ''}" onclick="commitNewWork(${item.row},${numb})">${item.row} - ${item.row + 199}</div>
          ${item.fromD ? `<div class="historyItemContent">
          <span>${item.fromD}</span>
          <span>${item.toD}</span>
        </div>` :
          check ? `<div class="historyItemContent" id="todayProgressHtml"></div>` : `<div class="historyItemContent"></div>`
        }
        </div>`;
    }).join("")
      }
      </div>`;
  } else historyTable.innerHTML = `
  <div class="calendarHistoryContent">
    ${historyTableData.map((item, index) => {
    return `
    <div class="historyItem">
      <div class="historyItemDesc ${item.fromD ? ' historyItemDescComplete' : ''}" onclick="commitNewWork(${item.row},${numb})">${item.row} - ${item.row + 199}</div>
      ${item.fromD ? `<div class="historyItemContent">
      <span>${item.fromD}</span>
      <span>${item.toD}</span>
    </div>`
        : `<div class="historyItemContent"></div>`
      }
    </div>`;
  }).join("")
    }
  </div>`;
  setTodayProgressHtml(checkValidWeek);
};

const setTodayProgressHtml = (valid) => {
  if (valid) {
    $("#todayProgressHtml").html('<img class="weekJobDoneImg" src="./img/cup.png"><img class="weekJobDoneImg" src="./img/cup.png">');
  } else if (todayData) {
    $("#todayProgressHtml").html(`
        <div class="historyItemContentBtn" onclick="setWordList(${JSON.stringify(todayData).split('"').join("&quot;")},1)" ${todayData.time1 >= 9 ? "style='background: none;'" : ""}>
          <img src="/img/run.png">
          <span>&#183;</span>
          <span>${todayData.startIndex1 + 1}</span>
        </div>
        <div class="historyItemContentBtn" onclick="setWordList(${JSON.stringify(todayData).split('"').join("&quot;")},2)" ${todayData.time2 >= 9 ? "style='background: none;'" : ""}>
          <img src="/img/dancer.png">
          <span>&#183;</span>
          <span>${todayData.startIndex2 + 1}</span>
        </div>
        `);
  }
};

const showSlides = (n) => {
  if (n > dataHistory.length - 1) {
    slideIndex = dataHistory.length;
    setNextMonthTable();
    return;
  }
  if (n < 1) {
    slideIndex = 0;
  }
  renderHistorySlide(slideIndex);
};

const setNextMonthTable = () => {
  const calendarContent = document.getElementById("calendarContent");
  calendarContent.innerHTML = `
    <div class="calendarItem" style="height: 21px;">
        <div class="calendarItemHeader">
        <span style="width: 45px;"></span>
        <div class="calendarItemContent">
        <input onchange="handleThis(this)" class="calendarInputCheck" type="checkbox" id="checkbox1" value="item1">
        <label for="checkbox1"> 1-1000</label>
        <input onchange="handleThis(this)" class="calendarInputCheck" type="checkbox" id="checkbox2" value="item2">
        <label for="checkbox2"> 1001-2000</label>
        </div>
        <div style="display: flex;">
            <button class="close-btn" onclick="setNewHistoryItem()">
            <i class='bx bx-check'></i>
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
            <i class='bx bx-x'></i>
            </button>
        </div>
        </div>
    </div>`;
};

const handleThis = (e) => {
  $(".calendarInputCheck").not(e).prop("checked", false);
};

const setNewHistoryItem = () => {
  let val = document.querySelector(".calendarInputCheck:checked").value;
  let res = [];
  if (val == "item1") {
    for (let i = 0; i < 5; i++) {
      res.push({
        row: 200 * i + 1,
        fromD: "",
        toD: "",
      });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      res.push({
        row: 200 * i + 1 + 1000,
        fromD: "",
        toD: "",
      });
    }
  }
  let newdata = {
    index: dataHistory.length,
    data: res,
  };

  let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertHistoryItem?col=${CURRENT_COLLECTION.history}`;
  fetch(url, {
    ...mongoFetchOp,
    method: "POST",
    body: JSON.stringify(newdata),
  })
    .then((res) => res.json())
    .then((data) => {
      $("#calendarContent").html("");
      getAllData(CURRENT_COLLECTION.history).then((data) => {
        localStorage.removeItem("historyData");
        localStorage.setItem("historyData", JSON.stringify(data));
        //save to array script
        getRenderLocalHistoryData();
      });
    });
};

const commitNewWork = (row, numb) => {
  const calendarContent = document.getElementById("calendarContent");
  calendarContent.innerHTML = `
    <div class="calendarItem">
    <div class="calendarItemHeader">
        <span></span>
        <div style="display: flex;">
        <button class="close-btn" onclick="commitHistoryItem(${row},${numb})">
            <i class='bx bx-check'></i>
        </button>
        <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
            <i class='bx bx-x'></i>
        </button>
        </div>
    </div>
    <div class="calendarItemContent">
        <input class="calendarItemInput" value="${row} - ${row + 199}" autocomplete="off" id="commitHistoryItemRow" onmouseover="this.focus()" onmouseout="this.blur()">
        <input type="date" data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemFromD" autocomplete="off">
        <input type="date" data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemToD" autocomplete="off">
    </div>
    </div>`;
};

const commitHistoryItem = (row, numb) => {
  let newdata = {
    fromD: $("#commitHistoryItemFromD").val(),
    toD: $("#commitHistoryItemToD").val(),
  };
  let id = dataHistory.find((item) => item.index == numb)._id;
  let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdateHistory?id=${id}&row=${row}&col=${CURRENT_COLLECTION.history}`;
  fetch(url, {
    ...mongoFetchOp,
    method: "POST",
    body: JSON.stringify(newdata),
  })
    .then((res) => res.json())
    .then((data) => {
      $("#calendarContent").html("");
      getAllData(CURRENT_COLLECTION.history).then((data) => {
        localStorage.removeItem("historyData");
        localStorage.setItem("historyData", JSON.stringify(data));
        //save to array script
        getRenderLocalHistoryData();
      });
    });
};

const fetchAndRenderMonthImg = () => {
  let batchQuery = {};
  batchQuery["pid"] = "209567";
  batchQuery["fmt"] = "json";
  batchQuery["rafb"] = "0";
  batchQuery["ua"] = "WindowsShellClient/0";
  batchQuery["cdm"] = "1";
  batchQuery["disphorzres"] = "1920";
  batchQuery["dispvertres"] = "1080";
  batchQuery["lo"] = "80217";
  batchQuery["pl"] = "en-US";
  batchQuery["lc"] = "en-US";
  batchQuery["ctry"] = "us";
  const baseUrl =
    "https://arc.msn.com/v3/Delivery/Placement?" +
    new URLSearchParams(batchQuery).toString();
  fetch(URL_CORS + baseUrl)
    .then((res) => res.json())
    .then((data) => {
      let itemStr = data["batchrsp"]["items"][0].item;
      let itemObj = JSON.parse(itemStr)["ad"];
      let title = itemObj["title_text"]?.tx;
      let text1 = itemObj["hs2_title_text"]?.tx;
      // let text2 = itemObj["hs2_cta_text"]?.tx || '';
      let jsImageP = itemObj["image_fullscreen_001_portrait"];
      let jsImageL = itemObj["image_fullscreen_001_landscape"];

      // let contentTextTop = `<div class="topCalendarText">${title}</div>`;
      // title ? $('#topCalendarText').html(contentTextTop) : '';
      // let contentTextBottom = `<div class="bottomCalendarText">${text1}</div>`;
      // text1 ? $('#bottomCalendarText').html(contentTextBottom) : '';
      $(".flashCardContainer").css("background-image", `url(${jsImageL.u})`);
    });
};

// fetchAndRenderMonthImg();

//change monthImg every 30m
// setInterval(() => {
//     fetchAndRenderMonthImg();
// }, 360000);

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const setTodayWork = () => {
  const calendarContent = document.getElementById("calendarContent");
  calendarContent.innerHTML = `
    <div class="calendarItem">
        <div class="calendarItemHeader">
            <span>Set new week schedule!</span>
            <div style="display: flex;">
            <button class="close-btn" onclick="importSchedule()">
            <i class='bx bx-check'></i>
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                <i class='bx bx-x'></i>
            </button>
            </div>
        </div>
            <div class="calendarItemContent">
                <input class="calendarItemInput" value="${formatDate(
    new Date()
  )}" id="newStartDay"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
                <input class="calendarItemInput" placeholder="101 ..." id="newStartRow"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            </div>
    </div>`;
};

const importSchedule = (reset = false) => {
  if ($("#newStartRow").val() == "" && !reset) return;
  let startDay = $("#newStartDay").val();
  let startIndex = $("#newStartRow").val() - 1;
  if (reset) {
    startDay = dataCalendar[0].date;
    startIndex = dataCalendar[0].startIndex1;
  }
  let data = [];
  for (let i = 0; i < 6; i++) {
    data.push({
      date: formatDate(new Date(new Date(startDay).getTime() + i * 86400000)),
      startIndex1: i % 2 == 0 ? startIndex : startIndex + 50,
      startIndex2: i % 2 == 0 ? startIndex + 100 : startIndex + 150,
      time1: 0,
      time2: 0,
    });
  }
  let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/createSchedule?col=${CURRENT_COLLECTION.schedule}`;
  fetch(url, {
    ...mongoFetchOp,
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      $("#calendarContent").html("");
      fetchAndRenderCalendarData();
    });
};

//reset word schedule today
const resetTodaySchedule = () => {
  const calendarContent = document.getElementById("calendarContent");
  calendarContent.innerHTML = `
    <div class="calendarItem">
        <div class="calendarItemHeader">
            <span>Reset today schedule!</span>
            <div style="display: flex;">
            <button class="close-btn" onclick="updateScheduleItem()">
            <i class='bx bx-check'></i>
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                <i class='bx bx-x'></i>
            </button>
            </div>
        </div>
        <div class="calendarItemContent">
            <input class="calendarItemInput" placeholder="${todayData.startIndex1 + 1
    } - ${todayData.startIndex1 + 50
    }" id="firstRowReset" autocomplete="off" onmouseover="this.focus()">
            <input class="calendarItemInput" placeholder="${todayData.startIndex2 + 1
    } - ${todayData.startIndex2 + 50
    }" id="secondRowReset" autocomplete="off" onmouseover="this.focus()">
        </div>
    </div>`;
};

const updateScheduleItem = () => {
  let data = {
    date: todayData.date,
    startIndex1: todayData.startIndex1,
    startIndex2: todayData.startIndex2,
    time1: $("#firstRowReset").val() * 1 || 0,
    time2: $("#secondRowReset").val() * 1 || 0,
  };
  let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleItem?col=${CURRENT_COLLECTION.schedule}&id=${todayData._id}`;
  fetch(url, {
    ...mongoFetchOp,
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((res) => res.text())
    .then((data) => {
      $("#calendarContent").html("");
      fetchAndRenderCalendarData();
    });
};

let wordList = [];
let autorunTime = 0;
let todayScheduleData;
const setWordList = async (item, num) => {
  // console.log('setWordList');
  if (num == 1) {
    todayScheduleData = {
      _id: item._id,
      startIndex: item.startIndex1,
      time: "time1",
      startNum: item.time1,
    };
  } else {
    todayScheduleData = {
      _id: item._id,
      startIndex: item.startIndex2,
      time: "time2",
      startNum: item.time2,
    };
  }
  const wordRow = document.getElementById("wordRow");
  wordList = [];
  autorunTime = 0;
  let index = num == 1 ? item.startIndex1 * 1 : item.startIndex2 * 1;
  await getAllData(CURRENT_COLLECTION.collection).then((data) => {
    let newdata = data.sort((a, b) => a._id - b._id);
    localStorage.removeItem("sheetData");
    localStorage.setItem("sheetData", JSON.stringify(newdata));
    //save to array script
    getLocalSheetData();
  });
  wordList = dataSheets.slice(index, index + 50);
  wordRow.value = index;
  wordRow.blur();
  handleToggleSwitchSun();
  handleToggleSwitchMoon();
  $(".city").hide();
  $("#tab1").show();
  $(".footerBtn").removeClass("footerBtnActive");
  $(".tabButton[name='tab1']").addClass("footerBtnActive");
  tabIndex = 1;
};

const setWordListHandy = async () => {
  // console.log('setWordListHandy');
  const wordRow = document.getElementById("wordRow");
  wordList = [];
  autorunTime = 0;
  let index = wordRow.value * 1;
  await getAllData(CURRENT_COLLECTION.collection).then((data) => {
    let newdata = data.sort((a, b) => a._id - b._id);
    localStorage.removeItem("sheetData");
    localStorage.setItem("sheetData", JSON.stringify(newdata));
    //save to array script
    getLocalSheetData();
  });
  wordList = dataSheets.slice(index, index + 50);
  wordRow.blur();
  startHandler();
  handleToggleSwitchSun();
  handleToggleSwitchMoon();
  $(".footerBtn").removeClass("footerBtnActive");
  $(".tabButton[name='tab1']").addClass("footerBtnActive");
  tabIndex = 1;
};

$("input#wordRow").change(function () {
  setWordListHandy();
});

const handleToggleSwitchMoon = () => {
  $("#autoPlayBtn").css("background-image", "url('/img/sunset.jpg')");
};

const handleToggleSwitchSun = () => {
  $("#autoPlayBtn").css("background-image", "url('/img/sunrise.jpg')");
};

let currentTimeout;
let isTimerStarted = false;
const autoPlayBtn = document.getElementById("autoPlayBtn");

autoPlayBtn.addEventListener("click", () => {
  startAutoPlayWord();
});

const startAutoPlayWord = () => {
  if (isTimerStarted == false && wordList.length > 0) {
    handleToggleSwitchSun();
    play();
    $(".cornerDot").addClass("cornerDotActive");
  } else if (isTimerStarted == true && autorunTime > 1) {
    handleToggleSwitchMoon();
    pause();
  }
};

function play() {
  isTimerStarted = true;
  handleNextWord();
  if (autorunTime < wordList.length - 1) {
    currentTimeout = setTimeout(play, 7500);
    autorunTime++;
  } else stop();
}

function pause() {
  isTimerStarted = false;
  clearTimeout(currentTimeout);
}

function stop() {
  handleToggleSwitchMoon();
  $(".cornerDot").removeClass("cornerDotActive");
  autorunTime = 0;
  pause();
  //update progress
  setTimeout(() => {
    setWordListHandy();
  }, 2000);
}

const updateScheduleProgress = (id, val) => {
  // console.log('updateScheduleProgress');
  const url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleProgress?id=${id}&val=${val}&col=${CURRENT_COLLECTION.schedule}`;
  fetch(url, mongoFetchOp).then((res) => res.json());
};

const handleNextWord = () => {
  let item = wordList[autorunTime];
  if (
    autorunTime == 0 &&
    $("#wordRow").val() == todayScheduleData?.startIndex
  ) {
    todayScheduleData.startNum++;
    updateScheduleProgress(todayScheduleData._id, todayScheduleData.time);
  }
  let indexx = $("#wordRow").val() * 1 + autorunTime;
  playTTSwithValue(item, indexx + 1);
  renderFlashcard(item, todayScheduleData?.startNum);
  item.numb > 1
    ? handleCheckItem(item._id)
    : handleArchivedItem(item._id, item.text);
  if ((indexx + 1) % 50 == 0) {
    autorunTime = 50;
  }
};

const handleCheckItem = (id) => {
  // console.log('check');
  fetch(
    `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/handleCheck?id=${id}&col=${CURRENT_COLLECTION.collection}`,
    mongoFetchOp
  )
    .then((res) => res.json())
    .catch((err) => console.log(err));
};

const handleArchivedItem = (id, text) => {
  if (dataSheets.length <= 2000) {
    fetch(
      `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndArchivedOnly?idd=${id}&col=${CURRENT_COLLECTION.collection}&pass=${CURRENT_COLLECTION.pass}`,
      mongoFetchOp
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(text);
        getTotalDoneWord(CURRENT_COLLECTION.pass);
      });
    dataSheets = dataSheets.filter((obj) => obj._id !== id);
    localStorage.setItem("sheetData", JSON.stringify(dataSheets));
  } else {
    let sliceArr = dataSheets.slice(-(dataSheets.length - 2000));
    const minX = sliceArr.reduce(
      (acc, curr) => (curr.numb < acc.numb ? curr : acc),
      sliceArr[0] || undefined
    );
    fetch(
      `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndArchived?ida=${id}&idd=${minX._id}&col=${CURRENT_COLLECTION.collection}&pass=${CURRENT_COLLECTION.pass}`,
      mongoFetchOp
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(text);
        getTotalDoneWord(CURRENT_COLLECTION.pass);
      });
    dataSheets = dataSheets.filter((obj) => obj._id !== minX._id);
    localStorage.setItem("sheetData", JSON.stringify(dataSheets));
  }
};

const playTTSwithValue = (item, row) => {
  const audioEl = document.getElementById("tts-audio");
  audioEl.volume = 1;
  if (item.sound?.length > 0) {
    audioEl.pause();
    audioEl.src = item.sound;
    audioEl.play();
  } else {
    textToSpeech(item.text);
  }
  renderExplain(
    item.text,
    item.class,
    item.definitions,
    item.sound,
    "explainContainer",
    row
  );
};

const textToSpeech = (text) => {
  const audioEl = document.getElementById("tts-audio");
  audioEl.pause();
  audioEl.volume = 1;
  // audioEl.src = `https://proxy.junookyo.workers.dev/?language=en-US&text=${text}&speed=1`
  // audioEl.src = `https://myapp-9r5h.onrender.com/hear?lang=en&text=${text}`;
  audioEl.src = `  https://ssl.gstatic.com/dictionary/static/sounds/20220808/${text}--_us_1.mp3`;
  audioEl.play();
};

let flipTimer1, flipTimer2, flipTimer3;
const renderFlashcard = (item, progress) => {
  const audioEl = document.getElementById("tts-audio");
  clearTimeout(flipTimer1, flipTimer2, flipTimer3);
  let newNumb = item.numb - 1 > 0 ? item.numb - 1 : 0;
  let cardMeaning = item.meaning.replace(/\s\-(.+?)\-/g, `\n【 $1 】\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`);
  cardMeaning = cardMeaning.replace(/\-/g, `\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`).substring(1);
  let meaningTTS = item.meaning.replace(/\s\-(.+?)\-/g, "+").replace(/\-/g, "+");
  const flashCardContent = document.getElementById("flashCardContent");
  flashCardContent.innerHTML = `
                <div class="item">
                  <div class="item-wrapper">
                    <div class="indicateFlip">
                        <div class="indicateFlipContainer"> 
                          <div class="indicateFlipContent"> 
                          <span id="indicateFlip">
                            ${item.numb}
                          </span>
                          </div>
                        </div>
                    </div>
                    ${progress ? `<span class="progressFlip">${progress >= 9 ? `<img src="./img/cup.png" width="21">` : `<sup>${progress}</sup>/<sub>9</sub>`}</span>` : ""}
                    <div class="img-overlay">
                    <div class="flip-card-front-content">
                      <p class="cardTextClass">${item.class}</p>
                      <h1>${item.text}</h1>
                      <p class="cardPhonetic">${item.phonetic}</p>                  
                      <p class="cardName">05/07/22</p>
                    </div>
                    </div>
                    <div class="item-back">
                        <div class="flip-card-back-content">
                            <p class="cardMeaning">${cardMeaning}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="25.191" viewBox="0 0 100 25.191">
                          <path d="M88.447 14.055c0 .821-.118 1.729.012 2.539.065.403.944.079 1.069-.132.36-.606.435-1.492.619-2.163.378-1.374.987-2.687 1.623-3.957.394-.787.49-.795.551.109.057.842.384 1.455.087 2.293-.221.623-.496 1.21-.693 1.845-.135.434-.332 1.762-.718 2.024l.861.187c.525-1.039 2.008-2.047 2.857-2.831.822-.76-.444.284-.395-.359-.04.517-.451 1.085-.662 1.547-.263.576-.665 1.24-.656 1.891.008.7 1.376.189 1.627.05 1.819-1.003 3.217-2.765 4.524-4.334.32-.385-.799-.309-1.032-.032-.654.778-2.455 2.855-2.056 3.998.471 1.351 2.087.01 2.897.392.334.158 1.347-.322.878-.544-.653-.309-1.485.026-2.155.119-1.349.187 1.116-3.516 1.469-3.935l-1.032-.032c-.131.157-4.021 3.992-4.012 4.02-.31-.937 1.251-2.383 1.329-3.395.01-.134-.085-.221-.216-.239-.785-.11-1.329.592-1.846 1.078-.764.719-2.068 1.621-2.548 2.571-.239.473.671.317.861.187 1.134-.771 1.305-3.155 1.827-4.345.39-.887-.035-1.548-.087-2.455-.035-.617-.139-1.244-.83-1.373-1.224-.228-1.893 1.571-2.269 2.373-.368.784-.731 1.582-1.021 2.398-.31.872-.342 2.085-.812 2.876l1.069-.132c-.121-.758-.011-1.608-.011-2.377-.001-.473-1.108-.238-1.108.135zm-2.665-1.27c1.472.358-.443 3.535-.765 4.06-.109.178.919.108 1.095-.18.402-.656 2.367-3.9.571-4.337-.276-.068-1.256.37-.901.457zm-6.048.021c.097-.369.814-.392 1.271-.427.342-.026.682-.086 1.021-.135.129-.019.258-.034.388-.044-.424.04-.108-.535-.384-.082-.341.56-.649 1.134-1.038 1.663-.382.521-.946.763-1.366 1.229-.74.821.258 1.522.994 1.682.643.14 1.391-.034 1.995-.254a5.56 5.56 0 0 0 .631-.281c.078-.041.156-.082.235-.12-.462.231-.445-.341-.379.2.065.534 1.174.256 1.106-.297-.179-1.463-1.839-.202-2.608-.084-.333.052-.952.075-1.088-.326-.083-.245.705-.647.865-.791.571-.511.967-1.199 1.349-1.853.161-.277.786-.958.534-1.306-.322-.444-1.214-.171-1.633-.11-1.122.163-2.655.023-3.019 1.413-.144.552.991.431 1.124-.075zm-4.63-1.681c-.124.128.052-.042.073-.061a2.658 2.658 0 0 1 .405-.289c.623-.372 1.241-.064 1.739.37.278.243 1.306-.181 1.03-.421-1.292-1.126-3.129-.781-4.271.401-.19.197.161.294.292.294.27 0 .543-.099.732-.294zm1.798-4.151c-.706.645-1.109 1.516-1.355 2.423-.235.867-.054 1.89-.106 2.782a7.575 7.575 0 0 1-1.087 3.477c-.307.51.819.483 1.05.098.901-1.499 1.173-3.11 1.195-4.844.018-1.376.135-2.66 1.218-3.649.501-.458-.582-.591-.915-.287zm-6.726.927a2.325 2.325 0 0 0 .471-.744c.182-.488-.113-.827-.589-.937a.886.886 0 0 0-.782.21c-.169.166-.119.386.118.44.227.053.237.193.144.397a1.9 1.9 0 0 1-.192.315 2.451 2.451 0 0 1-.04.054c-.063.082.058-.07.005-.005a1.691 1.691 0 0 1-.034.04c-.158.175-.128.377.118.44.247.063.606-.015.782-.21zm-2.885 2.801c-1.174.652-1.137 2.085-1.149 3.289-.011 1.179.21 1.979 1.448 1.647 1.082-.29 2.016-1.228 2.788-1.984.958-.938 1.886-1.994 2.487-3.202.287-.576.223-1.225-.585-.963-.753.245-1.238.898-1.67 1.529-1.278 1.864-2.113 4.81.581 5.797.306.112 1.313-.348.889-.503-1.79-.656-1.817-2.29-1.217-3.856.264-.688.658-1.324 1.102-1.909a3.836 3.836 0 0 1 .529-.575c-.152.133-.472-.149-.61.34-.421 1.49-2.032 2.933-3.141 3.916a8.085 8.085 0 0 1-.965.74c-.445.287-.35.071-.453-.45-.161-.81-.247-3.051.639-3.542.651-.362-.344-.456-.672-.274zm-18.347 2.479c.199 1.159.547 2.839 1.834 3.197.874.243 1.705-.874 2.143-1.429 1.247-1.579 2.195-3.427 3.043-5.244.7-1.498 1.535-3.327 1.337-5.026-.042-.36-1.123-.1-1.106.296.101 2.369.929 4.532 1.145 6.902.103 1.131.004 6.474 2.166 5.579 1.218-.504 1.589-3.679 1.952-4.752 1.257-3.721 3.322-7.04 5.918-9.971.31-.35-.8-.267-1.026-.011-3.523 3.976-5.426 8.333-6.984 13.323a8.58 8.58 0 0 1-.212.591c.184-.465-.219-1.427-.307-1.911-.292-1.602-.397-3.228-.564-4.845-.184-1.788-.904-3.364-.982-5.201l-1.106.296c.303 2.602-1.65 5.711-2.893 7.84-.602 1.031-1.268 2.153-2.163 2.96-.115.103-1.026-2.511-1.091-2.89-.062-.361-1.173-.097-1.106.297zm-14.109 1.086c.771-1.03 1.406-2.185 2.185-3.196l-1.026.213c.015.024-.4 1.107-.472 1.315-.221.635-.493 1.255-.674 1.902-.127.455-.72 2.881.173 2.871.827-.01 1.269-.875 1.687-1.458.146-.203.294-.404.449-.6.477-.609-.558-.072-.764.252-.358.567-.759.933-.426 1.623.168.347 1.241-.017 1.106-.297-.41-.849.533-1.166.57-1.934.017-.362-.514-.285-.728-.217-.457.145-.716.497-.995.867-.26.345-.619 1.152-1.011 1.348l.68-.142c.241.04.134.035.117-.255-.026-.433.027-.872.076-1.302.073-.644.257-1.236.487-1.837.176-.462 1.05-2.09.759-2.55-.17-.269-.89.036-1.026.213-.779 1.011-1.415 2.166-2.185 3.196-.276.367.826.245 1.02-.013zm-1.42-.055c-.479.722-1.15 1.692-1.074 2.595.042.5 1.15.234 1.106-.297-.035-.418.302-.93.489-1.28.164-.306.344-.606.535-.896.158-.237-.136-.436-.336-.46a.751.751 0 0 0-.72.337zm-1.679-1.008c.023-.026.091-.088-.016.011.033-.031.206-.155.141-.117a1.092 1.092 0 0 1 .101-.051c-.102.048.095-.012-.004 0 .048-.006.147.059.223.119.398.314 1.357-.249.85-.65-.697-.551-1.671-.277-2.226.345-.176.197-.092.464.148.552.268.099.595 0 .782-.21zm-.974.887a4.804 4.804 0 0 0-1.185 2.075c-.093.344 1.01.177 1.1-.16a4.424 4.424 0 0 1 1.105-1.932c.19-.192-.162-.273-.285-.271-.265.004-.546.097-.734.287zm-3.838.207a24.815 24.815 0 0 0-.361 1.377c-.076.326-.326 1.01.005 1.27.19.15.471.099.673.014.49-.207.687-1.137.874-1.566a14.229 14.229 0 0 1 .574-1.182 4.067 4.067 0 0 1 .316-.485c.048-.064.102-.128.161-.182.141-.126.013.004-.039.003.644.005.839-.833.09-.839-.86-.007-1.367.937-1.713 1.588a18.035 18.035 0 0 0-.644 1.402c-.077.181-.152.361-.231.541-.131.301-.163.154.112.038l.673.014c.094.273.135.318.126.135.006-.081.016-.161.028-.24.034-.25.094-.497.151-.743.078-.337.167-.672.264-1.004.183-.626-.918-.632-1.061-.141zm-1.645-3.884c-.034.937-.485 1.206-.945 1.903-.795 1.205-.913 2.809-.963 4.204-.005.134 1.095.004 1.106-.297.053-1.464.206-2.993 1.032-4.245.448-.679.844-.956.877-1.862.005-.134-1.095-.004-1.106.296zm-3.032 3.307c-.265.577-.593 1.295-.498 1.941.079.542 1.187.26 1.106-.297-.065-.443.266-1.08.456-1.494.271-.592-.847-.624-1.064-.15zm-2.405-4.016c.03-.012.06-.023.091-.033-.307.106.289-.062.024-.008.045-.009.09-.015.136-.02-.083.005-.096.007-.04.005.11-.002-.103-.016-.002.003-.045-.008-.053-.017-.035 0-.013-.028-.012-.027.001.005a.253.253 0 0 1 .014.089c.011.221.517.131.62.103.181-.048.497-.167.485-.399-.02-.414-.591-.392-.88-.369a3.053 3.053 0 0 0-.839.218c-.113.045-.479.244-.303.413.174.166.539.068.727-.007zm-2.571 3.689c-.483.023-.924.226-1.204.629-.29.417-.226.992-.25 1.468-.021.427-.113.871-.026 1.295.289 1.396 3.572-1.193 3.935-1.5.469-.397 1.129-.953 1.239-1.596.113-.659-.742-.531-1.087-.334-.797.454-1.102 2.757-.308 3.28.293.193 1.319-.239.882-.527-.469-.309-.118-1.551-.008-1.964.041-.154.093-.313.163-.456.174-.352-.705-.111-.764.233-.063.367-.48.712-.73.951-.659.629-1.452 1.23-2.278 1.621.099-.047.087-1.171.097-1.381.015-.303.015-.586.084-.883.087-.372.236-.243-.18-.224.252-.011.573-.077.731-.299.148-.209-.124-.323-.297-.315zm-4.06 2.788c.262-.372.287-.877.295-1.313.014-.718.408-1.29 1.116-1.463.1-.024.551-.155.504-.33-.048-.178-.501-.058-.602-.034-.815.199-1.629.566-1.982 1.377-.271.623-.016 1.373-.424 1.953-.121.172.412.126.446.12.222-.038.51-.115.647-.309zm-7.067-2.536a35.974 35.974 0 0 0 1.431 1.718c.298.337 1.355-.084 1.019-.464a35.785 35.785 0 0 1-1.431-1.718c-.276-.353-1.336.056-1.019.464zm5.135-8.142c-1.031-.469-1.85.721-1.981 1.545-.345 2.165-.637 4.291-1.139 6.435-.583 2.491-1.271 4.969-2.156 7.371-.364.987-.781 1.961-1.324 2.862-.537.891-.671 1.017-1.194.045-.134-.249-1.177.164-1.106.297 1.934 3.594 4.656-3.227 5.06-4.385.913-2.624 1.593-5.337 2.181-8.051a50.9 50.9 0 0 0 .517-2.709 12.531 12.531 0 0 0 .123-.99c.05-.632.131-1.248.348-1.847.187-.518.22.061-.374-.209.287.131 1.123-.328 1.045-.364zm13.047-3.021c.907-.695-1.198-1.91-1.605-2.111-1.215-.6-2.789-.334-4.069-.176C13.325.849 7.835.954 2.694 2.638c-.703.231-2.528.773-2.672 1.691-.174 1.099.805 2.347 1.495 3.094 2.626 2.839 6.087-.103 7.685-2.413.053-.077-.908-.052-1.088.207-1.083 1.567-2.743 3.687-4.837 2.435-.841-.503-1.424-1.399-1.842-2.261C.094 2.62 5.246 2.216 7.011 1.889c3.538-.656 7.156-.756 10.721-1.231 1.16-.154 2.344-.342 3.5-.079.527.12 2.832 1.449 2.098 2.011-.211.161.795.046.995-.107z" fill="#fff"/>
                        </svg>
                    </div>
                  </div>
                </div>
    
    `;
  if (item.numb > 0) {
    setTimeout(() => {
      document.getElementById("indicateFlip").innerHTML = `${newNumb == 0 ? '<img src="./img/cup.png">' : newNumb}`;
    }, 3000);
  }

  flipTimer1 = setTimeout(() => {
    audioEl.pause();
    audioEl.volume = 1;
    // audioEl.src = `https://proxy.junookyo.workers.dev/?language=vi-VN&text=${meaningTTS}&speed=1`;
    audioEl.src = `https://myapp-9r5h.onrender.com/hear?lang=vi&text=${meaningTTS}`;
    audioEl.play();
  }, 2500);
  flipTimer2 = setTimeout(hoverIn, 3500);
  flipTimer3 = setTimeout(hoverOut, 5500);
};

const hoverIn = () => {
  $(".item-wrapper").addClass("item-hover");
};

const hoverOut = () => {
  $(".item-wrapper").removeClass("item-hover");
};

let textData = { text: "", sound: "", class: "", definitions: [] };
let textData1 = { text: "", sound: "", class: "", definitions: [] };
let textData2 = { text: "", sound: "", class: "", definitions: [] };
let textData3 = { text: "", sound: "", class: "", definitions: [] };
let textData4 = { text: "", sound: "", class: "", definitions: [] };

const editContentDivArr = [
  "editContentDivAmerica",
  "editContentDivEnglish",
  "editContentDivCambridge",
  "editContentDivGoogle"
];
const textDataArr = [
  textData1,
  textData2,
  textData3,
  textData4
];

function handleCheckEdit(id) {
  for (let index in editContentDivArr) {
    if (editContentDivArr[index] != id) {
      document.getElementById(`${editContentDivArr[index]}`).innerHTML = "";
    }
    else {
      textData.text = textDataArr[index].text;
      $("#inputEditWordText").val(textData.text);
      textData.class = textDataArr[index].class;
      $("#inputEditWordClass").val(textData.class);
      textData.definitions = textDataArr[index].definitions;
      $("#inputEditWordExplain").val(JSON.stringify(textData.definitions));
    }
  }
  $("#findSoundHandyBtn").click(function (e) {
    window.open(`https://www.oed.com/search/dictionary/?scope=Entries&q=${textData.text}`, '_blank');
  });
}

function handleCheckSound(id) {
  const audioEl = document.getElementById("tts-audio");
  for (let index in editContentDivArr) {
    if (editContentDivArr[index] == id) {
      if (textDataArr[index].sound.length > 0) {
        textData.sound = textDataArr[index].sound;
      }
      else textData.sound = '';
      audioEl.src = textData.sound;
      audioEl.play();
    }
  }
  $("#inputEditWordSound").val(textData.sound);
  $("#inputEditWordSound").addClass("editItemInputChildActive");
}

const renderExplain = (text, type, definitions, sound, divId, row, check) => {
  const contentBody = document.getElementById(divId);
  const audioEl = document.getElementById("tts-audio");
  contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      ${check ?
      `<button class="close-btn" onclick="handleCheckEdit('${divId}')">
        <i class='bx bx-check'></i>
      </button>
      <button class="close-btn" onclick="handleCheckSound('${divId}')">
        <i class='bx bx-volume-low'></i>
      </button>
      `:
      `<button class="close-btn" id="explainTextSoundBtn">
        <i class='bx bx-volume-low'></i>
      </button>`}
      <button class="close-btn" onclick="handleDelete('${divId}')">
        <i class='bx bx-x'></i>
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType">${row
      ? `<span class="preRow">${row}. </span>`
      : `<span class="preWord">Definitions of</span>`
    }<h2>${text}</h2><span class="pos">${type}</span></div>
        ${definitions.map((item, index) => {
      return `<div class="sn-g">
        ${definitions.length > 1 ? `<span class="num">${index + 1}</span>` : ""}
        ${item}
        </div>`;
    })
      .join("")}
      </div>
    </div>  
      `;

  $("#explainTextSoundBtn").click(function (e) {
    audioEl.src = sound;
    audioEl.play();
  });
};

const handleDelete = (divId) => {
  document.getElementById(`${divId}`).innerHTML = "";
};

const handleChangeTransInput = (e) => {
  if (e.keyCode == 13) {
    handleTranslate();
  }
  return;
};

$("#transBtn").click(function (e) {
  handleTranslate();
});

const handleTranslate = async () => {
  const transInput = document.getElementById("transInput");
  if (/\w*/.test(transInput.value)) {
    let transUrl = `https://myapp-9r5h.onrender.com/trans?text=${transInput.value}&from=en&to=vi`;
    // let transUrl = URL_CORS + `https://myapp-9r5h.onrender.com/trans?text=${transInput.value}&from=en&to=vi`;
    await fetch(transUrl)
      .then((res) => res.json())
      .then((data) => {
        renderTranslate(data);
        $("#searchInput").val("");
        $("#transInput").val("");
        textInput = "";
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const renderTranslate = (arr) => {
  const contentBody = document.getElementById("transContainer");
  contentBody.innerHTML = "";
  if (arr.translation) {
    contentBody.innerHTML = `
    <div class="transItem">
    <div class="transItemHeader">
      <span></span>
      <div style="display: flex;">
        <button class="close-btn" onclick="handleAddTextEnd()">
          <i class='bx bx-plus'></i>
        </button>
        <button class="close-btn" onclick="handleAddNewText()">
          <i class='bx bx-expand-vertical'></i>
        </button>
        <button class="close-btn" onclick="handleDelete('transContainer')">
          <i class='bx bx-x'></i>
        </button>
      </div>
    </div>
    <div class="my-control" id="newText">
      <input class="transItemInput" id="addNewW" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
    </div>
    <p class="transItemTranslation" onclick="addTextToCell('-${arr.translation
      }')">${arr.translation}</p>
    <p>Translation of <b id="tlword">${arr.word}</b></p>
    <div class="transItemPhonetic">
      <p><span id="tlTranscript">${arr.wordTranscription}</span></p>
    </div>
    <div>
      ${Object.keys(arr.translations)
        .map((item) => {
          return `
      <h5 class="transItemType" onclick="addTextToCell(' -${item}')">-${item}</h5>
      ${arr.translations[item]
              .map((m) => {
                return `
      <div class="transItemRow">
        <span onclick="addTextToCell('-${m.translation}')">${m.translation
                  }&emsp;
          ${m.synonyms
                    .map((n, i) => {
                      return `<small>${(i ? ", " : "") + n}</small>`;
                    })
                    .join("")}.</span>
        ${renderFrequency(m.frequency)}
      </div>`;
              })
              .join("")}
      `;
        })
        .join("")}
    </div>
  </div>
  <div id="editContentDivAmerica"></div>
  <div id="editContentDivEnglish"></div>
  <div id="editContentDivCambridge"></div>
  <div id="editContentDivGoogle"></div>
    `;
  }
  renderEditWordDefinition(arr.word);
};

const renderEditWord = () => {
  let contentBody = document.getElementById("editContainer");
  contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
            <a class="close-btn" onclick="setEditWord()">
                <i class='bx bx-check'></i>
            </a>
            <a class="close-btn" onclick="handleDelete('editContainer')">
                <i class='bx bx-x'></i>
            </a>
            </div>
        </div>
        <div class="mainEditContainer">
        <div class="editItemContent">
            <span class="editItemLabel">Find</span>
            <input class="editItemInput" placeholder="find text" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Result</span>
            <div class="editItemInputGroup">
            <input class="editItemInputChild" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()" onkeyup="handleRenderEditWordDefinition(event)">
            <img src="./img/center.png" onclick="handleRenderEditWordDefinitionHandy()" class="editEnterBtn">
            </div>
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Phonetic</span>
            <input class="editItemInput" placeholder="" id="inputEditWordPhonetic" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Type</span>
            <input class="editItemInput" placeholder="" id="inputEditWordClass" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Meaning</span>
            <input class="editItemInput" placeholder="" id="inputEditWordMeaning" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Numb</span>
            <input class="editItemInput" placeholder="" id="inputEditWordNumb" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Sound</span>
            <div class="editItemInputGroup">
            <input class="editItemInputChild" placeholder="" id="inputEditWordSound" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            <img src="./img/center.png" id="findSoundHandyBtn" class="editEnterBtn">
            </div>
        </div>
        <div class="editItemContent">
            <span class="editItemLabel"></span>
            <textarea id="inputEditWordExplain" class="editItemArea" rows="2" onmouseover="this.focus()" onmouseout="this.blur()"></textarea>
        </div>
        </div>
        <div class="subEditContainer">
        <div class="editItemContent">
            <span class="editItemLabel editItemLabelText">Image</span>
            <div class="editItemInputGroup">
            <input class="editItemInputChild" placeholder="" id="inputEditWordImage" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            <img src="./img/center.png" id="makeDefinitionBtn" onclick="makeDefinitionItem()" class="editEnterBtn">
            </div>
        </div>
        <div class="editItemContent">
            <span class="editItemLabel editItemLabelText">Define</span>
            <input class="editItemInput" placeholder="" id="inputEditWordDefine" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel editItemLabelText">Example</span>
            <input class="editItemInput" placeholder="" id="inputEditWordExample" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel editItemLabelText">Synonym</span>
            <input class="editItemInput" placeholder="" id="inputEditWordSynonym" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel editItemLabelText">Result</span>
            <input class="editItemInput" placeholder="" id="inputEditWordItemResult" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        </div>
        </div>
        <div id="editContentDiv"></div>
        <div id="editContentDivAmerica"></div>
        <div id="editContentDivEnglish"></div>
        <div id="editContentDivCambridge"></div>
        <div id="editContentDivGoogle"></div>
        `;

  $("#inputEditWordSound").keydown(function (e) {
    if (e.keyCode == 13) {
      handleFindOEDSound(e.target.value);
    }
  });
};

const makeDefinitionItem = () => {
  let image = $("#inputEditWordImage").val();
  let define = $("#inputEditWordDefine").val();
  let example = $("#inputEditWordExample").val();
  let synonym = $("#inputEditWordSynonym").val();
  let inputText = $("#inputEditWordText").val();
  let newText = inputText.length > 4 ? inputText.slice(0, -2) : inputText;
  const regText = new RegExp(`(${newText}\\w*)`, "gi");
  let res = "";
  if (inputText == "") {
    $("#inputEditWordItemResult").val("Insert text!");
    return;
  }
  if (image !== "") {
    res += `<img class=\"thumb\" src=\"${image}\">`;
  }
  if (define !== "") {
    res += `<span class=\"def\">${define}</span>`;
  }
  if (example !== "") {
    if (inputText !== "") {
      example = example.replace(regText, `<b>$1</b>`);
    }
    res += `<span class=\"x\">${example}</span>`;
  }
  if (synonym !== "") {
    res += `<span class=\"xr-gs\">synonym <small>${synonym}</small></span>`;
  }
  $("#inputEditWordItemResult").val(JSON.stringify(res).slice(1).slice(0, -1));
}

const handleFindOEDSound = (url) => {
  if (/.+\?.+/g.test(url)) {
    let link = url.replace(/\?.+/g, "?tab=factsheet&tl=true#39853451");
    const audioEl = document.getElementById("tts-audio");
    $.get(link, function (html) {
      let mp3Link = $(html).find(".pronunciation-play-button").last().attr("data-src-mp3");
      if (mp3Link) {
        audioEl.src = mp3Link;
        audioEl.play();
        $("#inputEditWordSound").val(mp3Link);
        $("#inputEditWordSound").addClass("editItemInputChildActive");
      }
    });
  }
  else $("#inputEditWordSound").removeClass("editItemInputChildActive");
}

const renderDeleteWord = () => {
  let contentBody = document.getElementById("editContainer");
  contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
                <button class="close-btn" onclick="setDeleteWord()">
                    <i class='bx bx-trash-alt'></i>
                </button>
                <button class="close-btn" onclick="handleDelete('editContainer')">
                  <i class='bx bx-x'></i>
                </button>
            </div>
        </div>
        <div class="editItemContent">
          <span class="editItemLabel">Find</span>
          <input class="editItemInput" placeholder="find delete text" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="editItemContent">
          <span class="editItemLabel">Result</span>
          <input class="editItemInput" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        </div>
        <div id="editContentDiv"></div>
        `;
};

const renderProxySelect = () => {
  let contentBody = document.getElementById("editContainer");
  contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <div style="display: flex;">
                <button class="close-btn" onclick="selectProxy()">
                    <i class='bx bx-check'></i>
                </button>
                <button class="close-btn" onclick="handleDelete('editContainer')">
                  <i class='bx bx-x'></i>
                </button>
            </div>
        </div>
        ${proxyArr
      .map((item, index) => {
        return `<div class="transItemContent">
                    <label>
                    <input type="checkbox" ${item.active ? "checked" : ""
          } onchange="handleThisCheckbox(this)" class="translateInputCheck"  value="${index}">
                        ${item.link}
                    </label>
                </div>`;
      })
      .join("")}
        </div>`;
};

const handleThisCheckbox = (e) => {
  $(".translateInputCheck").not(e).prop("checked", false);
};

const selectProxy = () => {
  let val = document.querySelector(".translateInputCheck:checked").value;
  val == proxyArr.length - 1
    ? (URL_CORS = "")
    : (URL_CORS = proxyArr[val].link);
  proxyArr.forEach((item, index) =>
    index != val ? (item.active = false) : (item.active = true)
  );
  handleDelete("editContainer");
};

const renderCollectionSelect = () => {
  let contentBody = document.getElementById("editContainer");
  contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <div style="display: flex;">
                <button class="close-btn" onclick="selectCollection()">
                    <i class='bx bx-check'></i>
                </button>
                <button class="close-btn" onclick="handleDelete('editContainer')">
                  <i class='bx bx-x'></i>
                </button>
            </div>
        </div>
        ${collectionsArr
      .map((item, index) => {
        return `<div class="transItemContent">
                    <label>
                    <input type="checkbox" ${item.active ? "checked" : ""
          } onchange="handleThisCheckbox(this)" class="translateInputCheck"  value="${index}">
                        ${item.name}
                    </label>
                </div>`;
      })
      .join("")}
        </div>`;
};

const selectCollection = () => {
  let val = document.querySelector(".translateInputCheck:checked").value;
  CURRENT_COLLECTION = collectionsArr[val];
  collectionsArr.forEach((item, index) =>
    index != val ? (item.active = false) : (item.active = true)
  );
  handleDelete("editContainer");
  fetchStartupData();
  getTotalDoneWord(CURRENT_COLLECTION.pass);
  fetchAndRenderCalendarData();
};

let editId;
const handleChangeEditInput = (e) => {
  const editContentDiv = document.getElementById("editContentDiv");
  let arrFilter = dataSheets.filter(
    (item) => item.text.search(`^${e.target.value}.*$`) > -1
  );
  editContentDiv.innerHTML = `
      ${arrFilter
      .map((item, index) => {
        return `
          <a class="my-item" onclick="setInputEditWordResult(${JSON.stringify(
          item
        )
            .split('"')
            .join("&quot;")});">${item.text}</a>
          `;
      })
      .join("")}
    `;
};

const setInputEditWordResult = (item) => {
  document.getElementById("editContentDiv").innerHTML = "";
  editId = item._id;
  $("#inputEditWordText").val(item.text);
  $("#inputEditWordPhonetic").val(item.phonetic);
  $("#inputEditWordClass").val(item.class);
  $("#inputEditWordMeaning").val(item.meaning);
  $("#inputEditWordNumb").val(item.numb);
  $("#inputEditWordSound").val(item.sound);
  $("#inputEditWordExplain").val(JSON.stringify(item.definitions));
  textData.definitions = item.definitions;
  textData.sound = item.sound;
  renderEditWordDefinition(item.text);
};

const handleRenderEditWordDefinition = (e) => {
  if (e.keyCode == 13) {
    renderEditWordDefinition(e.target.value);
    handleFindPhoneticText(e.target.value);
  }
};

const handleRenderEditWordDefinitionHandy = () => {
  let val = $("#inputEditWordText").val();
  renderEditWordDefinition(val);
  handleFindPhoneticText(val);
};

const handleFindPhoneticText = (text) => {
  let transUrl = `https://myapp-9r5h.onrender.com/trans?text=${text}&from=en&to=vi`;
  fetch(transUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.wordTranscription) {
        document.getElementById("inputEditWordPhonetic").value =
          data.wordTranscription;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};


function getTextDataAmerica(text, func) {
  let urlEngAmerica = URL_CORS + `https://www.oxfordlearnersdictionaries.com/search/american_english/direct/?q=${text}`;
  let newText = text.length > 4 ? text.slice(0, -2) : text;
  const regText = new RegExp(`(${newText}\\w*)`, "gi");
  document.getElementById("editContentDivAmerica").innerHTML = "";
  textData1.text = text;
  textData1.sound = '';
  textData1.definitions = [];
  $.get(urlEngAmerica, function (html) {
    let mp3Link = $(html)
      .find(".audio_play_button,.pron-us")
      .attr("data-src-mp3");
    if (mp3Link) {
      textData1.sound = mp3Link;
      let headword = $(html).find(".webtop-g h2").contents()[0].textContent;
      textData1.text = headword;
      let classT = $(html).find(".pos").html();
      textData1.class = classT || '';
      let img = $(html).find("img.thumb").attr("src");
      $(html)
        .find(".sn-gs:first")
        .find(".sn-g")
        .each(function (index) {
          let def = "";
          if (img && index == 0) def += `<img class="thumb" src="${img}">`;
          def += $(this).find("> .def").html()
            ? '<span class="def">' + $(this).find("> .def").text() + "</span>"
            : "";
          let xr = $(this).find(".xr-gs").text();
          if (xr) {
            $(this)
              .find(".xr-gs")
              .each(function () {
                def +=
                  '<span class="xr-gs">' +
                  $(this).find(".prefix").text() +
                  " " +
                  "<small>" +
                  $(this).find(".xr-g,.sep").not(".prefix").append(" ").text() +
                  "&nbsp;</small>" +
                  "</span>";
              });
          }
          $(this)
            .find(">.x-gs .x")
            .each(function () {
              $(this).html($(this).text().replace(regText, `<b>$1</b>`));
              def += '<span class="x">' + $(this).html() + "</span>";
            });
          textData1.definitions.push(def);
        });
      func(
        textData1.text,
        textData1.class,
        textData1.definitions,
        textData1.sound,
        "editContentDivAmerica",
        null,
        1
      );
    }
  });
}

function getTextDataEnglish(text, func) {
  let urlEnglish = URL_CORS + `https://www.oxfordlearnersdictionaries.com/search/english/direct/?q=${text}`;
  let newText = text.length > 4 ? text.slice(0, -2) : text;
  const regText = new RegExp(`(${newText}\\w*)`, "gi");
  document.getElementById("editContentDivEnglish").innerHTML = "";
  textData2.text = text;
  textData2.sound = '';
  textData2.definitions = [];
  $.get(urlEnglish, function (html) {
    let mp3Link = $(html)
      .find(".audio_play_button.pron-us")
      .attr("data-src-mp3");
    if (mp3Link) {
      textData2.sound = mp3Link;
      let headword = $(html).find(".webtop h1").contents()[0].textContent;
      textData2.text = headword;
      let classT = $(html).find(".pos").html();
      textData2.class = classT || '';
      let img = $(html).find("img.thumb").attr("src");
      $(html)
        .find("ol:first")
        .find(".sense")
        .each(function (index) {
          let def = "";
          if (img && index == 0) def += `<img class="thumb" src="${img}">`;
          def += $(this).find(".def").html()
            ? '<span class="def">' + $(this).find(".def").text() + "</span>"
            : "";
          let xr = $(this).find(".xrefs").text();
          if (xr) {
            $(this)
              .find("span.xrefs")
              .each(function () {
                def +=
                  '<span class="xr-gs">' +
                  $(this).find(".prefix").text() +
                  " " +
                  "<small>" +
                  $(this).find(".prefix").next().text() +
                  "</small>" +
                  "</span>";
              });
          }
          $(this)
            .find("span.x")
            .each(function () {
              $(this).html($(this).text().replace(regText, `<b>$1</b>`));
              def += '<span class="x">' + $(this).html() + "</span>";
            });
          textData2.definitions.push(def);
        });
      func(
        textData2.text,
        textData2.class,
        textData2.definitions,
        textData2.sound,
        "editContentDivEnglish",
        null,
        2
      );
    }
  });
}

function getTextDataCambridge(text, func) {
  let urlCambridge = URL_CORS + `https://dictionary.cambridge.org/dictionary/english/${text}`;
  let newText = text.length > 4 ? text.slice(0, -2) : text;
  const regText = new RegExp(`(${newText}\\w*)`, "gi");
  document.getElementById("editContentDivCambridge").innerHTML = "";
  textData3.text = text;
  textData3.sound = '';
  textData3.definitions = [];
  $.get(urlCambridge, function (html) {
    let mp3Link = $(html).find("audio#audio2 source").attr("src");
    if (mp3Link) {
      textData3.sound = "https://dictionary.cambridge.org/" + mp3Link;
      let classT = $(html).find(".pos.dpos").contents()[0]?.textContent;
      textData3.class = classT;
      $(html).find(".def-block.ddef_block")
        .each(function (index) {
          let def = "";
          let img = $(this).find(".dimg").find("amp-img").attr("src");
          if (img) def += `<img class="thumb" src="https://dictionary.cambridge.org/${img}">`;
          let definitions = $(this).find(".def.ddef_d.db").text().replace(/\n/g, '');
          def += definitions ? '<span class="def">' + definitions + "</span>" : "";
          let xs = $(this).find(".def-body.ddef_b").html();
          if (xs) {
            $(this).find(".def-body.ddef_b").find(".eg.deg").each(function () {
              $(this).html($(this).text().replace(regText, `<b>$1</b>`));
              def += '<span class="x">' + $(this).html() + "</span>";
            });
            $(this).find(".def-body.ddef_b").find(".xref").each(function () {
              let lcs = "";
              let length = $(this).find(".lcs div.item").length;
              $(this).find(".lcs div.item a").each(function (index) {
                if (index === length - 1) {
                  lcs += $(this).text();
                } else {
                  lcs += $(this).append(", ").text();
                }
              })
              def += '<span class="xr-gs">' + $(this).find(".xref-title").append(" ").text() + "<small>" + lcs + "</small>" + "</span>";
            })
          }
          textData3.definitions.push(def);
        });
      func(
        textData3.text,
        textData3.class,
        textData3.definitions,
        textData3.sound,
        "editContentDivCambridge",
        null,
        3
      );
    }
  });
}

function getTextDataGG(text, func) {
  let urlGG = `https://myapp-9r5h.onrender.com/example?text=${text}&from=en&to=vi`;
  document.getElementById("editContentDivGoogle").innerHTML = "";
  textData4.text = text;
  textData4.sound = '';
  textData4.definitions = [];
  $.getJSON(urlGG, function (data, textStatus, jqXHR) {
    textData4.class = '';
    textData4.sound = '';
    let examples = data.examples.map((item, index) => {
      return `<span class="x">${item}</span>`;
    }).join('');
    textData4.definitions.push(examples);
    func(
      textData4.text,
      textData4.class,
      textData4.definitions,
      textData4.sound,
      "editContentDivGoogle",
      null,
      4
    );
  });
}

const renderEditWordDefinition = (val) => {
  getTextDataAmerica(val, renderExplain);
  getTextDataEnglish(val, renderExplain);
  getTextDataCambridge(val, renderExplain);
  getTextDataGG(val, renderExplain);
};

const setEditWord = () => {
  let newdata = {
    text: $("#inputEditWordText").val(),
    phonetic: $("#inputEditWordPhonetic").val(),
    meaning: $("#inputEditWordMeaning").val(),
    numb: $("#inputEditWordNumb").val() * 1,
    sound: $("#inputEditWordSound").val(),
    class: $("#inputEditWordClass").val(),
    definitions: JSON.parse($("#inputEditWordExplain").val()),
  };
  // console.log(newdata);
  let objIndex = dataSheets.findIndex((obj) => obj._id == editId);
  dataSheets[objIndex].text = newdata.text;
  dataSheets[objIndex].phonetic = newdata.phonetic;
  dataSheets[objIndex].meaning = newdata.meaning;
  dataSheets[objIndex].numb = newdata.numb;
  dataSheets[objIndex].sound = newdata.sound;
  dataSheets[objIndex].class = newdata.class;
  dataSheets[objIndex].definitions = newdata.definitions;
  localStorage.setItem("sheetData", JSON.stringify(dataSheets));

  let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdate?id=${editId}&col=${CURRENT_COLLECTION.collection}`;
  fetch(url, {
    ...mongoFetchOp,
    method: "POST",
    body: JSON.stringify(newdata),
  })
    .then((res) => res.json())
    .then((data) => {
      handleDelete('editContainer');
    });
};

const setDeleteWord = () => {
  // console.log('delete');
  fetch(
    `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/delete?id=${editId}&col=${CURRENT_COLLECTION.collection}`,
    mongoFetchOp
  )
    .then((res) => res.json())
    .then((data) => {
      $("#inputEditWord").val("");
      $("#inputEditWordText").val("");
      $("#editContentDiv").html("");
      dataSheets = dataSheets.filter((obj) => obj._id !== editId);
      localStorage.setItem("sheetData", JSON.stringify(dataSheets));
    });
};

const addTextToCell = (text) => {
  const addNewW = document.getElementById("addNewW");
  addNewW.value += text;
};

const renderFrequency = (num) => {
  switch (num) {
    case 3:
      return `<div class="transFrequency">
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(218,220,224);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(218,220,224);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
              </div>`;
    case 1:
      return `<div class="transFrequency">
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
              </div>`;
    default:
      return `<div class="transFrequency">
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(26,115,232);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
                <span
                    style="background-color: rgb(218,220,224);border-radius: 1px;height: 6px;margin: 1px;width: 10px;">
                  </span>
              </div>`;
  }
};

const handleAddNewText = () => {
  let addNewW = document.getElementById("addNewW");
  let newText = document.getElementById("newText");
  addNewW.style.height = "21px";
  newText.style.opacity = "1";
  newText.style.height = "auto";
};

const handleAddTextEnd = () => {
  let data = {};
  if (addNewW.value.length > 0) {
    data.text = textData.text;
    data.phonetic = $("#tlTranscript").text();
    data.meaning = $("#addNewW").val();
    data.numb = 210;
    data.sound = textData.sound;
    data.definitions = textData.definitions;
    data.class = textData.class;
    // console.log(data);
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertText?col=${CURRENT_COLLECTION.collection}`;
    fetch(url, {
      ...mongoFetchOp,
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        $("#addNewW").val("");
        $("#explainContainer,#transContainer").html("");
        getAllData(CURRENT_COLLECTION.collection).then((data) => {
          let newdata = data.sort((a, b) => a._id - b._id);
          localStorage.removeItem("sheetData");
          localStorage.setItem("sheetData", JSON.stringify(newdata));
          //save to array script
          getLocalSheetData();
        });
      });
  }
};