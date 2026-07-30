import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


/*
====================================================
FIREBASE CONFIGURATION
====================================================

Firebase project create pannitu,
inga un Firebase details paste pannanum.
*/

const firebaseConfig = {

  apiKey: "AIzaSyBkInnXjADu4B2uqika7Ujm3493GduMUv0",
    authDomain: "aaru-auto-pump-technologies.firebaseapp.com",
    databaseURL: "https://aaru-auto-pump-technologies-default-rtdb.firebaseio.com",
    projectId: "aaru-auto-pump-technologies",
    storageBucket: "aaru-auto-pump-technologies.firebasestorage.app",
    messagingSenderId: "337562030454",
    appId: "1:337562030454:web:10a3570055367d2dd66a57",
    measurementId: "G-TS1ZF2ZKVV"
  };


const firebaseApp =
  initializeApp(firebaseConfig);

const db =
  getDatabase(firebaseApp);


/*
====================================================
DEFAULT ZONES
====================================================
*/

let data = {

  zones: {

    "Zone A": [

      "Sheet Cutting Machine",

      "Rolling Machine",

      "Linear Welding 1",

      "Linear Welding 2",

      "Bead Remover",

      "Ovality Remover"

    ],

    "Zone B": [],

    "Zone C": []

  },

  production: {},

  manpower: {},

  capacity: {},

  downtime: {},

  quality: {}

};


/*
====================================================
LOAD DATA
====================================================
*/

const databaseRef =
  ref(db, "AARU_AUTO_PUMP_DATA");


onValue(databaseRef, snapshot => {

  if (snapshot.exists()) {

    data = snapshot.val();

  }

  renderAll();

  document.getElementById(
    "saveStatus"
  ).innerText = "☁️ Saved";

});


/*
====================================================
SAVE DATA
====================================================
*/

async function saveData() {

  await set(
    databaseRef,
    data
  );

  document.getElementById(
    "saveStatus"
  ).innerText = "☁️ Saved";

  renderAll();

}


/*
====================================================
DATE
====================================================
*/

function today() {

  return new Date()
    .toISOString()
    .split("T")[0];

}


document.getElementById(
  "pDate"
).value = today();


document.getElementById(
  "mDate"
).value = today();


document.getElementById(
  "dtDate"
).value = today();


document.getElementById(
  "qDate"
).value = today();


/*
====================================================
PAGE
====================================================
*/

window.showPage = function(page) {

  document
    .querySelectorAll(".page")
    .forEach(x =>
      x.classList.remove("active")
    );

  document
    .getElementById(page)
    .classList.add("active");

};


/*
====================================================
ZONE DROPDOWN
====================================================
*/

function fillZones(id) {

  const select =
    document.getElementById(id);

  select.innerHTML = "";

  Object.keys(data.zones)
    .forEach(zone => {

      select.innerHTML +=
        `<option value="${zone}">
          ${zone}
        </option>`;

    });

}


/*
====================================================
MACHINE DROPDOWN
====================================================
*/

function fillMachines(
  zoneId,
  machineId
) {

  const zone =
    document.getElementById(zoneId).value;

  const select =
    document.getElementById(machineId);

  select.innerHTML = "";

  (data.zones[zone] || [])
    .forEach(machine => {

      select.innerHTML +=
        `<option value="${machine}">
          ${machine}
        </option>`;

    });

}


/*
====================================================
PRODUCTION FLOW
====================================================
*/

function getMachines(zone) {

  return data.zones[zone] || [];

}


/*
Opening stock logic:

First machine:
previous day's closing stock.

Next machines:
previous process closing WIP.

Closing:

Opening + Achieved - Plan

*/

function getOpeningStock(
  zone,
  machine,
  date
) {

  const machines =
    getMachines(zone);

  const index =
    machines.indexOf(machine);


  /*
  First process
  */

  if (index === 0) {

    let last = 0;

    Object.values(
      data.production
    ).forEach(row => {

      if (
        row.zone === zone &&
        row.machine === machine &&
        row.date < date
      ) {

        last =
          Math.max(
            Number(row.opening || 0) +
            Number(row.achieved || 0) -
            Number(row.plan || 0),
            0
          );

      }

    });

    return last;

  }


  /*
  Previous process
  */

  const previousMachine =
    machines[index - 1];


  let previousAchieved = 0;

  Object.values(
    data.production
  ).forEach(row => {

    if (
      row.zone === zone &&
      row.machine === previousMachine &&
      row.date === date
    ) {

      previousAchieved =
        Number(row.achieved || 0);

    }

  });


  return previousAchieved;

}


/*
====================================================
SAVE PRODUCTION
====================================================
*/

window.saveProduction =
async function() {

  const date =
    document.getElementById(
      "pDate"
    ).value;

  const zone =
    document.getElementById(
      "pZone"
    ).value;

  const machine =
    document.getElementById(
      "pMachine"
    ).value;

  const plan =
    Number(
      document.getElementById(
        "pPlan"
      ).value || 0
    );

  const achieved =
    Number(
      document.getElementById(
        "pAchieved"
      ).value || 0
    );

  const remarks =
    document.getElementById(
      "pRemarks"
    ).value.trim();


  /*
  Remarks mandatory
  */

  if (
    achieved < plan &&
    remarks === ""
  ) {

    alert(
      "Plan-ஐ விட Achieved குறைவாக உள்ளது. Remarks கட்டாயம்."
    );

    return;

  }


  const id =
    date +
    "_" +
    zone +
    "_" +
    machine;


  data.production[id] = {

    date,

    zone,

    machine,

    opening:
      getOpeningStock(
        zone,
        machine,
        date
      ),

    plan,

    achieved,

    balance:
      Math.max(
        plan - achieved,
        0
      ),

    closing:
      Math.max(
        getOpeningStock(
          zone,
          machine,
          date
        ) +
        achieved -
        plan,
        0
      ),

    remarks

  };


  await saveData();

};


/*
====================================================
MANPOWER
====================================================
*/

window.saveManpower =
async function() {

  const date =
    document.getElementById(
      "mDate"
    ).value;

  const zone =
    document.getElementById(
      "mZone"
    ).value;

  const machine =
    document.getElementById(
      "mMachine"
    ).value;

  const required =
    Number(
      document.getElementById(
        "mRequired"
      ).value || 0
    );

  const available =
    Number(
      document.getElementById(
        "mAvailable"
      ).value || 0
    );


  const id =
    Date.now();


  data.manpower[id] = {

    date,
    zone,
    machine,
    required,
    available,

    shortage:
      Math.max(
        required - available,
        0
      )

  };


  await saveData();

};


/*
====================================================
CAPACITY
====================================================
*/

window.saveCapacity =
async function() {

  const zone =
    document.getElementById(
      "cZone"
    ).value;

  const machine =
    document.getElementById(
      "cMachine"
    ).value;

  const shift =
    Number(
      document.getElementById(
        "cShift"
      ).value || 0
    );

  const shifts =
    Number(
      document.getElementById(
        "cShifts"
      ).value || 0
    );


  data.capacity[
    zone + "_" + machine
  ] = {

    zone,
    machine,
    shift,
    shifts,

    day:
      shift * shifts

  };


  await saveData();

};


/*
====================================================
DOWNTIME
====================================================
*/

window.saveDowntime =
async function() {

  const id =
    Date.now();


  data.downtime[id] = {

    date:
      document.getElementById(
        "dtDate"
      ).value,

    zone:
      document.getElementById(
        "dtZone"
      ).value,

    machine:
      document.getElementById(
        "dtMachine"
      ).value,

    minutes:
      Number(
        document.getElementById(
          "dtMinutes"
        ).value || 0
      ),

    reason:
      document.getElementById(
        "dtReason"
      ).value

  };


  await saveData();

};


/*
====================================================
QUALITY
====================================================
*/

window.saveQuality =
async function() {

  const id =
    Date.now();


  data.quality[id] = {

    date:
      document.getElementById(
        "qDate"
      ).value,

    zone:
      document.getElementById(
        "qZone"
      ).value,

    machine:
      document.getElementById(
        "qMachine"
      ).value,

    produced:
      Number(
        document.getElementById(
          "qProduced"
        ).value || 0
      ),

    rejected:
      Number(
        document.getElementById(
          "qRejected"
        ).value || 0
      ),

    rework:
      Number(
        document.getElementById(
          "qRework"
        ).value || 0
      ),

    reason:
      document.getElementById(
        "qReason"
      ).value

  };


  await saveData();

};


/*
====================================================
ADD MACHINE
====================================================
*/

window.addMachine =
async function() {

  const zone =
    document.getElementById(
      "newZone"
    ).value.trim();

  const machine =
    document.getElementById(
      "newMachine"
    ).value.trim();

  const order =
    Number(
      document.getElementById(
        "newOrder"
      ).value || 1
    );


  if (!zone || !machine) {

    alert(
      "Zone மற்றும் Machine name கொடுக்கவும்."
    );

    return;

  }


  if (!data.zones[zone]) {

    data.zones[zone] = [];

  }


  data.zones[zone] =
    data.zones[zone]
      .filter(x => x !== machine);


  data.zones[zone]
    .splice(
      Math.max(order - 1, 0),
      0,
      machine
    );


  await saveData();

};


/*
====================================================
EXCEL EXPORT
====================================================
*/

window.exportExcel =
function() {

  const workbook =
    XLSX.utils.book_new();


  function addSheet(
    name,
    rows
  ) {

    const sheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      name.substring(0, 31)
    );

  }


  addSheet(
    "Production",
    Object.values(
      data.production
    )
  );


  addSheet(
    "Manpower",
    Object.values(
      data.manpower
    )
  );


  addSheet(
    "Capacity",
    Object.values(
      data.capacity
    )
  );


  addSheet(
    "Downtime",
    Object.values(
      data.downtime
    )
  );


  addSheet(
    "Quality",
    Object.values(
      data.quality
    )
  );


  XLSX.writeFile(
    workbook,
    "AARU_AUTO_PUMP_PRODUCTION.xlsx"
  );

};


/*
====================================================
RENDER
====================================================
*/

function renderAll() {

  [
    "pZone",
    "mZone",
    "cZone",
    "dtZone",
    "qZone"
  ]
  .forEach(fillZones);


  fillMachines(
    "pZone",
    "pMachine"
  );

  fillMachines(
    "mZone",
    "mMachine"
  );

  fillMachines(
    "cZone",
    "cMachine"
  );

  fillMachines(
    "dtZone",
    "dtMachine"
  );

  fillMachines(
    "qZone",
    "qMachine"
  );


  renderDashboard();

  renderProduction();

  renderManpower();

  renderCapacity();

  renderDowntime();

  renderQuality();

  renderMaster();

  renderReports();

}


/*
====================================================
DASHBOARD
====================================================
*/

function renderDashboard() {

  let plan = 0;

  let achieved = 0;


  Object.values(
    data.production
  )
  .forEach(row => {

    plan +=
      Number(row.plan || 0);

    achieved +=
      Number(row.achieved || 0);

  });


  const balance =
    Math.max(
      plan - achieved,
      0
    );


  const percent =
    plan
      ? ((achieved / plan) * 100)
          .toFixed(1)
      : 0;


  document.getElementById(
    "dPlan"
  ).innerText = plan;


  document.getElementById(
    "dAchieved"
  ).innerText = achieved;


  document.getElementById(
    "dBalance"
  ).innerText = balance;


  document.getElementById(
    "dPercent"
  ).innerText =
    percent + "%";


  const zones =
    document.getElementById(
      "zones"
    );


  zones.innerHTML = "";


  Object.keys(
    data.zones
  )
  .forEach(zone => {

    zones.innerHTML += `

      <div class="zone"
           onclick="selectZone('${zone}')">

        <h3>${zone}</h3>

        <p>
          ${
            data.zones[zone].length
          }
          Machines
        </p>

      </div>

    `;

  });


  const selectedZone =
    document.getElementById(
      "pZone"
    ).value;


  document.getElementById(
    "flow"
  ).innerHTML =
    getMachines(
      selectedZone
    )
    .map((machine, i, arr) =>
      `<div class="process">
        ${machine}
      </div>
      ${
        i < arr.length - 1
          ? "<b>→</b>"
          : ""
      }`
    )
    .join("");

}


/*
====================================================
ZONE SELECT
====================================================
*/

window.selectZone =
function(zone) {

  document.getElementById(
    "pZone"
  ).value = zone;

  fillMachines(
    "pZone",
    "pMachine"
  );

  renderDashboard();

};


/*
====================================================
PRODUCTION TABLE
====================================================
*/

function renderProduction() {

  const zone =
    document.getElementById(
      "pZone"
    ).value;

  const date =
    document.getElementById(
      "pDate"
    ).value;


  let html = `

  <table>

  <tr>

    <th>Machine</th>

    <th>Opening Stock</th>

    <th>Plan</th>

    <th>Achieved</th>

    <th>Balance</th>

    <th>Closing WIP</th>

    <th>Remarks</th>

  </tr>

  `;


  getMachines(zone)
    .forEach(machine => {

      const id =
        date +
        "_" +
        zone +
        "_" +
        machine;


      const row =
        data.production[id];


      if (!row) {

        html += `

        <tr>

          <td>${machine}</td>

          <td>
            ${getOpeningStock(
              zone,
              machine,
              date
            )}
          </td>

          <td>—</td>

          <td>—</td>

          <td>—</td>

          <td>—</td>

          <td>Not Entered</td>

        </tr>

        `;

        return;

      }


      html += `

      <tr>

        <td>
          <b>${machine}</b>
        </td>

        <td>
          ${row.opening}
        </td>

        <td>
          ${row.plan}
        </td>

        <td>
          ${row.achieved}
        </td>

        <td>
          ${row.balance}
        </td>

        <td>
          ${row.closing}
        </td>

        <td>
          ${row.remarks || "—"}
        </td>

      </tr>

      `;

    });


  html += "</table>";


  document.getElementById(
    "productionTable"
  ).innerHTML = html;

}


/*
====================================================
OTHER TABLES
====================================================
*/

function renderManpower() {

  let html = `
  <table>
  <tr>
  <th>Date</th>
  <th>Zone</th>
  <th>Machine</th>
  <th>Required</th>
  <th>Available</th>
  <th>Shortage</th>
  </tr>
  `;


  Object.values(
    data.manpower
  )
  .forEach(row => {

    html += `
    <tr>
      <td>${row.date}</td>
      <td>${row.zone}</td>
      <td>${row.machine}</td>
      <td>${row.required}</td>
      <td>${row.available}</td>
      <td>${row.shortage}</td>
    </tr>
    `;

  });


  html += "</table>";

  document.getElementById(
    "manpowerTable"
  ).innerHTML = html;

}


function renderCapacity() {

  let html = `
  <table>
  <tr>
  <th>Zone</th>
  <th>Machine</th>
  <th>/ Shift</th>
  <th>Shifts</th>
  <th>/ Day</th>
  </tr>
  `;


  Object.values(
    data.capacity
  )
  .forEach(row => {

    html += `
    <tr>
      <td>${row.zone}</td>
      <td>${row.machine}</td>
      <td>${row.shift}</td>
      <td>${row.shifts}</td>
      <td>${row.day}</td>
    </tr>
    `;

  });


  html += "</table>";

  document.getElementById(
    "capacityTable"
  ).innerHTML = html;

}


function renderDowntime() {

  let html = `
  <table>
  <tr>
  <th>Date</th>
  <th>Zone</th>
  <th>Machine</th>
  <th>Minutes</th>
  <th>Reason</th>
  </tr>
  `;


  Object.values(
    data.downtime
  )
  .forEach(row => {

    html += `
    <tr>
      <td>${row.date}</td>
      <td>${row.zone}</td>
      <td>${row.machine}</td>
      <td>${row.minutes}</td>
      <td>${row.reason}</td>
    </tr>
    `;

  });


  html += "</table>";

  document.getElementById(
    "downtimeTable"
  ).innerHTML = html;

}


function renderQuality() {

  let html = `
  <table>
  <tr>
  <th>Date</th>
  <th>Zone</th>
  <th>Machine</th>
  <th>Produced</th>
  <th>Rejected</th>
  <th>Rework</th>
  <th>Reason</th>
  </tr>
  `;


  Object.values(
    data.quality
  )
  .forEach(row => {

    html += `
    <tr>
      <td>${row.date}</td>
      <td>${row.zone}</td>
      <td>${row.machine}</td>
      <td>${row.produced}</td>
      <td>${row.rejected}</td>
      <td>${row.rework}</td>
      <td>${row.reason}</td>
    </tr>
    `;

  });


  html += "</table>";

  document.getElementById(
    "qualityTable"
  ).innerHTML = html;

}


function renderMaster() {

  let html = `
  <table>
  <tr>
  <th>Zone</th>
  <th>Order</th>
  <th>Machine</th>
  </tr>
  `;


  Object.keys(
    data.zones
  )
  .forEach(zone => {

    data.zones[zone]
      .forEach((machine, i) => {

        html += `
        <tr>
          <td>${zone}</td>
          <td>${i + 1}</td>
          <td>${machine}</td>
        </tr>
        `;

      });

  });


  html += "</table>";


  document.getElementById(
    "masterTable"
  ).innerHTML = html;

}


/*
====================================================
REPORT
====================================================
*/

function renderReports() {

  let html = `
  <table>
  <tr>
  <th>Date</th>
  <th>Zone</th>
  <th>Machine</th>
  <th>Plan</th>
  <th>Achieved</th>
  <th>Balance</th>
  <th>Achievement %</th>
  </tr>
  `;


  Object.values(
    data.production
  )
  .forEach(row => {

    const percent =
      row.plan
        ? (
          row.achieved /
          row.plan *
          100
        ).toFixed(1)
        : 0;


    html += `
    <tr>
      <td>${row.date}</td>
      <td>${row.zone}</td>
      <td>${row.machine}</td>
      <td>${row.plan}</td>
      <td>${row.achieved}</td>
      <td>${row.balance}</td>
      <td>${percent}%</td>
    </tr>
    `;

  });


  html += "</table>";


  document.getElementById(
    "reportTable"
  ).innerHTML = html;

}


/*
====================================================
ZONE CHANGE EVENTS
====================================================
*/

[
  "pZone",
  "mZone",
  "cZone",
  "dtZone",
  "qZone"
]
.forEach(id => {

  document.getElementById(
    id
  ).addEventListener(
    "change",
    () => {

      const machineId =
        id.replace(
          "Zone",
          "Machine"
        );

      fillMachines(
        id,
        machineId
      );

      renderAll();

    }
  );

});


/*
====================================================
START
====================================================
*/

renderAll();
