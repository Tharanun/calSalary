let records = [];
let baseSalary = 20000;
let salaryWithdrawnMonths = {}; // เก็บว่าวันเดือนนี้ถอนเงินเดือนแล้วหรือยัง
let bonusTotal = 0;
let otTotal = 0;
let withdrawn = 0;

// เก็บประวัติถอนแยกตามเดือน
let withdrawHistory = {}; // ตัวอย่าง: { "2025-08": [ { type: "salary", amount: 20000 }, ... ] }

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;

  baseSalary = parseFloat(document.getElementById("baseSalary").value) || 20000;

  updateSummary();
});

function getCurrentMonth() {
  const date = document.getElementById("date").value || new Date().toISOString().split("T")[0];
  return date.slice(0, 7); // เช่น "2025-08"
}

function saveData() {
  const date = document.getElementById("date").value;
  const ot = parseInt(document.getElementById("ot").value) || 0;
  const otRate = parseFloat(document.getElementById("otRate").value) || 125;
  const bonus = parseFloat(document.getElementById("bonus").value) || 0;

  baseSalary = parseFloat(document.getElementById("baseSalary").value) || 20000;

  if (!date) {
    Swal.fire("⚠️ กรุณาเลือกวันที่ก่อน", "", "warning");
    return;
  }

  const otIncome = ot * otRate;
  const total = otIncome + bonus;

  records.push({ date, ot, otRate, bonus, total });
  renderTable();

  bonusTotal += bonus;
  otTotal += otIncome;
  updateSummary();

  document.getElementById("ot").value = "0";
  Swal.fire("✅ บันทึกสำเร็จ!", "", "success");
}

function renderTable() {
  const table = document.getElementById("recordTable");
  table.innerHTML = "";
  records.forEach((rec, i) => {
    table.innerHTML += `
      <tr>
        <td>${rec.date}</td>
        <td>${rec.ot}</td>
        <td>${rec.otRate}</td>
        <td>${rec.bonus}</td>
        <td>${rec.total}</td>
        <td><button class="btn btn-xs btn-error" onclick="confirmDelete(${i})">ลบ</button></td>
      </tr>
    `;
  });
}

function confirmDelete(i) {
  Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "ลบรายการนี้",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ใช่, ลบเลย!",
    cancelButtonText: "ยกเลิก"
  }).then(result => {
    if (result.isConfirmed) {
      deleteRecord(i);
      Swal.fire("ลบแล้ว!", "", "success");
    }
  });
}

function deleteRecord(i) {
  bonusTotal -= records[i].bonus;
  otTotal -= records[i].ot * records[i].otRate;
  records.splice(i, 1);
  renderTable();
  updateSummary();
}

function clearData() {
  Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "ลบข้อมูลทั้งหมด",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ใช่, ลบเลย!",
    cancelButtonText: "ยกเลิก"
  }).then(result => {
    if (result.isConfirmed) {
      records = [];
      bonusTotal = 0;
      otTotal = 0;
      withdrawHistory = {};
      renderTable();
      updateSummary();
      renderWithdrawHistory();
      Swal.fire("ลบแล้ว!", "", "success");
    }
  });
}

function withdrawMenu() {
  Swal.fire({
    title: "เลือกประเภทการถอน",
    input: "select",
    inputOptions: {
      salary: "💵 เงินเดือน",
      bonus: "🎁 โบนัส",
      ot: "⏱️ OT"
    },
    inputPlaceholder: "เลือก...",
    showCancelButton: true
  }).then(res => {
    if (!res.isConfirmed) return;
    const month = getCurrentMonth();

    if (!withdrawHistory[month]) withdrawHistory[month] = [];

    let amount = 0;
    if (res.value === "salary") {
      if (!salaryWithdrawnMonths[month]) {
        amount = baseSalary;
        withdrawn += amount;
        salaryWithdrawnMonths[month] = true;
        withdrawHistory[month].push({ type: "เงินเดือน", amount });
      } else {
        Swal.fire("⚠️ เดือนนี้ถอนเงินเดือนแล้ว", "", "warning");
        return;
      }
    } else if (res.value === "bonus" && bonusTotal > 0) {
      amount = bonusTotal;
      withdrawn += amount;
      withdrawHistory[month].push({ type: "โบนัส", amount });
      bonusTotal = 0;
    } else if (res.value === "ot" && otTotal > 0) {
      amount = otTotal;
      withdrawn += amount;
      withdrawHistory[month].push({ type: "OT", amount });
      otTotal = 0;
    } else {
      Swal.fire("⚠️ ไม่มีเงินให้ถอน", "", "warning");
      return;
    }

    updateSummary();
    renderWithdrawHistory();
  });
}

function updateSummary() {
  const month = getCurrentMonth();
  const salaryThisMonth = salaryWithdrawnMonths[month] ? 0 : baseSalary;

  document.getElementById("salary").innerText = salaryThisMonth.toFixed(2);
  document.getElementById("bonusTotal").innerText = bonusTotal.toFixed(2);
  document.getElementById("otTotal").innerText = otTotal.toFixed(2);
  document.getElementById("withdrawn").innerText = withdrawn.toFixed(2);
}

function renderWithdrawHistory() {
  const container = document.getElementById("withdrawLog");
  container.innerHTML = "";

  Object.keys(withdrawHistory).sort().forEach(month => {
    const monthDiv = document.createElement("div");
    monthDiv.classList.add("mb-4");
    monthDiv.innerHTML = `<h5 class="font-semibold">${month}</h5>`;

    const table = document.createElement("table");
    table.classList.add("table", "table-zebra", "w-full", "mb-2");
    table.innerHTML = `
      <thead>
        <tr>
          <th>รายการ</th>
          <th>จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    let monthTotal = 0;
    withdrawHistory[month].forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item.type}</td><td>${item.amount.toFixed(2)}</td>`;
      tbody.appendChild(tr);
      monthTotal += item.amount;
    });

    const trTotal = document.createElement("tr");
    trTotal.innerHTML = `<td class="font-bold">รวม</td><td class="font-bold">${monthTotal.toFixed(2)}</td>`;
    tbody.appendChild(trTotal);

    monthDiv.appendChild(table);
    container.appendChild(monthDiv);
  });
}

function resetWithdraw() {
  withdrawn = 0;
  salaryWithdrawnMonths = {};
  withdrawHistory = {};
  document.getElementById("withdrawLog").innerHTML = "";
  updateSummary();
}

document.getElementById("themeToggle").addEventListener("change", (e) => {
  document.documentElement.setAttribute("data-theme", e.target.checked ? "dark" : "light");
});
