
const PRECIP_NUMB = 0.6;
const DEVIATION_NUMB = 0.8;
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
        return `<option class="weatherPlaceOption" value="${index}" ${index == 0 ? 'selected' : ''}>
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
    let lightRainIndex = data.findIndex(item => item.intensity >= 0.1 && item.probability >= PRECIP_NUMB);
    let medRainIndex = data.findIndex(item => item.intensity >= 0.5 && item.probability >= PRECIP_NUMB);
    let heavyRainIndex = data.findIndex(item => item.intensity >= 1 && item.probability >= PRECIP_NUMB);
    let endRainIndex = data.findLastIndex(item => item.intensity >= 0.09 && item.intensity < 0.1 && item.probability >= PRECIP_NUMB);
    let mainItem = {};
    endRainIndex >= 0 ? mainItem.end = data[endRainIndex].diffTime : mainItem.end = -1;
    switch (true) {
        case lightRainIndex == -1:
            mainItem.type = 'No rain';
            break;
        case lightRainIndex >= 0:
            mainItem.type = 'Light rain';
            break;
        case medRainIndex >= 0:
            mainItem.type = 'Rain'
            break;
        case heavyRainIndex >= 0:
            mainItem.type = 'Heavy rain'
            break;
        default:
            break;
    }
    lightRainIndex >= 0 ? mainItem.start = data[lightRainIndex].diffTime : mainItem.start = -1;
    function makeText(start, end) {
        switch (true) {
            case start == 0 && end < 0:
                return `for the hour.`
            case start > 0:
                return `starting in ${start} min.`
            case end > 0:
                return `stopping in ${end} min.`
            default:
                break;
        }
    }

    function createText() {
        switch (mainItem.type) {
            case 'No rain':
                return `Next hour: No rain anywhere in the area.`
            case 'Light rain':
                return `Light rain ${makeText(mainItem.start, mainItem.end)}`;
            case 'Rain':
                return `Rain ${makeText(mainItem.start, mainItem.end)}`;

            case 'Heavy rain':
                return `Heavy rain ${makeText(mainItem.start, mainItem.end)}`;

            default:
                break;
        }

    }

    $('.weatherPredict').text(createText());
}
// makePrediction(data);

let myRainChart;

const drawChartRain = (data) => {
    let newData = data.map((item, index) => {
        let newItem = { diffTime: 0, intensity: 0, probability: 0 }
        let newIntensity = item.precipIntensity - DEVIATION_NUMB * item.precipIntensityError;
        newItem.diffTime = (item.time - data[0].time) / 60;
        newItem.intensity = newIntensity >= 0 ? newIntensity.toFixed(3) * 1 : 0;
        newItem.probability = item.precipProbability;
        return newItem;
    })

    const xValues = newData.map(item => item.diffTime);
    const yValues = newData.map(item => item.intensity);
    const zValues = newData.map(item => item.probability);
    makePrediction(newData);

    const chartData = {
        labels: xValues,
        datasets: [
            {
                label: '',
                data: yValues,
                backgroundColor: "#52a0c1bf",
                borderColor: "#009bff",
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                label: '',
                data: zValues,
                borderColor: "red",
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                borderWidth: 1,
                yAxisID: 'y1',
            },
        ]
    };

    if (myRainChart) myRainChart.destroy();

    myRainChart = new Chart("rainChart", {
        type: "line",
        data: chartData,
        options: {
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    min: 0,
                    max: 1.5,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    border: { dash: [1, 2] },
                    grid: {
                        drawTicks: 0
                    },
                    ticks: {
                        stepSize: 0.5,
                        callback: (value, index, values) => {
                            switch (value) {
                                case 0:
                                    return 'LIGHT';
                                case 0.5:
                                    return 'MED';
                                case 1:
                                    return 'HEAVY';
                                default:
                                    null;
                            }
                        },
                        font: {
                            size: 9,
                        },
                        color: 'black'

                    }
                },
                x: {
                    border: { display: 0, },
                    grid: {
                        display: 1,
                        drawOnChartArea: 0,
                        tickLength: 5,
                        tickWidth: 1,
                        tickColor: '#000000a3',
                    },
                    ticks: {
                        callback: (value, index, values) => {
                            return value == 0 ? '' : value % 10 === 0 ? value + 'min' : null;
                        },
                        font: {
                            size: 9,
                        },
                        color: 'black'
                    }
                },
                y1: {
                    min: 0,
                    max: 1,
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        display: 1,
                        drawOnChartArea: 0,
                        tickLength: 3,
                        tickWidth: 1,

                    },
                    ticks: {
                        stepSize: 0.1,
                        callback: (value, index, values) => {
                            return value == 0 ? '0' : value * 100 + '%';
                        },
                        font: {
                            size: 9,
                        },
                        color: 'black'

                    },
                },
            }
        }
    })
}

const cleanDataCurrently = (data, offset) => {
    const time = new Date(data.time * 1000);
    let hours = time.getUTCHours() + offset;
    let minutes = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
    CURRENT_HOUR = hours;
    CURRENT_MINUTE = minutes;
    // console.log(CURRENT_HOUR);

    // 95% = DEVIATION_NUMB* standard deviation occur
    let newPrecipIntensity = (data.precipIntensity - DEVIATION_NUMB * data.precipIntensityError).toFixed(3) * 1;
    let newItem = {
        icon: data.icon,
        summary: data.summary,
        isDayTime: CURRENT_HOUR * 1 > 5 && CURRENT_HOUR * 1 < 18,
        precipIntensity: newPrecipIntensity > 0 ? newPrecipIntensity : 0,
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
            // let newCurrent = { ...data.currently, ...data.minutely.data[0] }
            // renderCurrentlyData(newCurrent, data.offset);
            renderCurrentlyData(data.currently, data.offset);
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