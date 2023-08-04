const getSheetData = async () => {
  const res = await fetch(ggsUrl + '?action=getAllData', { method: 'GET' });
  return res.json();
}


const getSheetDataPS = async () => {
  const res = await fetch(ggsUrl + '?action=getAllDataPass', { method: 'GET' });
  return res.json();
}

const importData = () => {
  getSheetData().then(data => {
    let newdata = data.filter(item => item.val)
    newdata = newdata.map(item => {
      let wordOrig = item.val.replace(/(.+?)\s\-(.+)/, "$1");
      let word = wordOrig.replace(/(.+)\s\|.+/, "$1");
      let phonetic = wordOrig.replace(/.+\s\|\s(.+)\s\|/, '$1');
      let meaning = item.val.replace(wordOrig, "");
      return {
        text: word,
        phonetic: phonetic,
        meaning: meaning,
        numb: item.numb,
      }
    })
    // console.log(newdata);
    let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/import?collection=hoctuvung'
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(newdata)
    }).then(res => res.json()).then(data => console.log(data))

  })
}

// importData();

const importDataHistory = () => {

  let url = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-tcfpw/endpoint/import?collection=history'
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(historyTable)
  }).then(res => res.json()).then(data => console.log(data))
}


const historyTable = [
  {
    "index": 0,
    "data": [
      {
        "row": 1,
        "fromD": "2022/08/21",
        "toD": "2022/08/26"
      },
      {
        "row": 201,
        "fromD": "2022/09/02",
        "toD": "2022/09/07"
      },
      {
        "row": 401,
        "fromD": "2022/08/27",
        "toD": "2022/09/01"
      },
      {
        "row": 601,
        "fromD": "2022/09/08",
        "toD": "2022/09/13"
      },
      {
        "row": 801,
        "fromD": "2022/09/14",
        "toD": "2022/09/19"
      }
    ]
  },
  {
    "index": 1,
    "data": [
      {
        "row": 1,
        "fromD": "2022/09/20",
        "toD": "2022/09/25"
      },
      {
        "row": 201,
        "fromD": "2022/09/26",
        "toD": "2022/10/01"
      },
      {
        "row": 401,
        "fromD": "2022/10/02",
        "toD": "2022/10/07"
      },
      {
        "row": 601,
        "fromD": "2022/10/08",
        "toD": "2022/10/13"
      },
      {
        "row": 801,
        "fromD": "2022/10/14",
        "toD": "2022/10/19"
      }
    ]
  },
  {
    "index": 2,
    "data": [
      {
        "row": 1001,
        "fromD": "2022/10/20",
        "toD": "2022/10/25"
      },
      {
        "row": 1201,
        "fromD": "2022/10/26",
        "toD": "2022/10/31"
      },
      {
        "row": 1401,
        "fromD": "2022/11/01",
        "toD": "2022/11/06"
      },
      {
        "row": 1601,
        "fromD": "2022/11/07",
        "toD": "2022/11/12"
      },
      {
        "row": 1801,
        "fromD": "2022/11/13",
        "toD": "2022/11/18"
      }
    ]
  },
  {
    "index": 3,
    "data": [
      {
        "row": 1,
        "fromD": "2022/11/19",
        "toD": "2022/11/24"
      },
      {
        "row": 201,
        "fromD": "2022/11/25",
        "toD": "2022/11/30"
      },
      {
        "row": 401,
        "fromD": "2022/12/01",
        "toD": "2022/12/06"
      },
      {
        "row": 601,
        "fromD": "2022/12/07",
        "toD": "2022/12/11"
      },
      {
        "row": 801,
        "fromD": "2022/12/13",
        "toD": "2022/12/18"
      }
    ]
  },
  {
    "index": 4,
    "data": [
      {
        "row": 1001,
        "fromD": "2023/01/06",
        "toD": "2023/01/11"
      },
      {
        "row": 1201,
        "fromD": "2022/12/31",
        "toD": "2023/01/05"
      },
      {
        "row": 1401,
        "fromD": "2023/01/12",
        "toD": "2023/01/17"
      },
      {
        "row": 1601,
        "fromD": "2022/12/25",
        "toD": "2022/12/30"
      },
      {
        "row": 1801,
        "fromD": "2022/12/19",
        "toD": "2022/12/24"
      }
    ]
  },
  {
    "index": 5,
    "data": [
      {
        "row": 1,
        "fromD": "2023/01/18",
        "toD": "2023/01/23"
      },
      {
        "row": 201,
        "fromD": "2023/01/30",
        "toD": "2023/02/04"
      },
      {
        "row": 401,
        "fromD": "2023/01/24",
        "toD": "2023/01/29"
      },
      {
        "row": 601,
        "fromD": "2023/02/05",
        "toD": "2023/02/10"
      },
      {
        "row": 801,
        "fromD": "2023/02/11",
        "toD": "2023/02/16"
      }
    ]
  },
  {
    "index": 6,
    "data": [
      {
        "row": 1001,
        "fromD": "2023/03/01",
        "toD": "2023/03/06"
      },
      {
        "row": 1201,
        "fromD": "2023/03/13",
        "toD": "2023/03/18"
      },
      {
        "row": 1401,
        "fromD": "2023/02/17",
        "toD": "2023/02/22"
      },
      {
        "row": 1601,
        "fromD": "2023/03/07",
        "toD": "2023/03/12"
      },
      {
        "row": 1801,
        "fromD": "2023/02/23",
        "toD": "2023/02/28"
      }
    ]
  },
  {
    "index": 7,
    "data": [
      {
        "row": 1,
        "fromD": "2023/03/19",
        "toD": "2023/03/24"
      },
      {
        "row": 201,
        "fromD": "2023/03/31",
        "toD": "2023/04/05"
      },
      {
        "row": 401,
        "fromD": "2023/03/25",
        "toD": "2023/03/30"
      },
      {
        "row": 601,
        "fromD": "2023/04/06",
        "toD": "2023/04/11"
      },
      {
        "row": 801,
        "fromD": "2023/04/12",
        "toD": "2023/04/17"
      }
    ]
  },
  {
    "index": 8,
    "data": [
      {
        "row": 1001,
        "fromD": "2023/04/30",
        "toD": "2023/05/05"
      },
      {
        "row": 1201,
        "fromD": "2023/05/12",
        "toD": "2023/05/17"
      },
      {
        "row": 1401,
        "fromD": "2023/04/18",
        "toD": "2023/04/23"
      },
      {
        "row": 1601,
        "fromD": "2023/05/06",
        "toD": "2023/05/11"
      },
      {
        "row": 1801,
        "fromD": "2023/04/24",
        "toD": "2023/04/29"
      }
    ]
  },
  {
    "index": 9,
    "data": [
      {
        "row": 1,
        "fromD": "2023/05/18",
        "toD": "2023/05/23"
      },
      {
        "row": 201,
        "fromD": "2023/06/05",
        "toD": "2023/06/10"
      },
      {
        "row": 401,
        "fromD": "2023/05/24",
        "toD": "2023/05/29"
      },
      {
        "row": 601,
        "fromD": "2023/06/11",
        "toD": "2023/06/16"
      },
      {
        "row": 801,
        "fromD": "2023/05/30",
        "toD": "2023/06/04"
      }
    ]
  },
  {
    "index": 10,
    "data": [
      {
        "row": 1001,
        "fromD": "2023/06/23",
        "toD": "2023/06/28"
      },
      {
        "row": 1201,
        "fromD": "2023/07/05",
        "toD": "2023/07/10"
      },
      {
        "row": 1401,
        "fromD": "2023/06/17",
        "toD": "2023/06/22"
      },
      {
        "row": 1601,
        "fromD": "2023/06/29",
        "toD": "2023/07/04"
      },
      {
        "row": 1801,
        "fromD": "2023/07/11",
        "toD": "2023/07/16"
      }
    ]
  },
  {
    "index": 11,
    "data": [
      {
        "row": 1,
        "fromD": "2023/07/17",
        "toD": "2023/07/22"
      },
      {
        "row": 201,
        "fromD": "",
        "toD": ""
      },
      {
        "row": 401,
        "fromD": "2023/07/23",
        "toD": "2023/07/28"
      },
      {
        "row": 601,
        "fromD": "",
        "toD": ""
      },
      {
        "row": 801,
        "fromD": "2023/07/29",
        "toD": "2023/08/03"
      }
    ]
  }
]



// importDataHistory()