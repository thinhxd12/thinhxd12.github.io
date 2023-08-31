
const PRECIP_NUMB = 0.63;
const DEVIATION_NUMB = 1.53;
let placeObj = {};
let API_WEATHER_KEY = '';
let LAT_LONG = '';
let CURRENT_HOUR;
let CURRENT_MINUTE;


const getWeatherToken = () => {
    let weatherKey = sessionStorage.getItem("weatherKey");
    if (weatherKey !== null) {
        let obj = JSON.parse(weatherKey);
        API_WEATHER_KEY = obj.key;
        placeObj = Object.values(obj.geo);
        // console.log(placeObj);
        LAT_LONG = Object.values(placeObj[0]);
        renderWeatherPlaceSelect(placeObj);
    }
}



const renderWeatherPlaceSelect = (data) => {
    const weatherPlace = document.getElementById('weatherPlace');
    weatherPlace.innerHTML = `
    <select id="weatherPlaces">
        ${Object.keys(placeObj).map((item, index) => {
        return `<option value="${index}" ${index == 0 ? 'selected' : ''}>
                <span>${Object.keys(placeObj[item])}</span>
                </option>`
    }).join('')
        }
    </select>
    `
    $('#weatherPlaces').on('change', function (e) {
        // console.log(this.value);
        LAT_LONG = Object.values(placeObj[this.value]);
        fetchPirateApi();
    });
}

setTimeout(() => {
    getWeatherToken();
}, 2000);


const makePrediction = (data) => {
    let lightRainIndex = data.findIndex(item => item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError >= 0.1 && item.precipProbability >= PRECIP_NUMB);
    let medRainIndex = data.findIndex(item => item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError >= 0.5 && item.precipProbability >= PRECIP_NUMB);
    let heavyRainIndex = data.findIndex(item => item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError >= 1 && item.precipProbability >= PRECIP_NUMB);
    let maxIndex = Math.max(lightRainIndex, medRainIndex, heavyRainIndex);
    let mainItem = {};

    function checkCurrent() {
        let item = data[0].precipIntensity - DEVIATION_NUMB * data[0].precipIntensityError;
        return item >= 1 ? 'Heavy rain' : item >= 0.5 ? 'Rain' : 'Light rain';
    }

    function countTimeStart(index) {
        if (index == 0) {
            return 0;
        }
        else {
            let start = data[0].time;
            let time = data[lightRainIndex].time;
            return Math.floor((time - start) / 60);
        }
    }
    function countTimeEnd() {
        let endRainIndex = data.findIndex(item => item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError < 0.1 && item.precipProbability >= PRECIP_NUMB);
        if (endRainIndex > -1) {
            let start = data[0].time;
            let time = data[endRainIndex].time;
            return Math.floor((time - start) / 60);
        }
        else return -1;
    }
    switch (true) {
        case maxIndex == -1:
            mainItem['type'] = 0;
            mainItem['start'] = 0;
            mainItem['end'] = -1;
            break;
        case maxIndex == 0:
            mainItem['type'] = checkCurrent();
            mainItem['start'] = countTimeStart(maxIndex);
            mainItem['end'] = countTimeEnd();
            break;
        case maxIndex == heavyRainIndex:
            mainItem['type'] = 'Heavy rain';
            mainItem['start'] = countTimeStart(maxIndex);
            mainItem['end'] = countTimeEnd();
            break;
        case maxIndex == medRainIndex:
            mainItem['type'] = 'Rain';
            mainItem['start'] = countTimeStart(maxIndex);
            mainItem['end'] = countTimeEnd();
            break;
        case maxIndex == lightRainIndex:
            mainItem['type'] = 'Light rain';
            mainItem['start'] = countTimeStart(maxIndex);
            mainItem['end'] = countTimeEnd();
            break;
        default:
            break;
    }

    function createText() {
        if (mainItem.type == 0) {
            return `Next hour: No rain anywhere in the area.`
        }
        else {
            if (mainItem.start == 0 && mainItem.end == -1) {
                return `${mainItem.type} for the hour.`;
            }
            else if (mainItem.end > 0) {
                return `${mainItem.type} stopping in ${mainItem.end} min.`;
            }
            else if (mainItem.start > 0) {
                return `${mainItem.type} starting in ${mainItem.start} min.`;
            }
        }

    }
    return createText();
}
// makePrediction(data);

const drawChartRain = (data) => {
    const xValues = data.map(item => {
        let diff = item.time - data[0].time
        return diff / 60;
    })

    const yValues = data.map(item => {
        // 95% = DEVIATION_NUMB* standard deviation occur
        let newData = item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError;
        return newData >= 0 ? newData.toFixed(3) : 0
    })
    new Chart("rainChart", {
        type: "line",
        data: {
            labels: xValues,
            datasets: [{
                fill: true,
                lineTension: 0,
                backgroundColor: "#52a0c1bf",
                borderColor: "rgba(0,0,255,0.1)",
                data: yValues,
            }]
        },
        options: {
            responsive: true,
            legend: { display: false },
            scales: {
                xAxes: [{
                    gridLines: {
                        // display: false,
                        drawTicks: true,
                    },
                    ticks: {
                        callback: function (value, index, ticks) {
                            return index == 0 ? '' : index % 10 === 0 ? value + ' min' : null;
                        },
                        maxRotation: 0,
                        fontColor: "#000",
                        fontSize: 9,
                        autoSkip: false,
                        labelOffset: -3
                    },
                }],
                yAxes: [{
                    gridLines: {
                        display: false,
                        drawTicks: true
                    },
                    ticks: {
                        display: false,
                        // stepSize: 0.1,
                        min: 0,
                        // max: 2
                    },
                    // type: 'logarithmic',
                }]
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            annotation: {

                annotations: [{
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: '1',
                    borderDash: [1, 1],
                    label: {
                        backgroundColor: 'transparent',
                        fontColor: '#000',
                        content: "HEAVY",
                        fontSize: 10,
                        enabled: true,
                        yAdjust: -10,
                        xAdjust: -160
                    },
                    borderColor: '#000',
                    borderWidth: 1,
                },
                {
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: '0.5',
                    borderDash: [1, 1],
                    label: {
                        backgroundColor: 'transparent',
                        fontColor: '#000',
                        content: "MED",
                        fontSize: 10,
                        enabled: true,
                        yAdjust: -10,
                        xAdjust: -165
                    },
                    borderColor: '#000',
                    borderWidth: 1,
                },
                {
                    type: 'line',
                    mode: 'horizontal',
                    scaleID: 'y-axis-0',
                    value: '0',
                    label: {
                        backgroundColor: 'transparent',
                        fontColor: '#000',
                        content: "LIGHT",
                        fontSize: 10,
                        enabled: true,
                        yAdjust: -10,
                        xAdjust: -160
                    },
                },

                ],
                drawTime: "afterDraw",

            }
        }
    });
}

const cleanDataCurrently = (data, offset) => {
    const time = new Date(data.time * 1000);
    let hours = time.getUTCHours() + offset;
    let minutes = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
    CURRENT_HOUR = hours;
    CURRENT_MINUTE = minutes;
    // console.log(CURRENT_HOUR);


    let newItem = {
        icon: data.icon,
        summary: data.summary,
        isDayTime: CURRENT_HOUR * 1 > 5 && CURRENT_HOUR * 1 < 18,
        // 95% = DEVIATION_NUMB* standard deviation occur
        precipIntensity: data.precipIntensity - DEVIATION_NUMB * data.precipIntensityError,
    };
    switch (true) {
        case newItem.precipIntensity >= 0.1 && newItem.precipIntensity < 0.5 && data.cloudCover >= 0.875 && data.precipProbability >= PRECIP_NUMB:
            newItem.icon = 'overcast-rain';
            newItem.summary = 'Overcast Light Rain';
            break;
        case newItem.precipIntensity >= 0.1 && newItem.precipIntensity < 0.5 && data.precipProbability >= PRECIP_NUMB:
            newItem.icon = 'drizzle';
            newItem.summary = 'Light Rain';
            break;
        case newItem.precipIntensity >= 1 && data.precipProbability >= PRECIP_NUMB:
            newItem.icon = 'overcast-rain';
            newItem.summary = 'Heavy Rain';
            break;
        case data.cloudCover <= 0.375:
            newItem.isDayTime ? newItem.icon = 'clear-day' : newItem.icon = 'clear-night';
            newItem.summary = 'Clear';
            break;
        case data.cloudCover <= 0.875:
            newItem.isDayTime ? newItem.icon = 'partly-cloudy-day' : newItem.icon = 'partly-cloudy-night';
            newItem.summary = 'Partly Cloudy';
            break;
        case data.cloudCover <= 0.95:
            newItem.icon = 'cloudy';
            newItem.summary = 'Cloudy';
            break;
        case data.cloudCover <= 1 && newItem.precipIntensity >= 0.5 && data.precipProbability >= PRECIP_NUMB:
            newItem.icon = 'overcast-rain';
            newItem.summary = 'Overcast';
            break;
        case data.cloudCover <= 1:
            newItem.isDayTime ? newItem.icon = 'overcast' : newItem.icon = 'overcast-night';
            newItem.summary = 'Overcast';
            break;
        default:
            break;
    }
    let res = { ...data, ...newItem };
    // console.log(res);
    return res;
}

const renderCurrentlyData = (data, offset) => {
    data = cleanDataCurrently(data, offset);
    let timeNow = CURRENT_HOUR > 12 ? CURRENT_HOUR - 12 + ':' + CURRENT_MINUTE + ' PM' : CURRENT_HOUR + ':' + CURRENT_MINUTE + ' AM';
    let content = `
          <img src="./darksky/${data.icon}.svg" style="width: 135px;">
          <div class="weatherContentText">
          <p class="weatherContentTemp">${Math.round(data.temperature)}°</p>
          <p class="weatherContentInfo">Feels ${Math.round(data.apparentTemperature)}°C</p>
          <p class="weatherContentInfo">UV ${data.uvIndex}</p>
          <div class="weatherContentWind">
          <span>Wind ${Math.round(data.windSpeed)}km/h</span> 
          <img src="./darksky/arrow-up.svg" style="height: 10px;width: 10px;transform: rotate(${data.windBearing}deg);">
          </div>
          <p class="weatherContentInfo">${timeNow + ' - ' + data.summary}</p>
          </div>
        `
    $('.weatherContent').html(content);
    $('.raincanvasBg').css('background-image', `url('./darksky/background/${data.icon}.jpg')`);
    if (data.icon.includes('rain') || data.icon == 'drizzle') animloop();
}



const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
const chunkAverage = (array, size) =>
    array.reduce((acc, _, i) => {
        if (i % size === 0) acc.push(average(array.slice(i, i + size)));
        return acc
    }, []);

const renderHourTimeline = (data) => {
    // console.log(data);
    const colorObj = {
        'Partly Cloudy': '#b9b9b9',
        'Cloudy': '#8c8c8c',
        'Light Rain': '#9ed0f0',
        'Rain': '#77bfec',
        'Clear': '#ececec',
        'Fog': '#ececec',
        'Overcast With Rain': '#8e8e8e',
        'Overcast': '#8e8e8e',
    }

    function isDayTime(hours) {
        return hours * 1 > 5 && hours * 1 < 18;
    }

    let timeLine24 = [];
    let hourNow = CURRENT_HOUR;
    function createTimeLine() {
        if (hourNow % 2 > 0) {
            for (let i = 0; i < 12; i++) {
                hourNow < 24 ? timeLine24.push(hourNow) : timeLine24.push(hourNow - 24);
                hourNow += 2;
            }
        }
        else {
            hourNow++;
            for (let i = 0; i < 12; i++) {
                hourNow < 24 ? timeLine24.push(hourNow) : timeLine24.push(hourNow - 24);
                hourNow += 2;
            }
        }
    }

    createTimeLine();
    let timeLine = timeLine24.map((item, index) => {
        return index == 0 ? 'NOW' : item > 12 ? item - 12 + 'PM' : item + 'AM';
    })

    let tempArr = data.map(item => item.temperature);
    tempArr = chunkAverage(tempArr, 4);
    let tempAvgArr = data.map(item => item.apparentTemperature);
    tempAvgArr = chunkAverage(tempAvgArr, 4);
    let precipIntentArr = data.map(item => item.precipIntensity);
    precipIntentArr = chunkAverage(precipIntentArr, 4);
    let precipErrtArr = data.map(item => item.precipIntensityError);
    precipErrtArr = chunkAverage(precipErrtArr, 4);
    let precipProbtArr = data.map(item => item.precipProbability);
    precipProbtArr = chunkAverage(precipProbtArr, 4);
    let visibilityArr = data.map(item => item.visibility);
    visibilityArr = chunkAverage(visibilityArr, 4);
    let cloudArr = data.map(item => item.cloudCover);
    cloudArr = chunkAverage(cloudArr, 4);
    let windArr = data.map(item => item.windSpeed);
    windArr = chunkAverage(windArr, 4);
    let uvArr = data.map(item => item.uvIndex);
    uvArr = chunkAverage(uvArr, 4);
    let windBearArr = data.map(item => item.windBearing);
    windBearArr = chunkAverage(windBearArr, 4);
    let humidArr = data.map(item => item.humidity);
    humidArr = chunkAverage(humidArr, 4);

    let summaryArr = tempArr.map((item, index) => {
        switch (true) {
            case visibilityArr[index] < 1:
                return 'Fog';
            case precipIntentArr[index] - DEVIATION_NUMB * precipErrtArr[index] < 0.5 && precipProbtArr[index] >= PRECIP_NUMB:
                return 'Light Rain';
            case precipIntentArr[index] - DEVIATION_NUMB * precipErrtArr[index] >= 1 && precipProbtArr[index] >= PRECIP_NUMB:
                return 'Rain';
            case cloudArr[index] <= 0.375:
                return 'Clear';
            case cloudArr[index] <= 0.875:
                return 'Partly Cloudy';
            case cloudArr[index] <= 0.95:
                return 'Cloudy';
            case cloudArr[index] <= 1 && precipIntentArr[index] - DEVIATION_NUMB * precipErrtArr[index] >= 0.5 && precipProbtArr[index] >= PRECIP_NUMB && isDayTime(timeLine24[index]):
                return 'Overcast With Rain';
            case cloudArr[index] <= 1 && isDayTime(timeLine24[index]):
                return 'Overcast';
            case cloudArr[index] <= 1 && !isDayTime(timeLine24[index]):
                return 'Cloudy';
            default:
                break;
        }
    })
    // console.log(summaryArr);
    let timeline = timeLine.map((item, index) => {
        return `<div class="hourItem" style="background-color: ${colorObj[summaryArr[index]]};"></div>`
    }).join('');

    $('#hourTimeline').html(timeline);

    let hourDivBtn = `
    <button class="hourBtn hourBtnActive" id="btn1">temp (°C)</button>
    <button class="hourBtn" id="btn2">feels-like (°C)</button>
    <button class="hourBtn" id="btn3">humidity (%)</button>
    <button class="hourBtn" id="btn4">UV</button>
    <button class="hourBtn" id="btn5">wind (km/h)</button>`;
    $('#hourDivBtn').html(hourDivBtn);


    const renderTimeLineItem = (data, uv = false, humid = false) => {
        let content = timeLine.map((item, index) => {
            return `<div class="timelineItem">
        <span class="timelineItemHour">${item}</span>
        <span class="timelineItemSum">${summaryArr[index]}</span>
        ${summaryArr[index] == 'Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        ${summaryArr[index] == 'Light Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        ${summaryArr[index] == 'Overcast With Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        <span class="dots-box"></span>
        <span class="timelineItemHour" style="width: ${humid ? Math.round((average(data) - data[index]) * 50) + 25 : Math.floor(average(data) - data[index]) * 2 + 25}%;">
            <span class="timelineItemShowText">
            ${humid ? Math.round(data[index] * 100) : Math.round(data[index])}${uv ? '' : humid ? '%' : '°'}
            </span>
        </span> 
        </div > `
        }).join('');
        $('#timelineItems').html(content);
    }

    const renderTimeLineWindItem = (data, bear) => {
        let content = timeLine.map((item, index) => {
            return `<div class="timelineItem">
        <span class="timelineItemHour">${item}</span>
        <span class="timelineItemSum">${summaryArr[index]}</span>
        ${summaryArr[index] == 'Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        ${summaryArr[index] == 'Light Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        ${summaryArr[index] == 'Overcast With Rain' ? `<span class="timelineItemSum">(${Math.round(precipProbtArr[index] * 100)}%)</span>` : ''}
        <span class="dots-box"></span>
        <span class="windItemShow">
          <span>${Math.round(data[index])}</span> 
          <img src="./darksky/arrow-up.svg" style="height: 12px;width: 12px;transform: rotate(${bear[index]}deg);">
        </span >
        <div style="width: ${Math.floor(average(data) - data[index]) * 3 + 25}%;"></div>
        </div > `
        }).join('');
        $('#timelineItems').html(content);
    }


    renderTimeLineItem(tempArr);

    $('#btn1').click(function (e) {
        renderTimeLineItem(tempArr);
        $('.hourBtn').removeClass('hourBtnActive');
        $(this).addClass('hourBtnActive');
    });
    $('#btn2').click(function (e) {
        renderTimeLineItem(tempAvgArr);
        $('.hourBtn').removeClass('hourBtnActive');
        $(this).addClass('hourBtnActive');
    });
    $('#btn3').click(function (e) {
        renderTimeLineItem(humidArr, false, true);
        $('.hourBtn').removeClass('hourBtnActive');
        $(this).addClass('hourBtnActive');
    });
    $('#btn4').click(function (e) {
        renderTimeLineItem(uvArr, true);
        $('.hourBtn').removeClass('hourBtnActive');
        $(this).addClass('hourBtnActive');
    });
    $('#btn5').click(function (e) {
        renderTimeLineWindItem(windArr, windBearArr);
        $('.hourBtn').removeClass('hourBtnActive');
        $(this).addClass('hourBtnActive');
    });

}

// renderHourTimeline(hourlyData);

const fetchPirateApi = () => {
    //turn off rain
    cancelAnimationFrame(rainReq);
    $('#raincanvas').hide();

    // let time = Math.round(Date.now() / 1000) + 1000;
    let time = Math.round(Date.now() / 1000);
    let url = `https://api.pirateweather.net/forecast/${API_WEATHER_KEY}/${LAT_LONG},${time}?exclude=daily&units=ca`;
    fetch(url).then(res => res.json())
        .then(data => {
            // console.log(data);
            renderCurrentlyData(data.currently, data.offset);
            $('.weatherPredict').text(makePrediction(data.minutely.data));
            drawChartRain(data.minutely.data);
            renderHourTimeline(data.hourly.data);
        })

}

// fetchPirateApi();

$('.tabButton').click(function (e) {
    if (this.name == 'tab3') fetchPirateApi();
    $('.toogleItemLeft').removeClass('toogleItemShowLeft');
});


var raincanvas = document.getElementById('raincanvas');
var ctx2 = raincanvas.getContext('2d');
var rainnum = 500;
var rain = [];
var w = raincanvas.width = 380;
var h = raincanvas.height = window.innerHeight;
window.addEventListener('resize', function () {
    w = raincanvas.width = 380;
    h = raincanvas.height = window.innerHeight;
});
function random(min, max) {
    return Math.random() * (max - min + 1) + min;
}
function clearraincanvas() {
    ctx2.clearRect(0, 0, raincanvas.width, raincanvas.height);
}
function createRain() {
    for (var i = 0; i < rainnum; i++) {
        rain[i] = {
            x: Math.random() * w,
            y: Math.random() * h,
            l: Math.random() * 1,
            xs: -4 + Math.random() * 4 + 2,
            ys: Math.random() * 10 + 10
        };
    }
}

function drawRain(i) {
    ctx2.beginPath();
    ctx2.moveTo(rain[i].x, rain[i].y);
    ctx2.lineTo(rain[i].x + rain[i].l * rain[i].xs, rain[i].y + rain[i].l * rain[i].ys);
    ctx2.strokeStyle = 'rgba(174,194,224,0.5)';
    ctx2.lineWidth = 1;
    ctx2.lineCap = 'round';
    ctx2.stroke();
}

function animateRain() {
    clearraincanvas();
    for (var i = 0; i < rainnum; i++) {
        rain[i].x += rain[i].xs;
        rain[i].y += rain[i].ys;
        if (rain[i].x > w || rain[i].y > h) {
            rain[i].x = Math.random() * w;
            rain[i].y = -20;
        }
        drawRain(i);
    }
}

createRain();

var rainReq;
function animloop() {
    $('#raincanvas').show();
    animateRain();
    rainReq = requestAnimationFrame(animloop);
}