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
let getAllDataTimeout;
const getAllDataSheet = () => {
    clearTimeout(getAllDataTimeout);
    fetch(ggsUrl + '?action=getAllData', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            sessionStorage.setItem('sheetData', JSON.stringify(data));
        }).catch(err => {
            console.log(err);
        })
    getAllDataTimeout = setTimeout(() => {
        let item = sessionStorage.getItem("sheetData")
        if (item !== null) {
            dataSheets = JSON.parse(item);
        }
    }, 3000);
}

getAllDataSheet();

const getTotalDoneWord = () => {
    fetch(ggsUrl + '?action=getTotalDoneWord', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            document.getElementById("wordNum").innerHTML = data;
        }).catch(err => {
            console.log(err);
        })
}
getTotalDoneWord();


const fetchAndRenderCalendarData = () => {
    fetch(ggsUrl + '?action=getCalProgress', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            sessionStorage.setItem('calendarData', JSON.stringify(data));
            renderCalendar(data);
        }).catch(err => {
            console.log(err);
        })
};

fetchAndRenderCalendarData();

const renderCalendar = (data) => {
    let date = new Date();
    const todaysDay = date.getDate();
    const todaysMonth = date.getMonth();
    const todaysWeekDay = date.getDay();
    const todaysYear = date.getFullYear();

    const startDay = new Date(`${data.startD}`);
    let endDay = new Date();
    endDay.setTime(startDay.getTime() + 5 * 86400000);

    // const startDay = new Date("2023/06/29");
    // const endDay = new Date("2021/07/09");

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
    monthImg(todaysMonth + 1);

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

    // renderCalendar---------------
    monthDateArr = chunk(monthDateArr, 7);
    const htmlDate = document.getElementById("htmlDate");
    htmlDate.innerHTML = '';
    for (let i = 0; i < monthDateArr.length; i++) {
        htmlDate.innerHTML += `
      <tr class="weekDay">
        ${monthDateArr[i]
                .map((item, index) => {
                    return `
              <td><span class="${item.month == date.getMonth() && index == 0 ? `${item.class} sundayDay` : `${item.class}`}" onclick="setNewStartDate('${new Date().getFullYear()}/${item.month + 1}/${item.date}')">${item.date}</span></td>
            `;
                })
                .join("")}
      </tr>
      `;
    }

    // renderHistoryTable---------------
    const historyTable = document.getElementById('historyTable');
    historyTable.innerHTML = `
        ${data.table.map((item, index) => {
        return `
                <td>
                  <span class="term">${item[0]}</span>
                  ${item[1] ? `<span class="desc">${item[1]} - ${item[2]}</span>` : '<span class="desc"></span>'}
                </td>
            `
    }).join('')
        }
        `;

    // renderCalendarProgress---------------
    if (data.row1[0] == 0 && data.row2[0] == 0) {
        document.getElementById('dateProgress').innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/7937/7937726.png" width="20px">';
    } else document.getElementById('dateProgress').innerHTML = `
                      <div class="dateProgressContent">
                        ${data.row1[1] <= 0 ? '<img src="https://cdn-icons-png.flaticon.com/512/7595/7595571.png" width="18">' : ''}
                        <span onclick="setWordList(${data.row1[0]})">${data.row1[0]} - ${data.row1[0] + 49}</span>
                        <span class="dateProgressFraction">${9 - data.row1[1]}/9</span>
                      </div>
                      <div class="dateProgressContent">
                        ${data.row2[1] <= 0 ? '<img src="https://cdn-icons-png.flaticon.com/512/7595/7595571.png" width="18">' : ''}
                        <span onclick="setWordList(${data.row2[0]})">${data.row2[0]} - ${data.row2[0] + 49}</span>
                        <span class="dateProgressFraction">${9 - data.row2[1]}/9</span>
                      </div>
            `;
}

const monthImg = (monthImg) => {
    const htmlText = document.getElementById("calendarHeader");
    switch (monthImg) {
        case 1:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2019/12/15/18/24/winter-4697776_960_720.jpg")';
            break;
        case 2:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2016/11/12/22/42/santa-claus-1819933_960_720.jpg")';
            break;
        case 3:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2014/02/27/16/10/spring-276014_960_720.jpg")';
            break;
        case 4:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2017/05/08/13/15/spring-bird-2295436_960_720.jpg")';
            break;
        case 5:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2014/12/17/21/30/wild-flowers-571940_960_720.jpg")';
            break;
        case 6:
            htmlText.style.backgroundImage =
                'url("http://sellsidehandbook.com/wp-content/uploads/2018/08/pier-569314_960_720.jpg")';
            break;
        case 7:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2017/01/20/00/30/maldives-1993704_960_720.jpg")';
            break;
        case 8:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2016/08/30/12/13/beach-1630540_960_720.jpg")';
            break;
        case 9:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2016/09/06/15/16/autumn-1649362_960_720.jpg")';
            break;
        case 10:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2015/12/01/20/28/fall-1072821_960_720.jpg")';
            break;
        case 11:
            htmlText.style.backgroundImage =
                'url("https://cdn.pixabay.com/photo/2019/10/31/06/58/avenue-4591121_960_720.jpg")';
            break;
        case 12:
            htmlText.style.backgroundImage =
                'url("https://media.galwaydaily.com/wp-content/uploads/2018/11/23125638/snowflake-1245748_960_720.jpg")';
            break;
    }
};

const setTodayWork = () => {
    const calendarContent = document.getElementById("calendarContent");
    calendarContent.innerHTML = `
    <div class="calendarItem">
        <div class="calendarItemHeader">
            <span></span>
            <div style="display: flex;">
            <button class="close-btn" onclick="handleAddSchedule()">
                <img src="https://cdn-icons-png.flaticon.com/512/9778/9778606.png" width="13" height="13">
            </button>
            <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
            </button>
            </div>
        </div>
        <div class="calendarItemContent">
        <p>Set today word by schedule!</p>
        </div>
    </div>`;
};

const handleAddSchedule = () => {
    fetch(ggsUrl + '?action=setTodayWork', { method: 'GET' })
        .then(res => res.text())
        .then(data => {
            document.getElementById('calendarContent').innerHTML = '';
            fetchAndRenderCalendarData();
        }).catch(err => {
            console.log(err);
        })
}

const setNewStartDate = (date) => {
    const calendarContent = document.getElementById('calendarContent');
    calendarContent.innerHTML = `
        <div class="calendarItem">
            <div class="calendarItemHeader">
                <span>Set new schedule!</span>
                <div style="display: flex;">
                    <button class="close-btn" onclick="handleAddNewStartDay()">
                        <img src="https://cdn-icons-png.flaticon.com/512/9778/9778606.png" width="13" height="13">
                    </button>
                    <button class="close-btn" onclick="document.getElementById('calendarContent').innerHTML='';">
                        <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
                    </button>
                </div>
            </div>
            <div class="calendarItemContent">
                <input class="calendarItemInput" value="${date}" id="newStartDay"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
                <input class="calendarItemInput" placeholder="Set new start row!" id="newStartRow"
                    autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
            </div>
        </div>`;
}


const handleAddNewStartDay = () => {
    const newStartDay = document.getElementById('newStartDay');
    const newStartRow = document.getElementById('newStartRow');
    let obj = { day: newStartDay.value, row: newStartRow.value };
    fetch(ggsUrl + '?action=setNewStartDay', { method: 'POST', body: JSON.stringify(obj) })
        .then(res => res.text())
        .then(data => {
            document.getElementById('calendarContent').innerHTML = '';
            fetchAndRenderCalendarData();
        }).catch(err => {
            console.log(err);
        })
}

let wordList = [];
let progressFlipNum = 0;
let autorunTime = 0;
const setWordList = (row) => {
    const wordRow = document.getElementById("wordRow");
    wordList = [];
    autorunTime = 0;

    let item = sessionStorage.getItem("sheetData")
    if (item !== null) {
        dataSheets = JSON.parse(item);
    }
    wordList = dataSheets.filter(item => item.row >= row && item.row < row + 50);
    wordRow.value = row;
    wordRow.blur();
    handleToggleSwitchSun();
    handleToggleSwitchMoon();
    let calData;
    let itemP = sessionStorage.getItem("calendarData");
    if (itemP !== null) {
        calData = JSON.parse(itemP);
    }
    if (wordRow.value == calData.row1[0]) {
        progressFlipNum = 9 - calData.row1[1] + 1;
    }
    else progressFlipNum = 9 - calData.row2[1] + 1;
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
    } else if (isTimerStarted == true && autorunTime > 1) {
        handleToggleSwitchMoon();
        pause();
    }
});

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
    prepareForNext();
    handleToggleSwitchMoon();
    autorunTime = 0;
    pause();
}

const prepareForNext = () => {
    const wordRow = document.getElementById("wordRow");
    let rowNum = wordRow.value * 1;
    fetch(ggsUrl + '?action=getCalProgress', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
            sessionStorage.setItem('calendarData', JSON.stringify(data));
        }).catch(err => {
            console.log(err);
        })
    setTimeout(() => {
        getAllDataSheet();
    }, 3000);
    setTimeout(() => {
        setWordList(rowNum);
    }, 6000);

}


const handleNextWord = () => {
    let currentWord = wordList[autorunTime];
    let currentText = currentWord.val.replace(/(.+?)\s(\||\-)(.+)/, "$1");
    playTTSwithValue(currentText);
    renderFlashcard(currentWord.val, currentWord.numb, false, autorunTime + 1, progressFlipNum);
    handleCheckWithRow(currentWord.row);
};


const handleCheckWithRow = (numRow) => {
    fetch(ggsUrl + '?action=checkWithRow', { method: 'POST', body: JSON.stringify({ row: numRow }) })
        .then(res => res.text())
        .then(data => {

        }).catch(err => {
            console.log(err);
        })
}


const playTTSwithValue = (val, render = true) => {
    let newUrl = urlCors + `https://www.oxfordlearnersdictionaries.com/search/american_english/direct/?q=${val}`;

    $.get(newUrl, function (html) {
        let mp3Link = $(html).find('.audio_play_button').attr('data-src-mp3');
        if (mp3Link) {
            $('#tts-audio').attr('src', mp3Link);
            const audioEl = document.getElementById("tts-audio");
            audioEl.volume = 1;
            audioEl.play();
        }
        let headword = $(html).find('.webtop-g').html();
        let meaning = $(html).find('#entryContent').html();
        let nearby = $(html).find('.nearby ul').html();
        renderExplain(headword, meaning, nearby);
    });
};


let flipTimer1;
let flipTimer2;

const renderFlashcard = (val, numb, row, index, progress) => {
    clearTimeout(flipTimer1);
    clearTimeout(flipTimer2);

    let newNumb = numb - 1 > 0 ? numb - 1 : 0;
    let wordOrig = val.replace(/(.+?)\s\-(.+)/, "$1");
    let word = wordOrig.replace(/(\w+)\s.+/, "$1")
    let phonetic = wordOrig.replace(/\w+\s(\|.+\|)/, '$1')
    let meaning = val.replace(wordOrig, "");
    meaning = meaning.replace(/\s\-(.+?)\-/g, "\n【 $1 】\n&nbsp;🍀&nbsp;");
    meaning = meaning.replace(/\-/g, "\n&nbsp;🍀&nbsp;").substring(1);
    const flashCardContent = document.getElementById("flashCardContent");
    flashCardContent.innerHTML = `
      <div class="flip-card">
      <div class="flip-card-inner" id="flipCardInner">
        <div class="flip-card-front">
          <p class="heading">FLASHCARD</p>
          <svg width="21" height="27" id="Layer_1" class="cardLogo" viewBox="0 0 1.2 1.2"
            xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
            <g></g>
            <path
              d="M1 .42a.4.4 0 1 0-.642.318.109.109 0 0 1 .006.004.206.206 0 0 1 .076.157v.281h.32V.899c0-.08.046-.138.08-.16A.399.399 0 0 0 1 .42zm-.52.721V1.02h.24v.121H.48zM.6.46a.04.04 0 0 1 0-.08.04.04 0 0 1 0 .08zm.216.247L.814.708A.237.237 0 0 0 .72.899v.08h-.1V.497A.08.08 0 0 0 .599.34a.08.08 0 0 0-.08.08.08.08 0 0 0 .06.077V.98h-.1V.9a.25.25 0 0 0-.09-.188L.388.711A.551.551 0 0 0 .382.707.361.361 0 1 1 .96.421a.356.356 0 0 1-.144.288z">
            </path>
          </svg>
          ${progress ? `<span class="progressFlip">${progress}/9</span>` : ''}
          ${index ? `<span class="indexFlip"><small>No.</small>${index}</span>` : ''}
                    <h1>${word}</h1>
                    <p>${phonetic}</p>
                    <span class="indicateFlip" id="indicateFlip" style="color: ${mangMau1[newNumb].color}">
                ${numb == 0 ? '<img src="https://cdn-icons-png.flaticon.com/512/7937/7937726.png" width="20px">' : numb}
                    </span>
          <p class="cardName">05/07/22</p>
        </div>
        <div class="flip-card-back">
          <div class="flip-card-back-content">
            <p>${meaning}</p>
          </div>
        </div>
      </div>
    </div>
    `;

    if (numb > 0) {
        setTimeout(() => {
            document.getElementById("indicateFlip").innerHTML = `
      ${newNumb == 0 ? '<img src="https://cdn-icons-png.flaticon.com/512/7937/7937726.png" width="20px">' : newNumb}
      `;
        }, 900)
    }

    flipTimer1 = setTimeout(flipFlashCard, 3500);
    flipTimer2 = setTimeout(flipFlashCard, 5000);
};

const flipFlashCard = () => {
    const flipCardInner = document.getElementById('flipCardInner');
    flipCardInner.classList.toggle("flipMyCard");
};

const renderExplain = (headword, meaning, nearby) => {
    $('#contentImg').addClass('contentImgBlurred');
    const contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
    <div class="explainContainer">
      <div class="explainHeader">
      <button class="closeBtn" onclick="handleDelete()">
         <img src="https://cdn-icons-png.flaticon.com/512/2734/2734822.png" width="15" height="15">
      </button>
      </div>
      <div class="explainBody">
        <div class="wordType"><span class="preWord">Definitions of</span>${headword}</div>
        ${meaning ? `<div class="wordMeaning">${meaning}</div>` : ""}
        ${nearby ? `<div class="wordNearby">${nearby}</div>` : ""}
      </div>
    </div>  
      `;
};

const handleDelete = () => {
    $('#contentImg').removeClass('contentImgBlurred');
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

const handleTranslate = async () => {
    const transInput = document.getElementById("transInput");
    if (transInput.value === 'random') {
        renderRandomCheck();
        return;
    }

    if (transInput.value === 'edit') {
        renderEditWord();
        return;
    }

    if (transInput.value === 'del') {
        renderDeleteWord();
        return;
    }
    if (/[1-9]\d*/.test(transInput.value)) {
        let textFindArr = dataSheets.filter(item => item.row == transInput.value);
        if (textFindArr.length == 1) {
            let textFind = textFindArr[0];
            let textFindWord = textFind.val.replace(/(.+?)\s(\||\-)(.+)/, "$1");
            let textFindVal = textFind.val;
            let textFindNumb = textFind.numb;
            playTTSwithValue(textFindWord);
            renderFlashcard(textFindVal, textFindNumb);
        }
    } else {
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
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = "";
    if (arr.translation) {
        contentBody.innerHTML = `
    <div class="transItem">
        <div class="transItemHeader">
          <span></span>
          <div style="display: flex;">
            <button class="close-btn" onclick="handleAddTextEnd()">
              <img src="https://cdn-icons-png.flaticon.com/512/3471/3471653.png" width="14" height="14">
            </button>
            <button class="close-btn" onclick="handleAddNewText()">
              <img src="https://cdn-icons-png.flaticon.com/512/1848/1848841.png" width="11" height="11">
            </button>
            <button class="close-btn" onclick="handleDelete();">
              <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
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
          <p id="tlTranscript">| ${arr.wordTranscription} |</p>
          <button class="sound-btn" onclick="playTTSwithValue('${arr.word}',false)">
            <img src="https://cdn-icons-png.flaticon.com/512/6707/6707083.png" width="18" height="18">
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


const renderRandomCheck = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
    <div class="transItem">
      <div class="transItemHeader">
           <span></span>
           <div style="display: flex;">
           <button class="close-btn" onclick="handlePlayRandom()">
            <img src="https://cdn-icons-png.flaticon.com/512/9778/9778606.png" width="13" height="13">
            </button>
            <button class="close-btn" onclick="handleDelete();">
            <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
            </button>
           </div>
       </div>
       <div class="transItemContent">
            <input class="transItemInput" placeholder="Range from" id="inputRandom" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
       </div>
       </div>
      `;
};

const renderEditWord = () => {
    let contentBody = document.getElementById("contentBody");
    contentBody.innerHTML = `
      <div class="transItem">
       <div class="transItemHeader">
            <span></span>
            <div style="display: flex;">
            <button class="close-btn" onclick="setEditWord()">
                <img src="https://cdn-icons-png.flaticon.com/512/9778/9778606.png" width="13" height="13">
            </button>
            <button class="close-btn" onclick="handleDelete();">
                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
            </button>
            </div>
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="Find word" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="transItemContent">
            <input class="transItemInput" placeholder="" id="inputEditWordResult" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
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
                  <img src="https://cdn-icons-png.flaticon.com/512/3405/3405244.png" width="13">
                </button>
                <button class="close-btn" onclick="setArchivedWord()">
                  <img src="https://cdn-icons-png.flaticon.com/512/263/263122.png" width="13">
                </button>
                <button class="close-btn" onclick="handleDelete();">
                  <img src="https://cdn-icons-png.flaticon.com/512/1828/1828665.png" width="10" height="10">
                </button>
            </div>
        </div>
        <div class="transItemContent">
          <input class="transItemInput" placeholder="Archived word" id="inputEditWord" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()"  onkeyup="handleChangeEditInput(event)">
        </div>
        <div class="transItemContent">
          <input class="transItemInput" placeholder="" id="inputEditWordResult" autocomplete="off" onmouseover="this.focus()" onmouseout="this.blur()">
        </div>
        </div>
        <div id="editContentDiv"></div>`;
};

let editRowWord;
const handleChangeEditInput = (e) => {
    const editContentDiv = document.getElementById("editContentDiv");

    let arrFilter = dataSheets.filter(item => item.val.search(`^${e.target.value}.*$`) > -1);
    editContentDiv.innerHTML = `
      ${arrFilter.map((item, index) => {
        let currentText = item.val.replace(/(.+?)\s(\||\-)(.+)/, "$1");
        let currentVal = item.val;
        let currentNumb = item.numb;
        let currentRow = item.row;
        return `
          <a class="my-item" onclick="setInputEditWordResult('${currentVal}',${currentRow});">${currentText}</a>
          `
    }).join('')
        }
    `;

}

const setInputEditWordResult = (text, row) => {
    const inputEditWordResult = document.getElementById("inputEditWordResult");
    inputEditWordResult.value = text;
    document.getElementById("editContentDiv").innerHTML = '';
    editRowWord = row;
}

const setEditWord = () => {
    const inputEditWord = document.getElementById("inputEditWord");
    const inputEditWordResult = document.getElementById("inputEditWordResult");
    let obj = { text: inputEditWordResult.value, row: editRowWord };
    fetch(ggsUrl + '?action=setEditWord', { method: 'POST', body: JSON.stringify(obj) })
        .then(res => res.text())
        .then(data => {
            inputEditWord.value = '';
            inputEditWordResult.value = '';
            getAllDataSheet();
        }).catch(err => {
            console.log(err);
        })
}

const setArchivedWord = () => {
    const inputEditWord = document.getElementById("inputEditWord");
    const inputEditWordResult = document.getElementById("inputEditWordResult");
    let obj = { text: inputEditWordResult.value, row: editRowWord };
    fetch(ggsUrl + '?action=setArchivedWord', { method: 'POST', body: JSON.stringify(obj) })
        .then(res => res.text())
        .then(data => {
            inputEditWord.value = '';
            inputEditWordResult.value = '';
            getAllDataSheet();
        }).catch(err => {
            console.log(err);
        })
}

const setDeleteWord = () => {
    const inputEditWord = document.getElementById("inputEditWord");
    const inputEditWordResult = document.getElementById("inputEditWordResult");
    let obj = { text: inputEditWordResult.value, row: editRowWord };
    fetch(ggsUrl + '?action=setDeleteWord', { method: 'POST', body: JSON.stringify(obj) })
        .then(res => res.text())
        .then(data => {
            inputEditWord.value = '';
            inputEditWordResult.value = '';
            getAllDataSheet();
        }).catch(err => {
            console.log(err);
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
    let tlword = document.getElementById("tlword");
    let tlTranscript = document.getElementById("tlTranscript");
    let addNewW = document.getElementById("addNewW");
    let newText = document.getElementById("newText");

    addNewW.value = tlword.innerText + " " + tlTranscript.innerText;
    addNewW.style.height = "25px";
    newText.style.opacity = "1";
    newText.style.height = "auto";
};

const handleAddTextEnd = () => {
    let addNewW = document.getElementById("addNewW");
    if (addNewW.value.length > 0) {
        fetch(ggsUrl + '?action=setNewText', { method: 'POST', body: JSON.stringify({ text: addNewW.value }) })
            .then(res => res.text())
            .then(data => {
                addNewW.value = '';
                getAllDataSheet();
            }).catch(err => {
                console.log(err);
            })
    }
};

function randomArray(length, max) {
    return Array.apply(null, Array(length)).map(function () {
        return Math.round(Math.random() * max);
    });
}


let randomRunTime = 1;
let randomArrGet = [];
const playRandom = () => {
    let currentText = randomArrGet[randomRunTime - 1].val.replace(/(.+?)\s(\||\-)(.+)/, "$1");
    playTTSwithValue(currentText);
    renderFlashcard(randomArrGet[randomRunTime - 1].val, randomArrGet[randomRunTime - 1].numb, false, randomRunTime);
    handleCheckWithRow(randomArrGet[randomRunTime - 1].row);

    if (randomRunTime < 10) {
        randomTimeout = setTimeout(playRandom, 7000)
    } else {
        randomRunTime = 0;
        clearTimeout(randomTimeout);
    }
    randomRunTime++;
}

const handlePlayRandom = async () => {
    let inputRandom = document.getElementById("inputRandom");
    let randomArr = randomArray(10, 49).map(item => item + inputRandom.value * 1);
    randomArrGet = randomArr.map(item => dataSheets[item - 1]);
    playRandom()
}




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