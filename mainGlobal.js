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
  // console.log('fetch all data');
  await fetchAndRenderCalendarData();

  await getAllData(CURRENT_COLLECTION.history).then((data) => {
    localStorage.removeItem("historyData");
    localStorage.setItem("historyData", JSON.stringify(data));
    //save to array script
    getRenderLocalHistoryData();
  });

  await getAllData(CURRENT_COLLECTION.collection).then((data) => {
    let newdata = data.sort((a, b) => a._id - b._id);
    localStorage.removeItem("sheetData");
    localStorage.setItem("sheetData", JSON.stringify(newdata));
    //save to array script
    getLocalSheetData();
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
var todayData;

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
  let dateProgressDivText = `<span>${data[0].startIndex1 + 1
    }</span><span> &#8226; </span><span>${data[1].startIndex2 + 50}</span>`;
  $(".dateProgressDiv").html(dateProgressDivText);
  $(".calendarContent").css(
    "background-image",
    `url("./img/${todaysMonth + 1}.jpg")`
  );

  let firstDayofMonth = new Date(todaysYear, todaysMonth, 1).getDay();
  let lastDateofMonth = new Date(todaysYear, todaysMonth + 1, 0).getDate();
  let lastDayofMonth = new Date(
    todaysYear,
    todaysMonth,
    lastDateofMonth
  ).getDay();
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
      ? (item["class"] = "normalDay")
      : (item["class"] = "");

    if (item.date === date.getDate() && item.month === date.getMonth()) {
      item["class"] += " todayDay";
    }

    if (
      item.date === startDay.getDate() &&
      item.month === startDay.getMonth()
    ) {
      item["class"] += " startDay";
    }

    if (item.date === endDay.getDate() && item.month === endDay.getMonth()) {
      item["class"] += " endDay";
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
  // console.log(monthDateArr);
  const htmlDate = document.getElementById("htmlDate");
  htmlDate.innerHTML = "";
  for (let i = 0; i < monthDateArr.length; i++) {
    htmlDate.innerHTML += `
      <tr class="weekDay">
        ${monthDateArr[i]
        .map((item, index) => {
          return `
                <td>
                    <div ${item.date == date.getDate() &&
              item.month == date.getMonth()
              ? 'id="todayReset" onclick="resetTodaySchedule(true)"'
              : ""
            } class="${item.month == date.getMonth() && index == 0
              ? `${item.class} sundayDay`
              : index == todaysWeekDay && item.class !== ""
                ? `todayWeekDay ${item.class}`
                : `${item.class}`
            }" >
                    <span>${item.date}
                    ${item.indicate
              ? `<span class="dayIndicate1 ${item.time1
                ? "complete" + Math.floor(item.time1 / 3)
                : ""
              }"></span>
                    <span class="dayIndicate2 ${item.time2 ? "complete" + Math.floor(item.time2 / 3) : ""
              }"></span>`
              : ""
            }
                    </span>
                    </div>
                </td>
            `;
        })
        .join("")}
      </tr>
      `;
  }

  // renderCalendarProgress---------------
  let checkValidWeek =
    (date.getDate() > endDay.getDate() &&
      date.getMonth() == endDay.getMonth()) ||
    (date.getDate() < startDay.getDate() &&
      date.getMonth() == startDay.getMonth());
  setTodayProgressHtml(checkValidWeek);
};

const renderHistorySlide = (numb) => {
  const historyTable = document.getElementById("historyTable");
  let historyTableItem = dataHistory.find((item) => item.index == numb);
  let historyTableData = historyTableItem.data;
  let checkRowNum = $(".dateProgressDiv span:first-child").text();
  if (numb == dataHistory.length - 1) {
    historyTable.innerHTML = `
        ${historyTableData
        .map((item, index) => {
          return `
                    <div class="tableItem">
                      <span  ${item.fromD
              ? `class="term" onclick="commitNewWork(${item.row},${numb})"`
              : `onclick="commitNewWork(${item.row},${numb})" class="term_not_complete"`
            }>${item.row} - ${item.row + 199}</span>
                      ${item.fromD
              ? `<div class="desc">
                        <span>${item.fromD}</span>
                        <span>${item.toD}</span>
                      </div>`
              : item.row == checkRowNum
                ? `<div class="desc" id="todayProgressHtml"></div>`
                : `<div class="desc"></div>`
            }
                    </div>
                `;
        })
        .join("")}
        `;
  } else
    historyTable.innerHTML = `
        ${historyTableData
        .map((item, index) => {
          return `
                <div class="tableItem">
                  <span  ${item.fromD
              ? `class="term" onclick="commitNewWork(${item.row},${numb})"`
              : `onclick="commitNewWork(${item.row},${numb})" class="term_not_complete"`
            }>${item.row} - ${item.row + 199}</span>
                  ${item.fromD
              ? `<div class="desc">
                    <span>${item.fromD}</span>
                    <span>${item.toD}</span>
                  </div>`
              : `<div class="desc"></div>`
            }
                </div>
            `;
        })
        .join("")}
        `;
};

const setTodayProgressHtml = (valid) => {
  if (valid) {
    $("#todayProgressHtml").html('<img src="./img/cup.png" width="25px">');
  } else if (todayData) {
    $("#todayProgressHtml").html(`
        <div class="dateProgressContent" ${todayData.time1 >= 9 ? 'style="color: #000;"' : ""
      }>
            <span class="dateProgressImg">
            ${todayData.time1 >= 9
        ? '<img src="./img/check.png" width="18">'
        : ""
      }
            </span>
            <span onclick="setWordList(${JSON.stringify(todayData)
        .split('"')
        .join("&quot;")},1)">${todayData.startIndex1 + 1} - ${todayData.startIndex1 + 50
      }</span>
            <span class="dateProgressFraction">${todayData.time1}/9</span>
        </div>
        <div class="dateProgressContent" ${todayData.time2 >= 9 ? 'style="color: #000;"' : ""
      }>
            <span class="dateProgressImg">
            ${todayData.time2 >= 9
        ? '<img src="./img/check.png" width="18">'
        : ""
      }
            </span>
            <span onclick="setWordList(${JSON.stringify(todayData)
        .split('"')
        .join("&quot;")},2)">${todayData.startIndex2 + 1} - ${todayData.startIndex2 + 50
      }</span>
            <span class="dateProgressFraction">${todayData.time2}/9</span>
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

$("#historyTableBtnLeft").click(function (e) {
  if (slideIndex == dataHistory.length) {
    $("#calendarContent").html("");
  }
  showSlides((slideIndex += -1));
});

$("#historyTableBtnRight").click(function (e) {
  showSlides((slideIndex += 1));
});

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
        <input class="calendarItemInput" value="${row} - ${row + 199
    }" autocomplete="off" id="commitHistoryItemRow"
        onmouseover="this.focus()" onmouseout="this.blur()">
        <input type="date"  data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemFromD" autocomplete="off"
        onmouseover="this.focus()" onmouseout="this.blur()">
        <input type="date"  data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemToD" autocomplete="off"
        onmouseover="this.focus()" onmouseout="this.blur()">
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

const playTTSwithValueSound = (src) => {
  const audioEl = document.getElementById("tts-audio");
  audioEl.volume = 1;
  if (src.length > 0) {
    audioEl.pause();
    audioEl.src = src;
    audioEl.play();
  }
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
  let cardMeaning = item.meaning.replace(
    /\s\-(.+?)\-/g,
    `\n【 $1 】\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`
  );
  cardMeaning = cardMeaning
    .replace(/\-/g, `\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`)
    .substring(1);
  let meaningTTS = item.meaning.replace(/\s\-(.+?)\-/g, "+").replace(/\-/g, "+");
  const flashCardContent = document.getElementById("flashCardContent");
  flashCardContent.innerHTML = `
                <div class="item">
                  <div class="item-wrapper">
                    <div class="indicateFlip">
                        <span id="indicateFlip">
                        ${item.numb}
                        </span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="30.229" viewBox="0 0 120 30.229">
                        <path
                          d="M106.136 16.866c0 .985-.142 2.075.014 3.047.078.484 1.133.095 1.283-.158.432-.727.522-1.79.743-2.596.454-1.649 1.184-3.224 1.948-4.748.473-.944.588-.954.661.131.068 1.01.461 1.746.104 2.752-.265.748-.595 1.452-.832 2.214-.162.521-.398 2.114-.862 2.429l1.033.224c.63-1.247 2.41-2.456 3.428-3.397.986-.912-.533.341-.474-.431-.048.62-.541 1.302-.794 1.856-.316.691-.798 1.488-.787 2.269.01.84 1.651.227 1.952.06 2.183-1.204 3.86-3.318 5.429-5.201.384-.462-.959-.371-1.238-.038-.785.934-2.946 3.426-2.467 4.798.565 1.621 2.504.012 3.476.47.401.19 1.616-.386 1.054-.653-.784-.371-1.782.031-2.586.143-1.619.224 1.339-4.219 1.763-4.722l-1.238-.038c-.157.188-4.825 4.79-4.814 4.824-.372-1.124 1.501-2.86 1.595-4.074.012-.161-.102-.265-.259-.287-.942-.132-1.595.71-2.215 1.294-.917.863-2.482 1.945-3.058 3.085-.287.568.805.38 1.033.224 1.361-.925 1.566-3.786 2.192-5.214.468-1.064-.042-1.858-.104-2.946-.042-.74-.167-1.493-.996-1.648-1.469-.274-2.272 1.885-2.723 2.848-.442.941-.877 1.898-1.225 2.878-.372 1.046-.41 2.502-.974 3.451l1.283-.158c-.145-.91-.013-1.93-.013-2.852-.001-.568-1.33-.286-1.33.162zm-3.198-1.524c1.766.43-.532 4.242-.918 4.872-.131.214 1.103.13 1.314-.216.482-.787 2.84-4.68.685-5.204-.331-.082-1.507.444-1.081.548zm-7.258.025c.116-.443.977-.47 1.525-.512.41-.031.818-.103 1.225-.162.155-.023.31-.041.466-.053-.509.048-.13-.642-.461-.098-.409.672-.779 1.361-1.246 1.996-.458.625-1.135.916-1.639 1.475-.888.985.31 1.826 1.193 2.018.772.168 1.669-.041 2.394-.305a6.672 6.672 0 0 0 .757-.337c.094-.049.187-.098.282-.144-.554.277-.534-.409-.455.24.078.641 1.409.307 1.327-.356-.215-1.756-2.207-.242-3.13-.101-.4.062-1.142.09-1.306-.391-.1-.294.846-.776 1.038-.949.685-.613 1.16-1.439 1.619-2.224.193-.332.943-1.15.641-1.567-.386-.533-1.457-.205-1.96-.132-1.346.196-3.186.028-3.623 1.696-.173.662 1.189.517 1.349-.09zm-5.556-2.017c-.149.154.062-.05.088-.073a3.19 3.19 0 0 1 .486-.347c.748-.446 1.489-.077 2.087.444.334.292 1.567-.217 1.236-.505-1.55-1.351-3.755-.937-5.125.481-.228.236.193.353.35.353.324 0 .652-.119.878-.353zm2.158-4.981c-.847.774-1.331 1.819-1.626 2.908-.282 1.04-.065 2.268-.127 3.338a9.09 9.09 0 0 1-1.304 4.172c-.368.612.983.58 1.26.118 1.081-1.799 1.408-3.732 1.434-5.813.022-1.651.162-3.192 1.462-4.379.601-.55-.698-.709-1.098-.344zm-8.071 1.112a2.79 2.79 0 0 0 .565-.893c.218-.586-.136-.992-.707-1.124a1.063 1.063 0 0 0-.938.252c-.203.199-.143.463.142.528.272.064.284.232.173.476a2.28 2.28 0 0 1-.23.378 2.941 2.941 0 0 1-.048.065c-.076.098.07-.084.006-.006a2.029 2.029 0 0 1-.041.048c-.19.21-.154.452.142.528.296.076.727-.018.938-.252zm-3.462 3.361c-1.409.782-1.364 2.502-1.379 3.947-.013 1.415.252 2.375 1.738 1.976 1.298-.348 2.419-1.474 3.346-2.381 1.15-1.126 2.263-2.393 2.984-3.842.344-.691.268-1.47-.702-1.156-.904.294-1.486 1.078-2.004 1.835-1.534 2.237-2.536 5.772.697 6.956.367.134 1.576-.418 1.067-.604-2.148-.787-2.18-2.748-1.46-4.627.317-.826.79-1.589 1.322-2.291a4.603 4.603 0 0 1 .635-.69c-.182.16-.566-.179-.732.408-.505 1.788-2.438 3.52-3.769 4.699a9.702 9.702 0 0 1-1.158.888c-.534.344-.42.085-.544-.54-.193-.972-.296-3.661.767-4.25.781-.434-.413-.547-.806-.329zm-22.016 2.975c.239 1.391.656 3.407 2.201 3.836 1.049.292 2.046-1.049 2.572-1.715 1.496-1.895 2.634-4.112 3.652-6.293.84-1.798 1.842-3.992 1.604-6.031-.05-.432-1.348-.12-1.327.355.121 2.843 1.115 5.438 1.374 8.282.124 1.357.005 7.769 2.599 6.695 1.462-.605 1.907-4.415 2.342-5.702 1.508-4.465 3.986-8.448 7.102-11.965.372-.42-.96-.32-1.231-.013-4.228 4.771-6.511 10-8.381 15.988a10.296 10.296 0 0 1-.254.709c.221-.558-.263-1.712-.368-2.293-.35-1.922-.476-3.874-.677-5.814-.221-2.146-1.085-4.037-1.178-6.241l-1.327.355c.364 3.122-1.98 6.853-3.472 9.408-.722 1.237-1.522 2.584-2.596 3.552-.138.124-1.231-3.013-1.309-3.468-.074-.433-1.408-.116-1.327.356zM41.802 17.12c.925-1.236 1.687-2.622 2.622-3.835l-1.231.256c.018.029-.48 1.328-.566 1.578-.265.762-.592 1.506-.809 2.282-.152.546-.864 3.457.208 3.445.992-.012 1.523-1.05 2.024-1.75.175-.244.353-.485.539-.72.572-.731-.67-.086-.917.302-.43.68-.911 1.12-.511 1.948.202.416 1.489-.02 1.327-.356-.492-1.019.64-1.399.684-2.321.02-.434-.617-.342-.874-.26-.548.174-.859.596-1.194 1.04-.312.414-.743 1.382-1.213 1.618l.816-.17c.289.048.161.042.14-.306-.031-.52.032-1.046.091-1.562.088-.773.308-1.483.584-2.204.211-.554 1.26-2.508.911-3.06-.204-.323-1.068.043-1.231.256-.935 1.213-1.698 2.599-2.622 3.835-.331.44.991.294 1.224-.016zm-1.704-.066c-.575.866-1.38 2.03-1.289 3.114.05.6 1.38.281 1.327-.356-.042-.502.362-1.116.587-1.536.197-.367.413-.727.642-1.075.19-.284-.163-.523-.403-.552a.901.901 0 0 0-.864.404zm-2.015-1.21c.028-.031.109-.106-.019.013.04-.037.247-.186.169-.14a1.31 1.31 0 0 1 .121-.061c-.122.058.114-.014-.005 0 .058-.007.176.071.268.143.478.377 1.628-.299 1.02-.78-.836-.661-2.005-.332-2.671.414-.211.236-.11.557.178.662.322.119.714 0 .938-.252zm-1.169 1.064a5.765 5.765 0 0 0-1.422 2.49c-.112.413 1.212.212 1.32-.192a5.309 5.309 0 0 1 1.326-2.318c.228-.23-.194-.328-.342-.325-.318.005-.655.116-.881.344zm-4.606.248a29.778 29.778 0 0 0-.433 1.652c-.091.391-.391 1.212.006 1.524.228.18.565.119.808.017.588-.248.824-1.364 1.049-1.879a17.075 17.075 0 0 1 .689-1.418 4.88 4.88 0 0 1 .379-.582c.058-.077.122-.154.193-.218.169-.151.016.005-.047.004.773.006 1.007-1 .108-1.007-1.032-.008-1.64 1.124-2.056 1.906a21.642 21.642 0 0 0-.773 1.682c-.092.217-.182.433-.277.649-.157.361-.196.185.134.046l.808.017c.113.328.162.382.151.162.007-.097.019-.193.034-.288.041-.3.113-.596.181-.892.094-.404.2-.806.317-1.205.22-.751-1.102-.758-1.273-.169zm-1.974-4.661c-.041 1.124-.582 1.447-1.134 2.284-.954 1.446-1.096 3.371-1.156 5.045-.006.161 1.314.005 1.327-.356.064-1.757.247-3.592 1.238-5.094.538-.815 1.013-1.147 1.052-2.234.006-.161-1.314-.005-1.327.355zm-3.638 3.968c-.318.692-.712 1.554-.598 2.329.095.65 1.424.312 1.327-.356-.078-.532.319-1.296.547-1.793.325-.71-1.016-.749-1.277-.18zm-2.886-4.819c.036-.014.072-.028.109-.04-.368.127.347-.074.029-.01.054-.011.108-.018.163-.024-.1.006-.115.008-.048.006.132-.002-.124-.019-.002.004-.054-.01-.064-.02-.042 0-.016-.034-.014-.032.001.006a.303.303 0 0 1 .017.107c.013.265.62.157.744.124.217-.058.596-.2.582-.479-.024-.497-.709-.47-1.056-.443a3.664 3.664 0 0 0-1.007.262c-.136.054-.575.293-.364.496.209.199.647.082.872-.008zm-3.085 4.427c-.58.028-1.109.271-1.445.755-.348.5-.271 1.19-.3 1.762-.025.512-.136 1.045-.031 1.554.347 1.675 4.286-1.432 4.722-1.8.563-.476 1.355-1.144 1.487-1.915.136-.791-.89-.637-1.304-.401-.956.545-1.322 3.308-.37 3.936.352.232 1.583-.287 1.058-.632-.563-.371-.142-1.861-.01-2.357.049-.185.112-.376.196-.547.209-.422-.846-.133-.917.28-.076.44-.576.854-.876 1.141-.791.755-1.742 1.476-2.734 1.945.119-.056.104-1.405.116-1.657.018-.364.018-.703.101-1.06.104-.446.283-.292-.216-.269.302-.013.688-.092.877-.359.178-.251-.149-.388-.356-.378zm-4.872 3.346c.314-.446.344-1.052.354-1.576.017-.862.49-1.548 1.339-1.756.12-.029.661-.186.605-.396-.058-.214-.601-.07-.722-.041-.978.239-1.955.679-2.378 1.652-.325.748-.019 1.648-.509 2.344-.145.206.494.151.535.144.266-.046.612-.138.776-.371zm-8.48-3.043a43.169 43.169 0 0 0 1.717 2.062c.358.404 1.626-.101 1.223-.557a42.942 42.942 0 0 1-1.717-2.062c-.331-.424-1.603.067-1.223.557zm6.162-9.77c-1.237-.563-2.22.865-2.377 1.854-.414 2.598-.764 5.149-1.367 7.722-.7 2.989-1.525 5.963-2.587 8.845-.437 1.184-.937 2.353-1.589 3.434-.644 1.069-.805 1.22-1.433.054-.161-.299-1.412.197-1.327.356 2.321 4.313 5.587-3.872 6.072-5.262 1.096-3.149 1.912-6.404 2.617-9.661a61.08 61.08 0 0 0 .62-3.251 15.037 15.037 0 0 0 .148-1.188c.06-.758.157-1.498.418-2.216.224-.622.264.073-.449-.251.344.157 1.348-.394 1.254-.437zM29.191 2.98c1.088-.834-1.438-2.292-1.926-2.533-1.458-.72-3.347-.401-4.883-.211-6.393.784-12.98.909-19.15 2.93-.844.277-3.034.927-3.207 2.029-.209 1.319.966 2.816 1.794 3.713 3.151 3.407 7.304-.124 9.222-2.896.064-.092-1.09-.062-1.306.248-1.299 1.88-3.292 4.424-5.804 2.922-1.009-.604-1.709-1.679-2.21-2.713-1.609-3.325 4.573-3.81 6.691-4.202C12.659 1.48 17 1.36 21.278.79c1.392-.185 2.813-.41 4.2-.095.632.144 3.398 1.739 2.518 2.413-.253.193.954.055 1.194-.128z"
                          fill="#fff" />
                      </svg>
                    </div>
                  </div>
                </div>
    
    `;

  if (item.numb > 0) {
    setTimeout(() => {
      document.getElementById("indicateFlip").innerHTML = `
      ${newNumb == 0 ? '<img src="./img/cup.png" width="42px">' : newNumb}
      `;
    }, 500);
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

const hoverIn = (text) => {
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
      $("#inputEditWordExplain").val(textData.definitions);
    }
  }
  $("#findSoundHandyBtn").click(function (e) {
    console.log('find');
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
  $(".checkExplainBtn").show();
  $("#inputEditWordSound").val(textData.sound);
}

const renderExplain = (text, type, definitions, sound, divId, row, check) => {
  const contentBody = document.getElementById(divId);
  const audioEl = document.getElementById("tts-audio");
  contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      ${check ?
      `<button class="closeBtn checkExplainBtn" style="display: none;" onclick="handleCheckEdit('${divId}')">
        <i class='bx bx-check'></i>
      </button>
      <button class="closeBtn soundBtnSVG" onclick="handleCheckSound('${divId}')">
        <i class='bx bx-volume-low'></i>
      </button>
      `:
      `<button class="closeBtn soundBtnSVG" id="explainTextSoundBtn">
        <i class='bx bx-volume-low'></i>
      </button>`}
      <button class="closeBtn" onclick="handleDelete('${divId}')">
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
      <button class="sound-btn" id="tranSoundBtn">
        <i class='bx bx-volume-full'></i>
      </button>
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
  $("#tranSoundBtn").click(function (e) {
    playTTSwithValueSound(textData.sound);
  });
};

const renderEditWord = () => {
  let contentBody = document.getElementById("editContainer");
  contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
            <button class="close-btn" onclick="setEditWord()">
                <i class='bx bx-check'></i>
            </button>
            <button class="close-btn" onclick="handleDelete('editContainer')">
                <i class='bx bx-x'></i>
            </button>
            </div>
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Find</span>
            <input class="editItemInput" placeholder="find text" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Result</span>
            <input class="editItemInput" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()" onkeyup="handleRenderEditWordDefinition(event)">
            <img src="./img/center.png" onclick="handleRenderEditWordDefinitionHandy()" class="editEnterBtn">
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
            <input class="editItemInput" placeholder="" id="inputEditWordSound" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            <img src="./img/center.png" id="findSoundHandyBtn" class="editEnterBtn">
        </div>
        <div class="editItemContent">
            <span class="editItemLabel">Explain</span>
            <textarea id="inputEditWordExplain" class="editItemArea" rows="3"></textarea>
        </div>
        </div>
        <div id="editContentDiv"></div>
        <div id="editContentDivAmerica"></div>
        <div id="editContentDivEnglish"></div>
        <div id="editContentDivCambridge"></div>
        <div id="editContentDivGoogle"></div>
        `;
};

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
      textData1.class = classT;
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
      textData2.class = classT;
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
      let classT = $(html).find(".pos.dpos").contents()[0].textContent;
      textData3.class = classT;
      $(html).find(".def-block.ddef_block")
        .each(function (index) {
          let def = "";
          let img = $(this).find(".dimg").find("amp-img").attr("src");
          if (img) def += `<img class="thumb" src="https://dictionary.cambridge.org/${img}">`;
          let definitions = $(this).find(".def.ddef_d.db").text();
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
              $(this).find(".lcs div.item").each(function (index) {
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
    definitions: $("#inputEditWordExplain").val(),
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
      getAllData(CURRENT_COLLECTION.collection).then((data) => {
        handleDelete('editContainer');
        let newdata = data.sort((a, b) => a._id - b._id);
        localStorage.removeItem("sheetData");
        localStorage.setItem("sheetData", JSON.stringify(newdata));
        //save to array script
        getLocalSheetData();
      });
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
