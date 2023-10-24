
const chunk = (array, size) =>
    array.reduce((acc, _, i) => {
        if (i % size === 0) acc.push(array.slice(i, i + size))
        return acc
    }, []);

let dataSheets = [];
let dataHistory = [];
let slideIndex = 1;
let mongoFetchOp = {};


const getToken = () => {
    let loginItem = sessionStorage.getItem("loginItem");
    if (loginItem == null) {
        window.location.href = './index.html';
    }
    if (loginItem !== null) {
        fetch('https://realm.mongodb.com/api/client/v2.0/auth/session', {
            method: 'post',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${loginItem}`
            }
        }).then(res => res.json()).then(data => {
            sessionStorage.removeItem('accessItem');
            sessionStorage.setItem('accessItem', JSON.stringify(data));
            getWeatherKey(data.access_token);
            getAccesToken();
        })
    }


}

const getWeatherKey = (token) => {
    let urlkey = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/loginGetKeys';
    let opts = {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }
    fetch(urlkey, opts).then(res => res.json()).then(data => {
        // console.log(data);
        sessionStorage.setItem('weatherKey', JSON.stringify(data));
    })
}

getToken();

const getAccesToken = () => {
    let accessItem = sessionStorage.getItem("accessItem");
    if (accessItem !== null) {
        mongoFetchOp = {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${JSON.parse(accessItem).access_token}`
            }
        }
    }
}

setInterval(() => {
    getToken();
}, 1620000);

const getLocalSheetData = () => {
    let item = localStorage.getItem("sheetData")
    if (item !== null) {
        dataSheets = JSON.parse(item);
    }
}

const getRenderLocalHistoryData = () => {
    let itemH = localStorage.getItem("historyData");
    if (itemH !== null) {
        dataHistory = JSON.parse(itemH);
        dataHistory = dataHistory.sort((a, b) => a.index - b.index)
    }
    slideIndex = dataHistory.length - 1;
    showSlides(slideIndex);
}


const getAllData = async (text) => {
    const res = await fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getAllData?collection=${text}`)
    return res.json();
}

const wakeupServer = async () => {
    let url = URL_CORS + `https://myapp-9r5h.onrender.com/wakeup`;
    $(".serverDot").removeClass("serverDotToggle");
    await fetch(url)
        .then(res => res.text())
        .then(data => {
            if (data == 'ok!') {
                $(".serverDot").addClass("serverDotToggle");
            }
        })
}

$(".serverDot").click(function (e) {
    wakeupServer();
});

const fetchAndRenderCalendarData = async () => {
    await getAllData(CURRENT_COLLECTION.schedule).then(data => {
        data = data.sort((a, b) => new Date(a.date) - new Date(b.date))
        renderCalendar(data);
    })
};

const fetchStartupData = async () => {
    // console.log('fetch all data');
    await fetchAndRenderCalendarData();

    await getAllData(CURRENT_COLLECTION.history).then(data => {
        localStorage.removeItem('historyData');
        localStorage.setItem('historyData', JSON.stringify(data));
        //save to array script
        getRenderLocalHistoryData();
    })

    await getAllData(CURRENT_COLLECTION.collection).then(data => {
        let newdata = data.sort((a, b) => a._id - b._id);
        localStorage.removeItem('sheetData');
        localStorage.setItem('sheetData', JSON.stringify(newdata));
        //save to array script
        getLocalSheetData();
    })
}

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
        document.getElementById('contentBody').innerHTML = '';
        document.getElementById('contentBody').appendChild(a);

        if (val.length > 2) {
            let arrFilter = dataSheets.filter(item => item.text.search(`^${val}.*$`) > -1);
            if (arrFilter.length == 0) {
                document.getElementById("transInput").value = val;
            }
            for (i = 0; i < arrFilter.length; i++) {
                let item = arrFilter[i]

                b = document.createElement("a");
                b.setAttribute("class", "my-item");
                b.innerHTML = `<small><small>${i + 1}</small></small> ${item.text}`;
                b.addEventListener("click", function (e) {
                    inp.value = '';
                    playTTSwithValue(item);
                    renderFlashcard(item);
                    if (item.numb > 1) {
                        handleCheckItem(item._id);
                        let objIndex = dataSheets.findIndex((obj => obj._id == item._id));
                        dataSheets[objIndex].numb += -1;
                        localStorage.setItem('sheetData', JSON.stringify(dataSheets));
                    }
                    else {
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
        }
        else if (e.keyCode >= 49 && e.keyCode <= 57) {
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
}

autocomplete(document.getElementById("searchInput"));

$(document).keydown(function (e) {
    if ($(e.target).is("input,select")) {
        if (e.keyCode == 27) {
            $('#searchInput').val('');
            $('#transInput').val('');
            textInput = '';
            return;
        }
        return;
    };
    if (e.keyCode == 27 || e.keyCode == 32) {
        $('#searchInput').val('');
        $('#transInput').val('');
        textInput = '';
        closeAllLists();
        return;
    }
    let x = document.getElementsByClassName('my-item');
    if (e.keyCode >= 49 && e.keyCode <= 57 && x.length > 0) {
        x[e.keyCode - 49].click();
        textInput = '';
        return;
    }
    if (e.keyCode >= 65 && e.keyCode <= 90) {
        textInput += e.key;
        $('#searchInput').val(textInput);
        renderResult();

    }
    if (e.keyCode == 8) {
        textInput = textInput.slice(0, -1);
        $('#searchInput').val(textInput);
        renderResult();
    };

    function renderResult(params) {
        const contentBody = document.getElementById('contentBody');
        if (textInput.length > 2) {
            let arrFilter = dataSheets.filter(item => item.text.search(`^${textInput}.*$`) > -1);
            if (arrFilter.length == 0) {
                $('#transInput').val(textInput);
                contentBody.innerHTML = '';
            }
            else {
                contentBody.innerHTML = '';
                let a = document.createElement("DIV");
                a.setAttribute("class", "autocomplete-items");
                contentBody.appendChild(a);
                for (i = 0; i < arrFilter.length; i++) {
                    let item = arrFilter[i]
                    let b = document.createElement("a");
                    b.setAttribute("class", "my-item");
                    b.innerHTML = `<small><small>${i + 1}</small></small> ${item.text}`;
                    b.addEventListener("click", function (e) {
                        $('#searchInput').val('');
                        $('#transInput').val('');
                        textInput = '';
                        playTTSwithValue(item);
                        renderFlashcard(item);
                        if (item.numb > 1) {
                            handleCheckItem(item._id);
                            let objIndex = dataSheets.findIndex((obj => obj._id == item._id));
                            dataSheets[objIndex].numb += -1;
                            localStorage.setItem('sheetData', JSON.stringify(dataSheets));
                        }
                        else {
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

})

const getTotalDoneWord = (text) => {
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/countCollection?collection=${text}`)
        .then(res => res.json()).then(data => {
            $('#wordNum').html(data);
        })
}

getTotalDoneWord(CURRENT_COLLECTION.pass);


const getLastTimeLog = () => {
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getLogTime'
    fetch(url).then(res => res.json())
        .then(data => {
            // console.log(data.time);
            sessionStorage.setItem('lastTime', data.time);
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
            let resMsg = dd > 0 ? dd + ' days ago' : hh > 0 ? hh + ' hours ago' : mm + ' minutes ago';
            $('.timeLog').html('Last opened ' + resMsg);

            let date = new Date().getTime();
            let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/logTime?time=${date}`
            fetch(url).then(res => res.json())
        })
}

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
    todayData = data.find(item => item.date === formatDate(date));
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
    $('.dateProgressDiv').html(dateProgressDivText);
    // $('div.weekDate').eq(todaysWeekDay).css('color', '#000000');
    $('.calendarHeader').css('background-image', `url("./img/${todaysMonth + 1}.jpg")`);

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
        item.month == date.getMonth() ? item["class"] = "normalDay" : item["class"] = '';

        if (item.date === date.getDate() && item.month === date.getMonth()) {
            item["class"] += " todayDay";
        }

        if (item.date === startDay.getDate() && item.month === startDay.getMonth()) {
            item["class"] += " startDay";
        }

        if (item.date === endDay.getDate() && item.month === endDay.getMonth()) {
            item["class"] += " endDay";
        }

        return item;
    });
    let startDayIndex = monthDateArr.findIndex(item => item.date === startDay.getDate() && item.month === startDay.getMonth());
    let endDayIndex = monthDateArr.findIndex(item => item.date === endDay.getDate() && item.month === endDay.getMonth());
    // console.log(monthDateArr);
    monthDateArr.map((item, index) => {
        if (index >= startDayIndex && index <= endDayIndex) {
            item["indicate"] = true;
            item["time1"] = data[index - startDayIndex].time1 || data[5 + index - endDayIndex].time1;
            item["time2"] = data[index - startDayIndex].time2 || data[5 + index - endDayIndex].time2;
            return item;
        }
        return item;
    })



    // renderCalendar---------------
    monthDateArr = chunk(monthDateArr, 7);
    // console.log(monthDateArr);
    const htmlDate = document.getElementById("htmlDate");
    htmlDate.innerHTML = '';
    for (let i = 0; i < monthDateArr.length; i++) {
        htmlDate.innerHTML += `
      <tr class="weekDay">
        ${monthDateArr[i]
                .map((item, index) => {
                    return `
                <td>
                    <div ${item.date == date.getDate() && item.month == date.getMonth() ? 'id="todayReset" onclick="resetTodaySchedule(true)"' : ''} class="${item.month == date.getMonth() && index == 0 ? `${item.class} sundayDay` : (index == todaysWeekDay && item.class !== '' ? `todayWeekDay ${item.class}` : `${item.class}`)}" >
                    <span>${item.date}
                    ${item.indicate ? `<span class="dayIndicate1 ${item.time1 ? 'complete' + Math.floor(item.time1 / 3) : ''}"></span>
                    <span class="dayIndicate2 ${item.time2 ? 'complete' + Math.floor(item.time2 / 3) : ''}"></span>` : ''}
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
    let checkValidWeek = (date.getDate() > endDay.getDate() && date.getMonth() == endDay.getMonth()) || (date.getDate() < startDay.getDate() && date.getMonth() == startDay.getMonth());
    setTodayProgressHtml(checkValidWeek);
}

const renderHistorySlide = (numb) => {
    const historyTable = document.getElementById('historyTable');
    let historyTableItem = dataHistory.find(item => item.index == numb);
    let historyTableData = historyTableItem.data;
    let checkRowNum = $(".dateProgressDiv span:first-child").text();
    if (numb == dataHistory.length - 1) {
        historyTable.innerHTML = `
        ${historyTableData.map((item, index) => {
            return `
                    <div class="tableItem">
                      <span  ${item.fromD ? `class="term" onclick="commitNewWork(${item.row},${numb})"` : `onclick="commitNewWork(${item.row},${numb})" class="term_not_complete"`}>${item.row} - ${item.row + 199}</span>
                      ${item.fromD ? `<div class="desc">
                        <span>${item.fromD}</span>
                        <span>${item.toD}</span>
                      </div>` : item.row == checkRowNum ? `<div class="desc" id="todayProgressHtml"></div>` : `<div class="desc"></div>`
                }
                    </div>
                `
        }).join('')
            }
        `;
    }
    else historyTable.innerHTML = `
        ${historyTableData.map((item, index) => {
        return `
                <div class="tableItem">
                  <span  ${item.fromD ? `class="term" onclick="commitNewWork(${item.row},${numb})"` : `onclick="commitNewWork(${item.row},${numb})" class="term_not_complete"`}>${item.row} - ${item.row + 199}</span>
                  ${item.fromD ? `<div class="desc">
                    <span>${item.fromD}</span>
                    <span>${item.toD}</span>
                  </div>` : `<div class="desc"></div>`
            }
                </div>
            `
    }).join('')
        }
        `;
}

const setTodayProgressHtml = (valid) => {
    if (valid) {
        $("#todayProgressHtml").html('<img src="./img/cup.png" width="25px">');
    }
    else if (todayData) {
        $("#todayProgressHtml").html(`
        <div class="dateProgressContent" ${todayData.time1 >= 9 ? 'style="color: #fff;"' : ''}>
            <span class="dateProgressImg">
            ${todayData.time1 >= 9 ? '<img src="./img/check.png" width="18">' : ''}
            </span>
            <span onclick="setWordList(${JSON.stringify(todayData).split('"').join("&quot;")},1)">${todayData.startIndex1 + 1} - ${todayData.startIndex1 + 50}</span>
            <span class="dateProgressFraction">${todayData.time1}/9</span>
        </div>
        <div class="dateProgressContent" ${todayData.time2 >= 9 ? 'style="color: #fff;"' : ''}>
            <span class="dateProgressImg">
            ${todayData.time2 >= 9 ? '<img src="./img/check.png" width="18">' : ''}
            </span>
            <span onclick="setWordList(${JSON.stringify(todayData).split('"').join("&quot;")},2)">${todayData.startIndex2 + 1} - ${todayData.startIndex2 + 50}</span>
            <span class="dateProgressFraction">${todayData.time2}/9</span>
        </div>
        `);
    }
}


const showSlides = (n) => {
    if (n > dataHistory.length - 1) {
        slideIndex = dataHistory.length
        setNextMonthTable();
        return;
    }
    if (n < 1) {
        slideIndex = 0;
    }
    renderHistorySlide(slideIndex);
}

$('#historyTableBtnLeft').click(function (e) {
    if (slideIndex == dataHistory.length) {
        $('#calendarContent').html('');
    }
    showSlides(slideIndex += -1);
});

$('#historyTableBtnRight').click(function (e) {
    showSlides(slideIndex += 1);
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
            <img src="./img/complete.png" width="13">
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
            <img src="./img/close.png" width="9">
            </button>
        </div>
        </div>
    </div>`;
};

const handleThis = (e) => {
    $('.calendarInputCheck').not(e).prop('checked', false);
}

const setNewHistoryItem = () => {
    let val = document.querySelector('.calendarInputCheck:checked').value;
    let res = []
    if (val == 'item1') {
        for (let i = 0; i < 5; i++) {
            res.push({
                row: 200 * (i) + 1,
                fromD: '',
                toD: ''
            })
        }
    }
    else {
        for (let i = 0; i < 5; i++) {
            res.push({
                row: 200 * (i) + 1 + 1000,
                fromD: '',
                toD: ''
            })
        }
    }
    let newdata = {
        "index": dataHistory.length,
        "data": res
    }

    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertHistoryItem?col=${CURRENT_COLLECTION.history}`;
    fetch(url, {
        ...mongoFetchOp,
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        $('#calendarContent').html('');
        getAllData(CURRENT_COLLECTION.history).then(data => {
            localStorage.removeItem('historyData');
            localStorage.setItem('historyData', JSON.stringify(data));
            //save to array script
            getRenderLocalHistoryData();
        })
    })
}

const commitNewWork = (row, numb) => {
    const calendarContent = document.getElementById("calendarContent");
    calendarContent.innerHTML = `
    <div class="calendarItem">
    <div class="calendarItemHeader">
        <span></span>
        <div style="display: flex;">
        <button class="close-btn" onclick="commitHistoryItem(${row},${numb})">
            <img src="./img/complete.png" width="13">
        </button>
        <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
            <img src="./img/close.png" width="9">
        </button>
        </div>
    </div>
    <div class="calendarItemContent">
        <input class="calendarItemInput" value="${row} - ${row + 199}" autocomplete="off" id="commitHistoryItemRow"
        onmouseover="this.focus()" onmouseout="this.blur()">
        <input type="date"  data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemFromD" autocomplete="off"
        onmouseover="this.focus()" onmouseout="this.blur()">
        <input type="date"  data-date-format="YYYY MM DD" class="calendarItemInput" id="commitHistoryItemToD" autocomplete="off"
        onmouseover="this.focus()" onmouseout="this.blur()">
    </div>
    </div>`;
}

const commitHistoryItem = (row, numb) => {
    let newdata = {
        fromD: $('#commitHistoryItemFromD').val(),
        toD: $('#commitHistoryItemToD').val()
    };
    let id = dataHistory.find(item => item.index == numb)._id
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdateHistory?id=${id}&row=${row}&col=${CURRENT_COLLECTION.history}`;
    fetch(url, {
        ...mongoFetchOp,
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        $('#calendarContent').html('');
        getAllData(CURRENT_COLLECTION.history).then(data => {
            localStorage.removeItem('historyData');
            localStorage.setItem('historyData', JSON.stringify(data));
            //save to array script
            getRenderLocalHistoryData();
        })
    })
}

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
    const baseUrl = "https://arc.msn.com/v3/Delivery/Placement?" + new URLSearchParams(batchQuery).toString();
    fetch(URL_CORS + baseUrl).then(res => res.json()).then(data => {
        let itemStr = data["batchrsp"]["items"][0].item;
        let itemObj = JSON.parse(itemStr)["ad"];
        let title = itemObj["title_text"]?.tx;
        let text1 = itemObj["hs2_title_text"]?.tx;
        // let text2 = itemObj["hs2_cta_text"]?.tx || '';
        let jsImageP = itemObj["image_fullscreen_001_portrait"];
        let jsImageL = itemObj["image_fullscreen_001_landscape"];

        let contentTextTop = `<div class="topCalendarText">${title}</div>`;
        title ? $('#topCalendarText').html(contentTextTop) : '';
        let contentTextBottom = `<div class="bottomCalendarText">${text1}</div>`;
        text1 ? $('#bottomCalendarText').html(contentTextBottom) : '';
        $('#calendarHeader').css('background-image', `url(${jsImageL.u})`);
    })
}

// fetchAndRenderMonthImg();

//change monthImg every 30m
// setInterval(() => {
//     fetchAndRenderMonthImg();
// }, 360000);

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}


const setTodayWork = () => {
    const calendarContent = document.getElementById("calendarContent");
    calendarContent.innerHTML = `
    <div class="calendarItem">
        <div class="calendarItemHeader">
            <span>Set new week schedule!</span>
            <div style="display: flex;">
            <button class="close-btn" onclick="importSchedule()">
            <img src="./img/complete.png" width="13">
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                <img src="./img/close.png" width="9">
            </button>
            </div>
        </div>
            <div class="calendarItemContent">
                <input class="calendarItemInput" value="${formatDate(new Date())}" id="newStartDay"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
                <input class="calendarItemInput" placeholder="101 ..." id="newStartRow"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            </div>
    </div>`;
};

const importSchedule = (reset = false) => {
    if ($('#newStartRow').val() == '' && !reset) return;
    let startDay = $('#newStartDay').val();
    let startIndex = $('#newStartRow').val() - 1;
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
            time2: 0
        })
    }
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/createSchedule?col=${CURRENT_COLLECTION.schedule}`;
    fetch(url, {
        ...mongoFetchOp,
        method: 'POST',
        body: JSON.stringify(data)
    }).then(res => res.json()).then(data => {
        $('#calendarContent').html('');
        fetchAndRenderCalendarData();
    })
}

//reset word schedule today
const resetTodaySchedule = () => {
    const calendarContent = document.getElementById("calendarContent");
    calendarContent.innerHTML = `
    <div class="calendarItem">
        <div class="calendarItemHeader">
            <span>Reset today schedule!</span>
            <div style="display: flex;">
            <button class="close-btn" onclick="updateScheduleItem()">
            <img src="./img/complete.png" width="13">
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                <img src="./img/close.png" width="9">
            </button>
            </div>
        </div>
        <div class="calendarItemContent">
            <input class="calendarItemInput" placeholder="${todayData.startIndex1 + 1} - ${todayData.startIndex1 + 50}" id="firstRowReset" autocomplete="off" onmouseover="this.focus()">
            <input class="calendarItemInput" placeholder="${todayData.startIndex2 + 1} - ${todayData.startIndex2 + 50}" id="secondRowReset" autocomplete="off" onmouseover="this.focus()">
        </div>
    </div>`;
}

const updateScheduleItem = () => {
    let data = {
        date: todayData.date,
        startIndex1: todayData.startIndex1,
        startIndex2: todayData.startIndex2,
        time1: $('#firstRowReset').val() * 1 || 0,
        time2: $('#secondRowReset').val() * 1 || 0
    }
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleItem?col=${CURRENT_COLLECTION.schedule}&id=${todayData._id}`;
    fetch(url, {
        ...mongoFetchOp,
        method: 'POST',
        body: JSON.stringify(data)
    }).then(res => res.text()).then(data => {
        $('#calendarContent').html('');
        fetchAndRenderCalendarData();
    })
}


let wordList = [];
let autorunTime = 0;
let todayScheduleData;
const setWordList = async (item, num) => {
    // console.log('setWordList');
    if (num == 1) {
        todayScheduleData = {
            _id: item._id,
            startIndex: item.startIndex1,
            time: 'time1',
            startNum: item.time1
        };
    }
    else {
        todayScheduleData = {
            _id: item._id,
            startIndex: item.startIndex2,
            time: 'time2',
            startNum: item.time2
        };
    }
    const wordRow = document.getElementById("wordRow");
    wordList = [];
    autorunTime = 0;
    let index = num == 1 ? item.startIndex1 * 1 : item.startIndex2 * 1;
    await getAllData(CURRENT_COLLECTION.collection).then(data => {
        let newdata = data.sort((a, b) => a._id - b._id);
        localStorage.removeItem('sheetData');
        localStorage.setItem('sheetData', JSON.stringify(newdata));
        //save to array script
        getLocalSheetData();
    })
    wordList = dataSheets.slice(index, index + 50);
    wordRow.value = index;
    wordRow.blur();
    handleToggleSwitchSun();
    handleToggleSwitchMoon();
    $('.city').hide();
    $('#tab1').show();
    $('.footerBtn').removeClass("footerBtnActive");
    $(".tabButton[name='tab1']").addClass("footerBtnActive");
    tabIndex = 1;
    $('.toogleItemRight').removeClass('toogleItemShowRight');
    setTimeout(() => {
        $('.toogleItemRight').addClass('toogleItemShowRight');
    }, 500);
}

const setWordListHandy = async () => {
    // console.log('setWordListHandy');
    const wordRow = document.getElementById("wordRow");
    wordList = [];
    autorunTime = 0;
    let index = wordRow.value * 1;
    await getAllData(CURRENT_COLLECTION.collection).then(data => {
        let newdata = data.sort((a, b) => a._id - b._id);
        localStorage.removeItem('sheetData');
        localStorage.setItem('sheetData', JSON.stringify(newdata));
        //save to array script
        getLocalSheetData();
    })
    wordList = dataSheets.slice(index, index + 50);
    wordRow.blur();
    startHandler();
    handleToggleSwitchSun();
    handleToggleSwitchMoon();
    $('.footerBtn').removeClass("footerBtnActive");
    $(".tabButton[name='tab1']").addClass("footerBtnActive");
    tabIndex = 1;
    $('.toogleItemRight').removeClass('toogleItemShowRight');
    setTimeout(() => {
        $('.toogleItemRight').addClass('toogleItemShowRight');
    }, 500);
}

const handleChangeWordRow = (e) => {
    if (e.keyCode == 13) {
        setWordListHandy();
    }
}

const handleToggleSwitchMoon = () => {
    $("#roundBtnBody").addClass("roundBtnBodyToggle");
    $("#roundBtnDiv1").addClass("roundBtnDiv1Toggle");
    $("#roundBtnDiv2").addClass("roundBtnDiv2Toggle");
    $("#roundBtnDiv3").addClass("roundBtnDiv3Toggle");
};

const handleToggleSwitchSun = () => {
    $("#roundBtnBody").removeClass("roundBtnBodyToggle");
    $("#roundBtnDiv1").removeClass("roundBtnDiv1Toggle");
    $("#roundBtnDiv2").removeClass("roundBtnDiv2Toggle");
    $("#roundBtnDiv3").removeClass("roundBtnDiv3Toggle");
};

let currentTimeout;
let isTimerStarted = false;
const autoPlayBtn = document.getElementById("autoPlayBtn");

autoPlayBtn.addEventListener("click", () => {
    startAutoPlayWord();
});

const startAutoPlayWord = () => {
    if (todayScheduleData?.startNum >= 9) return;
    if (isTimerStarted == false && wordList.length > 0) {
        handleToggleSwitchSun();
        play();
    } else if (isTimerStarted == true && autorunTime > 1) {
        handleToggleSwitchMoon();
        pause();
    }
}

function play() {
    isTimerStarted = true;
    handleNextWord();
    if (autorunTime < 49) {
        currentTimeout = setTimeout(play, 7000);
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
    const url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleProgress?id=${id}&val=${val}&col=${CURRENT_COLLECTION.schedule}`
    fetch(url, mongoFetchOp).then(res => res.json())
}


const handleNextWord = () => {
    let item = wordList[autorunTime];
    if (autorunTime == 0 && $('#wordRow').val() == todayScheduleData?.startIndex) {
        todayScheduleData.startNum++;
        updateScheduleProgress(todayScheduleData._id, todayScheduleData.time);
    }
    let indexx = $('#wordRow').val() * 1 + autorunTime;

    playTTSwithValue(item);
    renderFlashcard(item, todayScheduleData?.startNum, indexx + 1);
    item.numb > 1 ? handleCheckItem(item._id) : handleArchivedItem(item._id, item.text);
    if ((indexx + 1) % 50 == 0) {
        autorunTime = 50;
    }
};


const handleCheckItem = (id) => {
    // console.log('check');
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/handleCheck?id=${id}&col=${CURRENT_COLLECTION.collection}`, mongoFetchOp)
        .then(res => res.json())
        .catch(err => console.log(err))
}

const handleArchivedItem = (id, text) => {
    if (dataSheets.length <= 2000) {
        fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndArchivedOnly?idd=${id}&col=${CURRENT_COLLECTION.collection}&pass=${CURRENT_COLLECTION.pass}`, mongoFetchOp)
            .then(res => res.json()).then(data => {
                console.log(text);
                getTotalDoneWord(CURRENT_COLLECTION.pass);
            })
        dataSheets = dataSheets.filter(obj => obj._id !== id);
        localStorage.setItem('sheetData', JSON.stringify(dataSheets));
    } else {
        let sliceArr = dataSheets.slice(-(dataSheets.length - 2000))
        const minX = sliceArr.reduce((acc, curr) => curr.numb < acc.numb ? curr : acc, sliceArr[0] || undefined);
        fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndArchived?ida=${id}&idd=${minX._id}&col=${CURRENT_COLLECTION.collection}&pass=${CURRENT_COLLECTION.pass}`, mongoFetchOp)
            .then(res => res.json()).then(data => {
                console.log(text);
                getTotalDoneWord(CURRENT_COLLECTION.pass);
            })
        dataSheets = dataSheets.filter(obj => obj._id !== minX._id);
        localStorage.setItem('sheetData', JSON.stringify(dataSheets));
    }
}

const playTTSwithValue = (item) => {
    const audioEl = document.getElementById("tts-audio");
    audioEl.volume = 1;
    if (item.sound?.length > 0) {
        audioEl.pause();
        audioEl.src = item.sound;
        audioEl.play();
        renderExplain(item.text, item.class, item.definitions, "contentBody");
    }
    else {
        textToSpeech(item.text);
    }
};

const playTTSwithValueSound = (src) => {
    const audioEl = document.getElementById("tts-audio");
    audioEl.volume = 1;
    if (src.length > 0) {
        audioEl.pause();
        audioEl.src = src;
        audioEl.play();
    }
}

const textToSpeech = (text) => {
    const audioEl = document.getElementById("tts-audio");
    audioEl.pause();
    audioEl.volume = 1;
    // audioEl.src = `https://proxy.junookyo.workers.dev/?language=en-US&text=${text}&speed=1`
    audioEl.src = `https://myapp-9r5h.onrender.com/hear?lang=en&text=${text}`;
    audioEl.play();
    let transUrl = `https://myapp-9r5h.onrender.com/example?text=${text}&from=en&to=vi`;
    fetch(transUrl)
        .then(res => res.json())
        .then(data => {
            renderExplainGG(text, data.examples)
        })
}

let flipTimer1, flipTimer2, flipTimer3;

const renderFlashcard = (item, progress, row) => {
    const audioEl = document.getElementById("tts-audio");
    clearTimeout(flipTimer1, flipTimer2, flipTimer3);
    let newNumb = item.numb - 1 > 0 ? item.numb - 1 : 0;
    let cardMeaning = item.meaning.replace(/\s\-(.+?)\-/g, `\n【 $1 】\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`);
    cardMeaning = cardMeaning.replace(/\-/g, `\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`).substring(1);
    let meaningTTS = item.meaning.replace(/\s\-(.+?)\-/g, ", ");

    const flashCardContent = document.getElementById("flashCardContent");
    flashCardContent.innerHTML = `
                <div class="item">
                  <div class="item-wrapper">
                    <div class="indicateFlip">
                        <span id="indicateFlip" style="color: ${newNumb > 100 ? '#fff' : '#000'}">
                        ${item.numb}
                        </span>
                    </div>
                    ${row ? `<p class="cardRow"><small>No. </small>${row}</p>` : ''}
                    <div class="img-overlay">
                    <div class="flip-card-front-content">
                    ${progress ? `<span class="progressFlip">
                        ${progress >= 9 ? `<img src="./img/cup.png" width="21">` : `<sup>${progress}</sup>/<sub>9</sub>`}
                        </span>` : ''}
                              <h1>${item.text}</h1>
                              <p class="cardPhonetic">${item.phonetic}</p>                  
                    <p class="cardName">05/07/22</p>
                    </div>
                    </div>
                    <div class="item-back">
                        <div class="flip-card-back-content">
                            <p class="cardMeaning">${cardMeaning}</p>
                        </div>
                    </div>
                  </div>
                </div>
    
    `

    if (item.numb > 0) {
        setTimeout(() => {
            document.getElementById("indicateFlip").innerHTML = `
      ${newNumb == 0 ? '<img src="./img/cup.png" width="42px">' : newNumb}
      `;
        }, 500)
    }

    flipTimer1 = setTimeout(() => {
        audioEl.pause();
        audioEl.volume = 1;
        // audioEl.src = `https://proxy.junookyo.workers.dev/?language=vi-VN&text=${meaningTTS}&speed=1`
        audioEl.src = `https://myapp-9r5h.onrender.com/hear?lang=vi&text=${meaningTTS}`;
        audioEl.play();
    }, 2500);
    flipTimer2 = setTimeout(hoverIn, 3000);
    flipTimer3 = setTimeout(hoverOut, 5000);
};

const hoverIn = (text) => {
    $('.item-wrapper').addClass('item-hover');
};

const hoverOut = () => {
    $('.item-wrapper').removeClass('item-hover');
};

const renderExplain = (text, type, definitions, divId) => {
    let contentBody = document.getElementById(divId);
    contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      <button class="closeBtn closeBtnSVG" onclick="handleDelete()">
      <svg width="15" height="15" viewBox="-0.112 -0.112 0.45 0.45" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-close">
        <path d="M.137.111.203.045A.019.019 0 1 0 .177.018L.111.084.044.018a.019.019 0 1 0-.026.026L.084.11.018.177a.019.019 0 1 0 .027.027L.111.138l.066.066A.019.019 0 1 0 .204.177L.137.111z"/>
      </svg>
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType"><span class="preWord">Definitions of</span><h2>${text}</h2><span class="pos">${type}</span></div>
        ${definitions.map((item, index) => {
        return `<div class="sn-g">
        ${definitions.length > 1 ? `<span class="num">${index + 1}</span>` : ''}
        ${item}
        </div>`
    }).join('')
        }
      </div>
    </div>  
      `;
};


const renderExplainGG = (headword, meaning) => {
    const contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      <button class="closeBtn closeBtnSVG" onclick="handleDelete()">
      <svg width="15" height="15" viewBox="-0.112 -0.112 0.45 0.45" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-close">
        <path d="M.137.111.203.045A.019.019 0 1 0 .177.018L.111.084.044.018a.019.019 0 1 0-.026.026L.084.11.018.177a.019.019 0 1 0 .027.027L.111.138l.066.066A.019.019 0 1 0 .204.177L.137.111z"/>
      </svg>
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType"><span class="preWord">Definitions of</span><h2 class="h">${headword}</h2></div>
        <div class="wordMeaning">
        ${meaning.map((item, index) => {
        return `<span class="x">${item}</span>`
    }).join('')
        }
        </div>
      </div>
    </div>  
      `;
};

const handleDelete = () => {
    document.getElementById("transInput").value = "";
    const element = document.getElementById("addNewW");
    if (element) {
        element.value = "";
    }
    const element1 = document.getElementById("passInput");
    if (element1) {
        element1.value = "";
    }
    document.getElementById("searchInput").value = "";
    document.getElementById("contentBody").innerHTML = "";
};

const handleChangeTransInput = (e) => {
    if (e.keyCode == 13) {
        handleTranslate();
    }
    return;
};

$('#transBtn').click(function (e) {
    handleTranslate();
});

const handleTranslate = async () => {
    const transInput = document.getElementById("transInput");

    if (/\w*/.test(transInput.value)) {
        let transUrl = `https://myapp-9r5h.onrender.com/trans?text=${transInput.value}&from=en&to=vi`;
        fetch(transUrl)
            .then(res => res.json())
            .then(data => {
                renderTranslate(data);
            }).catch(err => {
                console.log(err);
            })
    }
};

const renderTranslate = (arr) => {
    const quoteBody = document.getElementById("quoteBody");
    quoteBody.innerHTML = "";
    renderEditWordDefinition(arr.word, "contentBody");
    if (arr.translation) {
        quoteBody.innerHTML = `
    <div class="transItem">
        <div class="transItemHeader">
          <span></span>
          <div style="display: flex;">
            <button class="close-btn" onclick="handleAddTextEnd()">
              <img src="./img/send.png" width="10">
            </button>
            <button class="close-btn" onclick="handleAddNewText()">
              <img src="./img/chain.png" width="12">
            </button>
            <button class="close-btn" onclick="handleDeleteQuote();">
              <img src="./img/close.png" width="9">
            </button>
          </div>
        </div>
        <div class="my-control" id="newText">
          <input class="transItemInput" id="addNewW" autocomplete="off" onmouseover="this.focus()"
            onmouseout="this.blur()">
        </div>
        <p class="transItemTranslation" onclick="addTextToCell('-${arr.translation}')">${arr.translation}</p>
        <p>Translation of <b id="tlword">${arr.word}</b></p>
        <div class="transItemPhonetic">
          <p><span id="tlTranscript">${arr.wordTranscription}</span></p>
          <button class="sound-btn" id="tranSoundBtn">
            <img src="./img/volume.png" width="15">
          </button>
        </div>
        <div>
        ${Object.keys(arr.translations).map((item) => {
            return `
        <h5 class="transItemType" onclick="addTextToCell(' -${item}')">-${item}</h5>
        ${arr.translations[item].map((m) => {
                return `
            <div class="transItemRow">
            <span onclick="addTextToCell('-${m.translation}')">${m.translation}&emsp; 
                ${m.synonyms.map((n, i) => {
                    return `<small>${(i ? ", " : "") + n}</small>`;
                }).join("")}.</span>         
                ${renderFrequency(m.frequency)}
            </div>`;
            }).join("")}
            `;
        }).join("")
            }
    </div>`;
    }

    $("#tranSoundBtn").click(function (e) {
        playTTSwithValueSound(textData.sound);
    });
};

const renderEditWord = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
            <button class="close-btn" onclick="setEditWord()">
                <img src="./img/complete.png" width="13">
            </button>
            <button class="close-btn" onclick="handleDelete();">
                <img src="./img/close.png" width="9">
            </button>
            </div>
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="find edit text" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()" onkeyup="handleRenderEditWordDefinition(event)">
            <img src="./img/center.png" onclick="handleRenderEditWordDefinitionHandy()" class="editEnterBtn" id="editEnterBtn">
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="" id="inputEditWordPhonetic" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="" id="inputEditWordMeaning" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="" id="inputEditWordNumb" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        </div>
        <div id="editContentDiv"></div>`;
};

const renderDeleteWord = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
                <button class="close-btn" onclick="setDeleteWord()">
                  <img src="./img/bin.png" width="15">
                </button>
                <button class="close-btn" onclick="handleDelete();">
                  <img src="./img/close.png" width="9">
                </button>
            </div>
        </div>
        <div class="transItemContent">
          <input class="transItemInput" placeholder="find delete text" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="transItemContent">
          <input class="transItemInput" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        </div>
        <div id="editContentDiv"></div>`;
};

const renderProxySelect = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <div style="display: flex;">
                <button class="close-btn" onclick="selectProxy()">
                    <img src="./img/complete.png" width="13">
                </button>
                <button class="close-btn" onclick="handleDelete()">
                  <img src="./img/close.png" width="9">
                </button>
            </div>
        </div>
        ${proxyArr.map((item, index) => {
        return `<div class="transItemContent">
                    <label>
                    <input type="checkbox" ${item.active ? 'checked' : ''} onchange="handleThisCheckbox(this)" class="translateInputCheck"  value="${index}">
                        ${item.link}
                    </label>
                </div>`
    }).join('')
        }
        </div>`;
};

const handleThisCheckbox = (e) => {
    $('.translateInputCheck').not(e).prop('checked', false);
}

const selectProxy = () => {
    let val = document.querySelector('.translateInputCheck:checked').value;
    val == proxyArr.length - 1 ? URL_CORS = '' : URL_CORS = proxyArr[val].link;
    proxyArr.forEach((item, index) => index != val ? item.active = false : item.active = true)
    handleDelete();
}


const renderCollectionSelect = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <div style="display: flex;">
                <button class="close-btn" onclick="selectCollection()">
                    <img src="./img/complete.png" width="13">
                </button>
                <button class="close-btn" onclick="handleDelete()">
                  <img src="./img/close.png" width="9">
                </button>
            </div>
        </div>
        ${collectionsArr.map((item, index) => {
        return `<div class="transItemContent">
                    <label>
                    <input type="checkbox" ${item.active ? 'checked' : ''} onchange="handleThisCheckbox(this)" class="translateInputCheck"  value="${index}">
                        ${item.name}
                    </label>
                </div>`
    }).join('')
        }
        </div>`;
};

const selectCollection = () => {
    let val = document.querySelector('.translateInputCheck:checked').value;
    CURRENT_COLLECTION = collectionsArr[val];
    collectionsArr.forEach((item, index) => index != val ? item.active = false : item.active = true)
    handleDelete();
    fetchStartupData();
    getTotalDoneWord(CURRENT_COLLECTION.pass);
    fetchAndRenderCalendarData();
}

let editId;
const handleChangeEditInput = (e) => {
    const editContentDiv = document.getElementById("editContentDiv");
    let arrFilter = dataSheets.filter(item => item.text.search(`^${e.target.value}.*$`) > -1);
    editContentDiv.innerHTML = `
      ${arrFilter.map((item, index) => {
        return `
          <a class="my-item" onclick="setInputEditWordResult(${JSON.stringify(item).split('"').join("&quot;")});">${item.text}</a>
          `
    }).join('')
        }
    `;
}

const setInputEditWordResult = (item) => {
    document.getElementById("editContentDiv").innerHTML = '';
    editId = item._id;
    $('#inputEditWordText').val(item.text);
    $('#inputEditWordPhonetic').val(item.phonetic);
    $('#inputEditWordMeaning').val(item.meaning);
    $('#inputEditWordNumb').val(item.numb);
    renderEditWordDefinition(item.text, "editContentDiv");
}

const handleRenderEditWordDefinition = e => {
    if (e.keyCode == 13) renderEditWordDefinition(e.target.value, "editContentDiv")
}

const handleRenderEditWordDefinitionHandy = () => {
    let val = $('#inputEditWordText').val();
    renderEditWordDefinition(val, "editContentDiv");
}

let textData = { text: '', sound: '', class: '', definitions: [] }

const renderEditWordDefinition = (val, divId) => {
    let urlEngAmerica = URL_CORS + `https://www.oxfordlearnersdictionaries.com/search/american_english/direct/?q=${val}`;
    let newText = val.length > 4 ? val.slice(0, -2) : val;
    const regText = new RegExp(`(${newText}\\w*)`, 'gi');
    textData.text = val;
    textData.definitions = [];
    $.get(urlEngAmerica, function (html) {
        let mp3Link = $(html).find('.audio_play_button').attr('data-src-mp3');
        if (mp3Link) {
            textData.sound = mp3Link;
            let headword = $(html).find('.webtop-g h2').contents()[0].textContent;
            textData.text = headword;
            let classT = $(html).find('.pos').html();
            textData.class = classT;
            let img = $(html).find('img.thumb').attr('src')
            $(html).find('.h-g > .sn-gs .sn-g').each(function (index) {
                let def = '';
                if (img && index == 0) def += `<img class="thumb" src="${img}">`
                def += $(this).find('> .def').html() ? '<span class="def">' + $(this).find('> .def').text() + '</span>' : '';
                let xr = $(this).find('.xr-gs').text();
                if (xr) {
                    $(this).find('.xr-gs').each(function () {
                        def += '<span class="xr-gs">' + $(this).find('.prefix').text() + " " + '<small>' + $(this).find('.prefix').next().text() + '</small>' + '</span>';
                    })
                }
                $(this).find('>.x-gs .x').each(function () {
                    $(this).html($(this).text().replace(regText, `<b style="color:#f90000">$1</b>`));
                    def += '<span class="x">' + $(this).html() + '</span>';
                });
                textData.definitions.push(def);
            })
        }
        renderExplain(textData.text, textData.class, textData.definitions, divId);
    });
};

const setEditWord = () => {
    let newdata = {
        text: $('#inputEditWordText').val(),
        phonetic: $('#inputEditWordPhonetic').val(),
        meaning: $('#inputEditWordMeaning').val(),
        numb: $('#inputEditWordNumb').val() * 1,
        sound: textData.sound,
        class: textData.class,
        definitions: textData.definitions
    }

    let objIndex = dataSheets.findIndex((obj => obj._id == editId));
    dataSheets[objIndex].text = newdata.text;
    dataSheets[objIndex].phonetic = newdata.phonetic;
    dataSheets[objIndex].meaning = newdata.meaning;
    dataSheets[objIndex].numb = newdata.numb;
    dataSheets[objIndex].sound = newdata.sound;
    dataSheets[objIndex].class = newdata.class;
    dataSheets[objIndex].definitions = newdata.definitions;
    localStorage.setItem('sheetData', JSON.stringify(dataSheets));

    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdate?id=${editId}&col=${CURRENT_COLLECTION.collection}`;
    fetch(url, {
        ...mongoFetchOp,
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        getAllData(CURRENT_COLLECTION.collection).then(data => {
            $('#inputEditWordText').val('');
            $('#inputEditWordPhonetic').val('');
            $('#inputEditWordMeaning').val('');
            $('#inputEditWordNumb').val('');
            $('#editContentDiv').html('');
            let newdata = data.sort((a, b) => a._id - b._id);
            localStorage.removeItem('sheetData');
            localStorage.setItem('sheetData', JSON.stringify(newdata));
            //save to array script
            getLocalSheetData();
        });
    });
}

const setDeleteWord = () => {
    // console.log('delete');
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/delete?id=${editId}&col=${CURRENT_COLLECTION.collection}`, mongoFetchOp)
        .then(res => res.json())
        .then(data => {
            $('#inputEditWord').val('');
            $('#inputEditWordText').val('');
            $('#editContentDiv').html('');

            dataSheets = dataSheets.filter(obj => obj._id !== editId);
            localStorage.setItem('sheetData', JSON.stringify(dataSheets));
        })
}



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
    addNewW.style.height = "25px";
    newText.style.opacity = "1";
    newText.style.height = "auto";
};

const handleAddTextEnd = () => {
    let data = {};
    if (addNewW.value.length > 0) {
        data.text = textData.text;
        data.phonetic = $('#tlTranscript').text();
        data.meaning = $('#addNewW').val();
        data.numb = 210;
        data.sound = textData.sound;
        data.definitions = textData.definitions;
        data.class = textData.class;
        let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertText?col=${CURRENT_COLLECTION.collection}`;
        fetch(url, {
            ...mongoFetchOp,
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => res.json()).then(data => {
            $('#addNewW').val('');
            $('#contentBody').html('');

            getAllData(CURRENT_COLLECTION.collection).then(data => {
                let newdata = data.sort((a, b) => a._id - b._id);
                localStorage.removeItem('sheetData');
                localStorage.setItem('sheetData', JSON.stringify(newdata));
                //save to array script
                getLocalSheetData();
            });
        })
    }
};


