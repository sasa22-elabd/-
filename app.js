/***********************************************
 *  العناصر
 ***********************************************/
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const goToSensorBtn = document.getElementById('goToSensor');

const autoBtn = document.getElementById('autoBtn');
const manualBtn = document.getElementById('manualBtn');
const manualControls = document.getElementById('manualControls');
const manualRange = document.getElementById('manualRange');

const aqiValueEl = document.getElementById('aqiValue');
const aqiStatusEl = document.getElementById('aqiStatus');
const hintText = document.getElementById('hintText');
const fanEl = document.getElementById('fan');

const smokeVal = document.getElementById('smokeVal');
const coVal = document.getElementById('coVal');
const pmVal = document.getElementById('pmVal');
const tempVal = document.getElementById('tempVal');
const humVal = document.getElementById('humVal');
const mqVal = document.getElementById('mqVal');

const logBox = document.getElementById('logBox');
const smokeLayer = document.getElementById('smokeLayer');
async function checkRealSensorConnection() {
  try {
    // طلب الإذن بالاتصال بالمنفذ
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable.getReader();

    // نقرأ أول قيمة جاية من الأردوينو
    const { value, done } = await inputStream.read();

    if (value && value.includes("MQ-135")) {
      realSensorConnected = true;
      alert("✅ تم اكتشاف الحساس الحقيقي MQ-135 بنجاح!");
    } else {
      realSensorConnected = false;
      alert("❌ لم يتم العثور على حساس MQ-135!");
    }

    await port.close();
  } catch (err) {
    realSensorConnected = false;
    alert("⚠️ لا يوجد جهاز متصل أو تم رفض الإذن!");
  }
}

let realSensorConnected = false;

/***********************************************
 *  الأصوات
 ***********************************************/
const alarm = new Audio("https://www.fesliyanstudios.com/play-mp3/4385");
alarm.volume = 0.4;

const fanSound = new Audio("https://www.fesliyanstudios.com/play-mp3/5632");
fanSound.loop = true;
fanSound.volume = 0.2;

/***********************************************
 *  المتغيرات
 ***********************************************/
let running = false;
let autoMode = true;
let intervalId = null;

const maxPoints = 30;
let times = [];
let aqiData = [];

/***********************************************
 *  الجرافيك
 ***********************************************/
const ctx = document.getElementById('aqiChart').getContext('2d');
const aqiChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: times,
    datasets: [{
      label: "AQI",
      data: aqiData,
      borderColor: '#8a2be2',
      borderWidth: 2,
      tension: 0.25
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#bbb" } },
      y: { ticks: { color: "#bbb" } }
    }
  }
});

/***********************************************
 *  تسجيل السجل
 ***********************************************/
function log(message) {
  const t = new Date().toLocaleTimeString();
  logBox.innerHTML = `<p>[${t}] ${message}</p>` + logBox.innerHTML;
}

/***********************************************
 *  تحديث حالة الهواء
 ***********************************************/
function updateStatus(aqi) {

  if (aqi < 50) {
    aqiStatusEl.innerText = "جيد جدًا";
    hintText.innerText = "الهواء نظيف وآمن.";
    smokeLayer.style.opacity = 0;
    fanEl.style.display = "none";
    fanSound.pause();
    document.body.classList.remove("shake");
  }

  else if (aqi < 120) {
    aqiStatusEl.innerText = "متوسط";
    hintText.innerText = "الهواء مقبول ولكن ليس مثاليًا.";
    smokeLayer.style.opacity = 0.2;
    fanEl.style.display = "none";
    fanSound.pause();
    document.body.classList.remove("shake");
  }

  else {
    aqiStatusEl.innerText = "خطر";
    hintText.innerText = "تشغيل المروحة! تلوث عالي!";
    smokeLayer.style.opacity = 0.55;
    fanEl.style.display = "block";
    fanSound.play();
    alarm.play();
    document.body.classList.add("shake");
  }
}

/***********************************************
 *  توليد بيانات عشوائية
 ***********************************************/
function generateRandomData() {
  return {
    smoke: Math.floor(Math.random() * 300),
    co: Math.floor(Math.random() * 500),
    pm: Math.floor(Math.random() * 200),
    temp: (20 + Math.random() * 10).toFixed(1),
    hum: (30 + Math.random() * 30).toFixed(1),
    mq: Math.random() > 0.7 ? "متصل" : "غير متصل"
  };
}

/***********************************************
 *  تحديث واجهة العرض
 ***********************************************/
function updateScreen(data) {
  smokeVal.innerText = data.smoke;
  coVal.innerText = data.co;
  pmVal.innerText = data.pm;
  tempVal.innerText = data.temp;
  humVal.innerText = data.hum;
  mqVal.innerText = data.mq;

  let aqi = Math.floor((data.smoke + data.co + data.pm) / 3);

  if (!autoMode) aqi = manualRange.value;

  aqiValueEl.innerText = aqi;
  updateStatus(aqi);

  let angle = (aqi / 300) * 360;
  document.getElementById("aqiCircle").style.background =
    `conic-gradient(#8a2be2 ${angle}deg, rgba(255,255,255,0.03) 0deg)`;

  let now = new Date().toLocaleTimeString();
  times.push(now);
  aqiData.push(aqi);

  if (times.length > maxPoints) {
    times.shift();
    aqiData.shift();
  }
  aqiChart.update();

  log("📈 قراءة جديدة → AQI = " + aqi);
}

/***********************************************
 *  تشغيل النظام
 ***********************************************/
startBtn.onclick = () => {
  if (running) return;
  running = true;
  log("✔ تم تشغيل النظام");

  intervalId = setInterval(() => {
    const data = autoMode ? generateRandomData() : {
      smoke: manualRange.value * 0.8,
      co: manualRange.value * 5,
      pm: manualRange.value * 0.7,
      temp: 28,
      hum: 60,
      mq: "يدوي"
    };

    updateScreen(data);
  }, 1500);
};

/***********************************************
 *  إيقاف النظام
 ***********************************************/
stopBtn.onclick = () => {
  if (!running) return;
  running = false;
  clearInterval(intervalId);

  fanEl.style.display = "none";
  smokeLayer.style.opacity = 0;
  fanSound.pause();
  alarm.pause();
  document.body.classList.remove("shake");

  log("✖ تم إيقاف النظام");
};

/***********************************************
 *  لقطة
 ***********************************************/
snapshotBtn.onclick = () => {
  log("📸 لقطة تم أخذها عند " + new Date().toLocaleTimeString());
};

/***********************************************
 *  الوضع التلقائي / اليدوي
 ***********************************************/
autoBtn.onclick = () => {
  autoMode = true;
  manualControls.style.display = "none";
  autoBtn.classList.add("active");
  manualBtn.classList.remove("active");
  log("⚡ الوضع التلقائي مُفعّل");
};

manualBtn.onclick = () => {
  autoMode = false;
  manualControls.style.display = "block";
  manualBtn.classList.add("active");
  autoBtn.classList.remove("active");
  log("⚡ الوضع اليدوي مُفعّل");
};

/***********************************************
 *  التحقق من الحساس الحقيقي قبل الدخول
 ***********************************************/
goToSensorBtn.onclick = () => {
  if (!realSensorConnected) {
    alert("⚠️ الحساس الحقيقي غير متصل! قم بتوصيله أولاً.");
    return;
  }
  window.location.href = "sensor.html";
};

/***********************************************
 *  شاشة البوت
 ***********************************************/
const bootScreen = document.getElementById("bootScreen");
const bootText = document.getElementById("bootText");
const enterBtn = document.getElementById("enterBtn");

setTimeout(() => bootText.innerText = "Loading Sensors…", 1000);
setTimeout(() => bootText.innerText = "Calibrating System…", 2000);

enterBtn.onclick = () => {
  bootScreen.style.opacity = 0;
  setTimeout(() => bootScreen.style.display = "none", 600);
};
