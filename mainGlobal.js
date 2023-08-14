function checkShortcuts(event) {
    if (event.keyCode == 27) {
        handleDelete();
        const text_input = document.getElementById("searchInput");
        text_input.focus();
        return false;
    }
}
document.onkeydown = checkShortcuts;

const chunk = (array, size) =>
    array.reduce((acc, _, i) => {
        if (i % size === 0) acc.push(array.slice(i, i + size))
        return acc
    }, []);

let dataSheets = [];
let dataHistory = [];
let slideIndex = 1;

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

const fetchStartupData = () => {
    // console.log('fetch all data');
    getAllData('hoctuvung').then(data => {
        localStorage.removeItem('sheetData');
        localStorage.setItem('sheetData', JSON.stringify(data));
        //save to array script
        getLocalSheetData();
    })

    getAllData('history').then(data => {
        localStorage.removeItem('historyData');
        localStorage.setItem('historyData', JSON.stringify(data));
        //save to array script
        getRenderLocalHistoryData();
    })
}

fetchStartupData();

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
                b.innerHTML = item.text;
                b.addEventListener("click", function (e) {
                    inp.value = '';
                    playTTSwithValue(item.text);
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


const getTotalDoneWord = (text) => {
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/countCollection?collection=${text}`)
        .then(res => res.json()).then(data => {
            $('#wordNum').html(data);
        })
}

getTotalDoneWord('passed');

let dataCalendar = [];

const fetchAndRenderCalendarData = () => {
    getAllData('schedule').then(data => {
        data = data.sort((a, b) => new Date(a.date) - new Date(b.date))
        renderCalendar(data);
    })
};

fetchAndRenderCalendarData();

let todayData;

const renderCalendar = (data) => {
    let date = new Date();
    const todaysDay = date.getDate();
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
    document.getElementById("calendarDate").innerHTML = todaysDay;
    document.getElementById("calendarDay").innerHTML = weekDays[todaysWeekDay];
    document.getElementById("calendarMonth").innerHTML = monthDays[todaysMonth] + " " + todaysYear;
    $('.dateProgressDiv').html(`${data[0].startIndex1 + 1} <span>&#8226;</span> ${data[1].startIndex2 + 50}`);

    // monthImg(todaysMonth + 1);

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

    monthDateArr.map((item) => {
        item.month == date.getMonth() ? item["class"] = "normalDay" : item["class"] = '';

        if (item.date === date.getDate() && item.month === date.getMonth()) {
            item["class"] += " todayDay";
        }

        if (item.date === startDay.getDate() && item.month === startDay.getMonth()) {
            item["class"] += " startDay";
        }

        if (item.date >= startDay.getDate() && item.month === startDay.getMonth() && item.date <= endDay.getDate()) {
            item["indicate"] = true;
            item["time1"] = data[item.date - startDay.getDate()].time1
            item["time2"] = data[item.date - startDay.getDate()].time2
        }

        if (item.date === endDay.getDate() && item.month === endDay.getMonth()) {
            item["class"] += " endDay";
        }

        return item;
    });

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
                    <span ${item.date == date.getDate() && item.month == date.getMonth() ? 'id="todayReset" onclick="resetTodaySchedule(true)"' : ''} class="${item.month == date.getMonth() && index == 0 ? `${item.class} sundayDay` : `${item.class}`}" >${item.date}
                    ${item.indicate ? `<span class="dayIndicate1 ${item.time1 ? 'complete' + Math.floor(item.time1 / 3) : ''}"></span>
                    <span class="dayIndicate2 ${item.time1 ? 'complete' + Math.floor(item.time1 / 3) : ''}"></span>` : ''}
                    </span>
                </td>
            `;
                })
                .join("")}
      </tr>
      `;
    }

    // renderCalendarProgress---------------

    let diffDay = (date.getTime() - endDay.getTime()) / 86400000;
    if (Math.floor(diffDay) > 0) {
        document.getElementById('dateProgress').innerHTML = '<img src="./img/cup.png" width="25px">';
    } else document.getElementById('dateProgress').innerHTML = `
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
            `;
}

const renderHistorySlide = (numb) => {
    const historyTable = document.getElementById('historyTable');
    let historyTableItem = dataHistory.find(item => item.index == numb);
    let historyTableData = historyTableItem.data;
    historyTable.innerHTML = `
        ${historyTableData.map((item, index) => {
        return `
                <div class="tableItem">
                  <span  ${item.fromD ? `class="term" onclick="commitNewWork(${item.row},${numb})"` : `onclick="commitNewWork(${item.row},${numb})" class="term_not_complete"`}>${item.row} - ${item.row + 199}</span>
                  ${item.fromD ? `<span class="desc">
                    <span style="width: 90px;">${item.fromD}</span>
                    <span>${item.toD}</span>
                  </span>` : '<span class="desc"></span>'}
                </div>
            `
    }).join('')
        }
        `;
}

const showSlides = (n) => {
    if (n > dataHistory.length - 1) {
        slideIndex = dataHistory.length - 1
        setNextMonthTable();
        return;
    }
    if (n < 1) {
        slideIndex = 0;
    }
    renderHistorySlide(slideIndex)
}

$('#historyTableBtnLeft').click(function (e) {
    if (slideIndex == dataHistory.length - 1) {
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

    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertHistoryItem';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        $('#calendarContent').html('');

        getAllData('history').then(data => {
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
        <input class="calendarItemInput" value="${row} - ${row + 49}" autocomplete="off" id="commitHistoryItemRow"
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
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdateHistory?id=${id}&row=${row}`;
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        $('#calendarContent').html('');
        getAllData('history').then(data => {
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
    fetch(urlCors + baseUrl).then(res => res.json()).then(data => {
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
        $('.calendarCardImg').css('background-image', `url(${jsImageP.u})`);
        $('#contentImg').attr('src', jsImageL.u);
    })
}

fetchAndRenderMonthImg();

//change monthImg every 30m
setInterval(() => {
    fetchAndRenderMonthImg();
}, 360000);

const monthImg = (monthImg) => {
    switch (monthImg) {
        case 1:
            $('#calendarHeader').css('background-image', 'url("./img/1.jpg")');
            break;
        case 2:
            $('#calendarHeader').css('background-image', 'url("./img/2.jpg")');
            break;
        case 3:
            $('#calendarHeader').css('background-image', 'url("./img/3.jpg")');
            break;
        case 4:
            $('#calendarHeader').css('background-image', 'url("./img/4.jpg")');
            break;
        case 5:
            $('#calendarHeader').css('background-image', 'url("./img/5.jpg")');
            break;
        case 6:
            $('#calendarHeader').css('background-image', 'url("./img/6.jpg")');
            break;
        case 7:
            $('#calendarHeader').css('background-image', 'url("./img/7.jpg")');
            break;
        case 8:
            $('#calendarHeader').css('background-image', 'url("./img/8.jpg")');
            break;
        case 9:
            $('#calendarHeader').css('background-image', 'url("./img/9.jpg")');
            break;
        case 10:
            $('#calendarHeader').css('background-image', 'url("./img/10.jpg")');
            break;
        case 11:
            $('#calendarHeader').css('background-image', 'url("./img/11.jpg")');
            break;
        case 12:
            $('#calendarHeader').css('background-image', 'url("./img/12.jpg")');
            break;
    }
};


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
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/createSchedule'
    fetch(url, {
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
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleItem?id=${todayData._id}`;
    fetch(url, {
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
    let index = num == 1 ? item.startIndex1 : item.startIndex2;
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getRangeList?start=${index}&total=50`
    await fetch(url).then(res => res.json()).then(data => wordList = data);
    wordRow.value = index;
    wordRow.blur();
    handleToggleSwitchSun();
    handleToggleSwitchMoon();
    $('#tab1').show();
    $('#tab2').hide();
    $('.toogleItemLeft').removeClass('toogleItemShowLeft');
    $('.footerBtn').removeClass("footerBtnActive");
    setTimeout(() => {
        $('.toogleItemLeft').addClass('toogleItemShowLeft');
        $('.footerBtnToggleLeft').addClass("footerBtnActive");
    }, 500);
}



const setWordListHandy = async () => {
    // console.log('setWordListHandy');
    const wordRow = document.getElementById("wordRow");
    wordList = [];
    autorunTime = 0;
    let index = wordRow.value;
    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/getRangeList?start=${index}&total=50`
    await fetch(url).then(res => res.json()).then(data => wordList = data);
    wordRow.blur();
    $('.toogleItemLeft').toggleClass('toogleItemShowLeft');
    handleToggleSwitchSun();
    handleToggleSwitchMoon();
    startHandler();
    $('.toogleItemRight').removeClass('toogleItemShowRight');
    $('.toogleItemRight').addClass('toogleItemShowRight');
}

const handleToggleSwitchMoon = () => {
    document
        .getElementById("roundBtnBody")
        .classList.add("roundBtnBodyToggle");
    document
        .getElementById("roundBtnDiv1")
        .classList.add("roundBtnDiv1Toggle");
    document
        .getElementById("roundBtnDiv2")
        .classList.add("roundBtnDiv2Toggle");
    document
        .getElementById("roundBtnDiv3")
        .classList.add("roundBtnDiv3Toggle");
};

const handleToggleSwitchSun = () => {
    document
        .getElementById("roundBtnBody")
        .classList.remove("roundBtnBodyToggle");
    document
        .getElementById("roundBtnDiv1")
        .classList.remove("roundBtnDiv1Toggle");
    document
        .getElementById("roundBtnDiv2")
        .classList.remove("roundBtnDiv2Toggle");
    document
        .getElementById("roundBtnDiv3")
        .classList.remove("roundBtnDiv3Toggle");
};

let currentTimeout;
let isTimerStarted = false;
const autoPlayBtn = document.getElementById("autoPlayBtn");

autoPlayBtn.addEventListener("click", () => {
    if (isTimerStarted == false && wordList.length > 0) {
        handleToggleSwitchSun();
        play();
        $('#tab1').show();
        $('#tab2').hide();
        $('.footerBtn').removeClass("footerBtnActive");
        $('.footerBtnToggleLeft').addClass("footerBtnActive");
    } else if (isTimerStarted == true && autorunTime > 1) {
        handleToggleSwitchMoon();
        pause();
    }
});

function play() {
    isTimerStarted = true;
    handleNextWord();
    if (autorunTime < 49) {
        currentTimeout = setTimeout(play, 8000);
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
        getAllData('hoctuvung').then(data => {
            localStorage.removeItem('sheetData');
            localStorage.setItem('sheetData', JSON.stringify(data));
            //save to array script
            getLocalSheetData();
        });
    }, 2000);
}


const updateScheduleProgress = (id, val) => {
    // console.log('updateScheduleProgress');
    const url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/updateScheduleProgress?id=${id}&val=${val}`
    fetch(url).then(res => res.json())
}


const handleNextWord = () => {
    let item = wordList[autorunTime];
    if (autorunTime == 0 && $('#wordRow').val() == todayScheduleData?.startIndex) {
        todayScheduleData.startNum++;
        updateScheduleProgress(todayScheduleData._id, todayScheduleData.time);
    }
    let indexx = dataSheets.findIndex(n => n._id == item._id);
    playTTSwithValue(item.text);
    renderFlashcard(item, todayScheduleData?.startNum, indexx + 1);
    item.numb > 1 ? handleCheckItem(item._id) : handleArchivedItem(item._id, item.text);
    if ((indexx + 1) % 50 == 0) {
        autorunTime = 50;
    }
};


const handleCheckItem = (id) => {
    // console.log('check');
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/handleCheck?id=${id}`)
        .then(res => res.json())
        .catch(err => console.log(err))
}

const handleArchivedItem = (id, text) => {
    let sliceArr = dataSheets.slice(-(dataSheets.length - 2000))
    const minX = sliceArr.reduce((acc, curr) => curr.numb < acc.numb ? curr : acc, sliceArr[0] || undefined);
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndArchived?ida=${id}&idd=${minX._id}`)
        .then(res => res.json()).then(data => {
            console.log(text);
            getTotalDoneWord('passed');
        })
    dataSheets = dataSheets.filter(obj => obj._id !== minX._id);
    localStorage.setItem('sheetData', JSON.stringify(dataSheets));
}



const playTTSwithValue = (val, render = true) => {
    let urlEngAmerica = urlCors + `https://www.oxfordlearnersdictionaries.com/search/american_english/direct/?q=${val}`;
    let newText = val.length > 4 ? val.slice(0, -2) : val;
    const regId = new RegExp('<div id="ring-links-box">((.|\n)+?)</div>', 'gi');
    const regText = new RegExp(`(${newText}\\w*)`, 'gi');

    $.get(urlEngAmerica, function (html) {
        let mp3Link = $(html).find('.audio_play_button').attr('data-src-mp3');
        if (mp3Link) {
            $('#tts-audio').attr('src', mp3Link);
            const audioEl = document.getElementById("tts-audio");
            audioEl.volume = 1;
            audioEl.play();
            if (render) {
                let headword = $(html).find('.webtop-g').html();
                // let meaning = $(html).find('#entryContent').html();

                let meaning = $(html).find('.sn-gs').each(function () {
                    $(this).html($(this).html().replace(regId, ''));
                    $('span.x', this).each(function () {
                        $(this).html($(this).text().replace(regText, `<b style="color:#f90000">$1</b>`));
                    });
                }).html()
                renderExplain(headword, meaning);
            }
        }
        else {
            textToSpeech(val, render);
        }
    });
    // textToSpeech(val, render);

};

const textToSpeech = (text, render) => {
    const voices = window.speechSynthesis.getVoices();
    let utterance = new SpeechSynthesisUtterance();
    utterance.lang = "en";
    utterance.voice = voices[4];
    utterance.rate = 0.9;
    utterance.text = text;
    window.speechSynthesis.speak(utterance);
    if (render) {
        const fetchOptions = {
            returnRawResponse: false,
            detailedTranslations: false,
            definitionSynonyms: false,
            detailedTranslationsSynonyms: false,
            definitions: false,
            definitionExamples: false,
            examples: true,
            removeStyles: false
        }
        let obj = { text: text, fromL: 'en', toL: 'vi', option: fetchOptions };
        fetch(ggsUrl + '?action=getTranslateInfo', { method: 'POST', body: JSON.stringify(obj) })
            .then(res => res.json())
            .then(data => {
                renderExplainGG(text, data.examples)
            })
    }
}

let flipTimer1;
let flipTimer2;

const renderFlashcard = (item, progress, row) => {
    clearTimeout(flipTimer1);
    clearTimeout(flipTimer2);

    let newNumb = item.numb - 1 > 0 ? item.numb - 1 : 0;
    let cardMeaning = item.meaning.replace(/\s\-(.+?)\-/g, `\n【 $1 】\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`);
    cardMeaning = cardMeaning.replace(/\-/g, `\n&nbsp;<img src='./img/clover.png' width="15">&nbsp;`).substring(1);
    const flashCardContent = document.getElementById("flashCardContent");
    flashCardContent.innerHTML = `
      <div class="flip-card">
      <div class="flip-card-inner" id="flipCardInner">
        <div class="flip-card-front">
        <div class="flip-card-front-content">
          ${progress ? `<span class="progressFlip">${progress}/9</span>` : ''}
                    <h1>${item.text}</h1>
                    <p class="cardPhonetic">| ${item.phonetic} |</p>
                    <span class="indicateFlip" id="indicateFlip" style="color: ${mangMau1[newNumb].color}">
                        ${item.numb}
                    </span>
        
          ${row ? `<p class="cardRow"><small>No.</small>${row}</p>` : ''}
          <p class="cardName">05/07/22</p>
          </div>
        </div>
        <div class="flip-card-back">
          <div class="flip-card-back-content">
            <p class="cardMeaning">${cardMeaning}</p>
            ${row ? `<p class="cardRow"><small>No.</small>${row}</p>` : ''}
            <p class="cardName">05/07/22</p>
          </div>
        </div>
      </div>
    </div>
    `;

    if (item.numb > 0) {
        setTimeout(() => {
            document.getElementById("indicateFlip").innerHTML = `
      ${newNumb == 0 ? '<img src="./img/cup.png" width="25px">' : newNumb}
      `;
        }, 1000)
    }

    flipTimer1 = setTimeout(flipFlashCard, 4000);
    flipTimer2 = setTimeout(flipFlashCard, 7000);
};

const flipFlashCard = () => {
    const flipCardInner = document.getElementById('flipCardInner');
    flipCardInner.classList.toggle("flipMyCard");
};

const renderExplain = (headword, meaning) => {
    const contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      <button class="closeBtn" onclick="handleDelete()">
         <img src="./img/close_circle.png" width="15" height="15">
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType"><span class="preWord">Definitions of</span>${headword}</div>
        ${meaning ? `<div class="wordMeaning">${meaning}</div>` : ""}
      </div>
    </div>  
      `;

    // let newText = text.length > 4 ? text.slice(0, -2) : text;
    // const re = new RegExp(`(${newText}\\w*)`, 'gi');
    // $("span.x").each(function () {
    //     $(this).html($(this).text().replace(re, `<b style="color:#f90000">$1</b>`));
    // });
};

const renderExplainGG = (headword, meaning) => {
    const contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      <button class="closeBtn" onclick="handleDelete()">
         <img src="./img/close_circle.png" width="15" height="15">
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType"><span class="preWord">Definitions of</span><h2 class="h">${headword}</h2></div>
        <div class="wordMeaning">
        ${meaning.map(item => {
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
        let obj = { text: transInput.value, fromL: 'en', toL: 'vi' };
        fetch(ggsUrl + '?action=getTranslateInfo', { method: 'POST', body: JSON.stringify(obj) })
            .then(res => res.json())
            .then(data => {
                renderTranslate(data);
            }).catch(err => {
                console.log(err);
            })
    }
};

const renderTranslate = (arr) => {
    let quoteBody = document.getElementById("quoteBody");
    quoteBody.innerHTML = "";
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
          <p>| <span id="tlTranscript">${arr.wordTranscription}</span> |</p>
          <button class="sound-btn" onclick="playTTSwithValue('${arr.word}',false)">
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
            <input class="transItemInput" placeholder="" id="inputEditWordText" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
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
            <span>Select cors proxy server</span>
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
    val == proxyArr.length - 1 ? urlCors = '' : urlCors = proxyArr[val].link;
    proxyArr.forEach((item, index) => index != val ? item.active = false : item.active = true)
    handleDelete();
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
}

const setEditWord = () => {
    let newdata = {
        text: $('#inputEditWordText').val(),
        phonetic: $('#inputEditWordPhonetic').val(),
        meaning: $('#inputEditWordMeaning').val(),
        numb: $('#inputEditWordNumb').val() * 1
    }
    let objIndex = dataSheets.findIndex((obj => obj._id == editId));
    dataSheets[objIndex].text = newdata.text;
    dataSheets[objIndex].phonetic = newdata.phonetic;
    dataSheets[objIndex].meaning = newdata.meaning;
    dataSheets[objIndex].numb = newdata.numb;
    localStorage.setItem('sheetData', JSON.stringify(dataSheets));

    let url = `https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/searchAndUpdate?id=${editId}`;
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => {
        getAllData('hoctuvung').then(data => {
            $('#inputEditWordText').val('');
            $('#inputEditWordPhonetic').val('');
            $('#inputEditWordMeaning').val('');
            $('#inputEditWordNumb').val('');
            localStorage.removeItem('sheetData');
            localStorage.setItem('sheetData', JSON.stringify(data));
            //save to array script
            getLocalSheetData();
        });
    });
}

const setDeleteWord = () => {
    // console.log('delete');
    fetch(`https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/delete?id=${editId}`)
        .then(res => res.json())
        .then(data => {
            $('#inputEditWord').val('');
            $('#inputEditWordText').val('');
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
            break;
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
            break;
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
        data.text = $('#tlword').text();
        data.phonetic = $('#tlTranscript').text();
        data.meaning = $('#addNewW').val();
        data.numb = 210;
        let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/insertText';
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => res.json()).then(data => {
            $('#addNewW').val('');
            getAllData('hoctuvung').then(data => {
                localStorage.removeItem('sheetData');
                localStorage.setItem('sheetData', JSON.stringify(data));
                //save to array script
                getLocalSheetData();
            });
        })
    }
};

const mangMau1 = [{
    val: 0,
    color: '#000000'
},
{
    val: 1,
    color: '#010000'
},
{
    val: 2,
    color: '#020000'
},
{
    val: 3,
    color: '#030000'
},
{
    val: 4,
    color: '#040000'
},
{
    val: 5,
    color: '#050000'
},
{
    val: 6,
    color: '#070000'
},
{
    val: 7,
    color: '#080000'
},
{
    val: 8,
    color: '#090000'
},
{
    val: 9,
    color: '#0a0000'
},
{
    val: 10,
    color: '#0b0000'
},
{
    val: 11,
    color: '#0d0000'
},
{
    val: 12,
    color: '#0e0000'
},
{
    val: 13,
    color: '#0f0000'
},
{
    val: 14,
    color: '#100000'
},
{
    val: 15,
    color: '#110000'
},
{
    val: 16,
    color: '#120000'
},
{
    val: 17,
    color: '#140000'
},
{
    val: 18,
    color: '#150000'
},
{
    val: 19,
    color: '#160000'
},
{
    val: 20,
    color: '#170000'
},
{
    val: 21,
    color: '#180000'
},
{
    val: 22,
    color: '#1a0000'
},
{
    val: 23,
    color: '#1b0000'
},
{
    val: 24,
    color: '#1c0000'
},
{
    val: 25,
    color: '#1d0000'
},
{
    val: 26,
    color: '#1e0000'
},
{
    val: 27,
    color: '#200000'
},
{
    val: 28,
    color: '#210000'
},
{
    val: 29,
    color: '#220000'
},
{
    val: 30,
    color: '#230000'
},
{
    val: 31,
    color: '#240000'
},
{
    val: 32,
    color: '#250000'
},
{
    val: 33,
    color: '#270000'
},
{
    val: 34,
    color: '#280000'
},
{
    val: 35,
    color: '#290000'
},
{
    val: 36,
    color: '#2a0000'
},
{
    val: 37,
    color: '#2b0000'
},
{
    val: 38,
    color: '#2d0000'
},
{
    val: 39,
    color: '#2e0000'
},
{
    val: 40,
    color: '#2f0000'
},
{
    val: 41,
    color: '#300000'
},
{
    val: 42,
    color: '#310000'
},
{
    val: 43,
    color: '#320000'
},
{
    val: 44,
    color: '#340000'
},
{
    val: 45,
    color: '#350000'
},
{
    val: 46,
    color: '#360000'
},
{
    val: 47,
    color: '#370000'
},
{
    val: 48,
    color: '#380000'
},
{
    val: 49,
    color: '#3a0000'
},
{
    val: 50,
    color: '#3b0000'
},
{
    val: 51,
    color: '#3c0000'
},
{
    val: 52,
    color: '#3d0000'
},
{
    val: 53,
    color: '#3e0000'
},
{
    val: 54,
    color: '#400000'
},
{
    val: 55,
    color: '#410000'
},
{
    val: 56,
    color: '#420000'
},
{
    val: 57,
    color: '#430000'
},
{
    val: 58,
    color: '#440000'
},
{
    val: 59,
    color: '#450000'
},
{
    val: 60,
    color: '#470000'
},
{
    val: 61,
    color: '#480000'
},
{
    val: 62,
    color: '#490000'
},
{
    val: 63,
    color: '#4a0000'
},
{
    val: 64,
    color: '#4b0000'
},
{
    val: 65,
    color: '#4d0000'
},
{
    val: 66,
    color: '#4e0000'
},
{
    val: 67,
    color: '#4f0000'
},
{
    val: 68,
    color: '#500000'
},
{
    val: 69,
    color: '#510000'
},
{
    val: 70,
    color: '#530000'
},
{
    val: 71,
    color: '#540000'
},
{
    val: 72,
    color: '#550000'
},
{
    val: 73,
    color: '#560000'
},
{
    val: 74,
    color: '#570000'
},
{
    val: 75,
    color: '#580000'
},
{
    val: 76,
    color: '#5a0000'
},
{
    val: 77,
    color: '#5b0000'
},
{
    val: 78,
    color: '#5c0000'
},
{
    val: 79,
    color: '#5d0000'
},
{
    val: 80,
    color: '#5e0000'
},
{
    val: 81,
    color: '#600000'
},
{
    val: 82,
    color: '#610000'
},
{
    val: 83,
    color: '#620000'
},
{
    val: 84,
    color: '#630000'
},
{
    val: 85,
    color: '#640000'
},
{
    val: 86,
    color: '#650000'
},
{
    val: 87,
    color: '#670000'
},
{
    val: 88,
    color: '#680000'
},
{
    val: 89,
    color: '#690000'
},
{
    val: 90,
    color: '#6a0000'
},
{
    val: 91,
    color: '#6b0000'
},
{
    val: 92,
    color: '#6d0000'
},
{
    val: 93,
    color: '#6e0000'
},
{
    val: 94,
    color: '#6f0000'
},
{
    val: 95,
    color: '#700000'
},
{
    val: 96,
    color: '#710000'
},
{
    val: 97,
    color: '#730000'
},
{
    val: 98,
    color: '#740000'
},
{
    val: 99,
    color: '#750000'
},
{
    val: 100,
    color: '#760000'
},
{
    val: 101,
    color: '#770000'
},
{
    val: 102,
    color: '#780000'
},
{
    val: 103,
    color: '#7a0000'
},
{
    val: 104,
    color: '#7b0000'
},
{
    val: 105,
    color: '#7c0000'
},
{
    val: 106,
    color: '#7d0000'
},
{
    val: 107,
    color: '#7e0000'
},
{
    val: 108,
    color: '#800000'
},
{
    val: 109,
    color: '#810000'
},
{
    val: 110,
    color: '#820000'
},
{
    val: 111,
    color: '#830000'
},
{
    val: 112,
    color: '#840000'
},
{
    val: 113,
    color: '#850000'
},
{
    val: 114,
    color: '#870000'
},
{
    val: 115,
    color: '#880000'
},
{
    val: 116,
    color: '#890000'
},
{
    val: 117,
    color: '#8a0000'
},
{
    val: 118,
    color: '#8b0000'
},
{
    val: 119,
    color: '#8d0000'
},
{
    val: 120,
    color: '#8e0000'
},
{
    val: 121,
    color: '#8f0000'
},
{
    val: 122,
    color: '#900000'
},
{
    val: 123,
    color: '#910000'
},
{
    val: 124,
    color: '#930000'
},
{
    val: 125,
    color: '#940000'
},
{
    val: 126,
    color: '#950000'
},
{
    val: 127,
    color: '#960000'
},
{
    val: 128,
    color: '#970000'
},
{
    val: 129,
    color: '#980000'
},
{
    val: 130,
    color: '#9a0000'
},
{
    val: 131,
    color: '#9b0000'
},
{
    val: 132,
    color: '#9c0000'
},
{
    val: 133,
    color: '#9d0000'
},
{
    val: 134,
    color: '#9e0000'
},
{
    val: 135,
    color: '#a00000'
},
{
    val: 136,
    color: '#a10000'
},
{
    val: 137,
    color: '#a20000'
},
{
    val: 138,
    color: '#a30000'
},
{
    val: 139,
    color: '#a40000'
},
{
    val: 140,
    color: '#a60000'
},
{
    val: 141,
    color: '#a70000'
},
{
    val: 142,
    color: '#a80000'
},
{
    val: 143,
    color: '#a90000'
},
{
    val: 144,
    color: '#aa0000'
},
{
    val: 145,
    color: '#ab0000'
},
{
    val: 146,
    color: '#ad0000'
},
{
    val: 147,
    color: '#ae0000'
},
{
    val: 148,
    color: '#af0000'
},
{
    val: 149,
    color: '#b00000'
},
{
    val: 150,
    color: '#b10000'
},
{
    val: 151,
    color: '#b30000'
},
{
    val: 152,
    color: '#b40000'
},
{
    val: 153,
    color: '#b50000'
},
{
    val: 154,
    color: '#b60000'
},
{
    val: 155,
    color: '#b70000'
},
{
    val: 156,
    color: '#b80000'
},
{
    val: 157,
    color: '#ba0000'
},
{
    val: 158,
    color: '#bb0000'
},
{
    val: 159,
    color: '#bc0000'
},
{
    val: 160,
    color: '#bd0000'
},
{
    val: 161,
    color: '#be0000'
},
{
    val: 162,
    color: '#c00000'
},
{
    val: 163,
    color: '#c10000'
},
{
    val: 164,
    color: '#c20000'
},
{
    val: 165,
    color: '#c30000'
},
{
    val: 166,
    color: '#c40000'
},
{
    val: 167,
    color: '#c60000'
},
{
    val: 168,
    color: '#c70000'
},
{
    val: 169,
    color: '#c80000'
},
{
    val: 170,
    color: '#c90000'
},
{
    val: 171,
    color: '#ca0000'
},
{
    val: 172,
    color: '#cb0000'
},
{
    val: 173,
    color: '#cd0000'
},
{
    val: 174,
    color: '#ce0000'
},
{
    val: 175,
    color: '#cf0000'
},
{
    val: 176,
    color: '#d00000'
},
{
    val: 177,
    color: '#d10000'
},
{
    val: 178,
    color: '#d30000'
},
{
    val: 179,
    color: '#d40000'
},
{
    val: 180,
    color: '#d50000'
},
{
    val: 181,
    color: '#d60000'
},
{
    val: 182,
    color: '#d70000'
},
{
    val: 183,
    color: '#d80000'
},
{
    val: 184,
    color: '#da0000'
},
{
    val: 185,
    color: '#db0000'
},
{
    val: 186,
    color: '#dc0000'
},
{
    val: 187,
    color: '#dd0000'
},
{
    val: 188,
    color: '#de0000'
},
{
    val: 189,
    color: '#e00000'
},
{
    val: 190,
    color: '#e10000'
},
{
    val: 191,
    color: '#e20000'
},
{
    val: 192,
    color: '#e30000'
},
{
    val: 193,
    color: '#e40000'
},
{
    val: 194,
    color: '#e60000'
},
{
    val: 195,
    color: '#e70000'
},
{
    val: 196,
    color: '#e80000'
},
{
    val: 197,
    color: '#e90000'
},
{
    val: 198,
    color: '#ea0000'
},
{
    val: 199,
    color: '#eb0000'
},
{
    val: 200,
    color: '#ed0000'
},
{
    val: 201,
    color: '#ee0000'
},
{
    val: 202,
    color: '#ef0000'
},
{
    val: 203,
    color: '#f00000'
},
{
    val: 204,
    color: '#f10000'
},
{
    val: 205,
    color: '#f30000'
},
{
    val: 206,
    color: '#f40000'
},
{
    val: 207,
    color: '#f50000'
},
{
    val: 208,
    color: '#f60000'
},
{
    val: 209,
    color: '#f70000'
},
{
    val: 210,
    color: '#f90000'
}
]


