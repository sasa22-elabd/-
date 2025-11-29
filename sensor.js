const rSmoke=document.getElementById('rSmoke');
const rCO=document.getElementById('rCO');
const rPM=document.getElementById('rPM');
const rTemp=document.getElementById('rTemp');
const rHum=document.getElementById('rHum');
const rMQ=document.getElementById('rMQ');
const realLog=document.getElementById('realLog');

let realTimes=[], realAQI=[], maxPoints=30;

const rCtx=document.getElementById('realChart').getContext('2d');
const realChart=new Chart(rCtx,{type:'line',data:{labels:realTimes,datasets:[{label:"AQI",data:realAQI,borderColor:'#ff4500',borderWidth:2,tension:0.25}]},options:{scales:{x:{ticks:{color:"#777"}},y:{ticks:{color:"#777"}}}}});

function logReal(msg){ const p=document.createElement("p"); p.innerText=msg; realLog.appendChild(p); realLog.scrollTop=realLog.scrollHeight; }

function readRealSensor(){
  // هنا نضع كود التوصيل بالحساس الحقيقي Arduino
  // مثال محاكاة
  const data={smoke:Math.floor(Math.random()*300),co:Math.floor(Math.random()*500),pm:Math.floor(Math.random()*200),temp:(20+Math.random()*10).toFixed(1),hum:(30+Math.random()*30).toFixed(1),mq:"متصل"};
  rSmoke.innerText=data.smoke; rCO.innerText=data.co; rPM.innerText=data.pm; rTemp.innerText=data.temp; rHum.innerText=data.hum; rMQ.innerText=data.mq;
  let aqi=Math.floor((data.smoke+data.co+data.pm)/3);
  realTimes.push(new Date().toLocaleTimeString()); realAQI.push(aqi);
  if(realTimes.length>maxPoints){ realTimes.shift(); realAQI.shift(); }
  realChart.update();
  logReal("قراءة الحساس → AQI = "+aqi);
}

setInterval(readRealSensor,1500);
