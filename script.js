const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
const pct=(v,d=1)=>`${(Number.isFinite(v)?v:0).toFixed(d)}%`;
const num=id=>{const v=Number($(id)?.value);return Number.isFinite(v)?Math.max(0,v):0};
const bool=id=>Boolean($(id)?.checked);
const names={conventional:"Conventional",fha:"FHA",va:"VA",usda:"USDA",custom:"Custom"};

function payment(p,rate,years){
  if(p<=0)return 0;
  const n=Math.max(1,Math.round(years*12)),r=Math.max(0,rate)/1200;
  if(!r)return p/n;
  const f=(1+r)**n;
  return p*r*f/(f-1);
}

function balanceAfter(p,rate,years,m){
  const pay=payment(p,rate,years),r=Math.max(0,rate)/1200;
  if(!r)return Math.max(0,p-pay*m);
  const f=(1+r)**m;
  return Math.max(0,p*f-pay*((f-1)/r));
}

function monthsToLtv(p,rate,years,value,target){
  for(let m=1;m<=years*12;m++) if(balanceAfter(p,rate,years,m)<=value*target/100)return m;
  return years*12;
}

function duration(months){
  if(!Number.isFinite(months)||months<=0)return "—";
  const y=Math.floor(months/12),m=months%12;
  return y&&m?`${y} yr ${m} mo`:y?`${y} yr`:`${m} mo`;
}

function program(type,price,down,term,rate){
  const base=Math.max(0,price*(1-Math.min(100,down)/100));
  const ltv=price?base/price*100:0;
  let upfrontRate=0,annualRate=0,finance=false,months=0,descriptor="";
  if(type==="conventional"){
    annualRate=bool("autoPmi")&&ltv>80?num("pmiRate"):0;
    months=annualRate?monthsToLtv(base,rate,term,price,num("pmiStopLtv")):0;
    descriptor=annualRate?`PMI est. ${pct(annualRate,2)}`:"No PMI entered";
  }else if(type==="fha"){
    upfrontRate=num("fhaUpfront"); finance=bool("financeFhaFee");
    const threshold=num("fhaThreshold")||832750,over=base>threshold;
    if(term>15) annualRate=over?(ltv>95?.75:.70):(ltv>95?.55:.50);
    else annualRate=over?(ltv<=78?.15:ltv<=90?.40:.65):(ltv>90?.40:.15);
    months=ltv<=90?Math.min(term*12,132):term*12;
    descriptor=`FHA MIP est. ${pct(annualRate,2)}`;
  }else if(type==="va"){
    finance=bool("financeVaFee");
    if(bool("vaExempt"))upfrontRate=0;
    else if(down>=10)upfrontRate=1.25;
    else if(down>=5)upfrontRate=1.5;
    else upfrontRate=$("vaUse").value==="subsequent"?3.3:2.15;
    descriptor=upfrontRate?`VA funding fee ${pct(upfrontRate,2)}`:"VA funding-fee exempt";
  }else if(type==="usda"){
    upfrontRate=num("usdaUpfront"); annualRate=num("usdaAnnual"); finance=bool("financeUsdaFee"); months=term*12;
    descriptor=`USDA annual fee ${pct(annualRate,2)}`;
  }else{
    upfrontRate=num("customUpfront"); annualRate=num("customAnnual"); finance=bool("financeCustomFee"); months=annualRate?term*12:0;
    descriptor=annualRate?`Annual fee ${pct(annualRate,2)}`:"Custom assumptions";
  }
  const upfront=base*upfrontRate/100;
  return {type,base,total:base+(finance?upfront:0),ltv,upfrontRate,upfront,cashUpfront:finance?0:upfront,annualRate,months,descriptor,finance};
}

function monthlyFee(d,month,rate,term){
  if(!d.annualRate||month>d.months)return 0;
  if(d.type==="conventional")return d.base*d.annualRate/1200;
  return balanceAfter(d.total,rate,term,Math.max(0,month-1))*d.annualRate/1200;
}

function scenario(price,down,rate,term,type,points=0){
  const d=program(type,price,down,term,rate);
  const pi=payment(d.total,rate,term),tax=price*num("taxPct")/1200,ins=num("insurance")/12;
  const fee=monthlyFee(d,1,rate,term),extras=num("hoa")+num("flood")+num("otherMonthly");
  const total=pi+tax+ins+fee+extras;
  const downDollar=price*Math.min(100,down)/100,closing=price*num("closingPct")/100;
  const pointCost=d.total*points/100,prepaids=num("prepaids"),other=num("otherUpfront"),credits=num("credits");
  const cash=Math.max(0,downDollar+closing+d.cashUpfront+pointCost+prepaids+other-credits);
  return {d,pi,tax,ins,fee,extras,total,downDollar,closing,pointCost,prepaids,other,credits,cash};
}

function steps(t){return t==="1-0"?[1]:t==="2-1"?[2,1]:t==="3-2-1"?[3,2,1]:[]}
function buyName(t){return t==="1-0"?"1/0 Buydown":t==="2-1"?"2/1 Buydown":t==="3-2-1"?"3/2/1 Buydown":"No Buydown"}

function amortize(principal,rate,years,extraMonthly=0,extraOnce=0,extraMonth=12){
  const scheduled=payment(principal,rate,years),r=rate/1200,max=years*12;
  let bal=principal,interestTotal=0,month=0; const rows=[];
  while(bal>.005&&month<max+1){
    month++; const interest=r?bal*r:0;
    let principalPart=Math.max(0,scheduled-interest),extra=extraMonthly+(month===Math.round(extraMonth)?extraOnce:0);
    if(principalPart+extra>bal){const over=principalPart+extra-bal;if(extra>=over)extra-=over;else{principalPart-=over-extra;extra=0}}
    bal=Math.max(0,bal-principalPart-extra); interestTotal+=interest;
    rows.push({month,payment:principalPart+interest+extra,principal:principalPart,interest,extra,balance:bal});
  }
  return {rows,totalInterest:interestTotal,months:rows.length};
}

function chart(a,b){
  const svg=$("balanceChart"),W=640,H=210,L=50,R=18,T=18,B=32,maxM=Math.max(a.rows.length,b.rows.length,1),maxBal=Math.max(a.rows[0]?.balance||0,b.rows[0]?.balance||0,1);
  const x=m=>L+(m/maxM)*(W-L-R), y=v=>T+(1-v/maxBal)*(H-T-B);
  const points=rows=>{const step=Math.max(1,Math.floor(rows.length/80)),out=[];for(let i=0;i<rows.length;i+=step)out.push(`${x(rows[i].month).toFixed(1)},${y(rows[i].balance).toFixed(1)}`);const last=rows.at(-1);if(last)out.push(`${x(last.month).toFixed(1)},${y(last.balance).toFixed(1)}`);return out.join(" ")};
  svg.innerHTML=`<line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" stroke="#cbd4df"/><line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#cbd4df"/><polyline points="${points(a.rows)}" fill="none" stroke="#697586" stroke-width="2.5"/><polyline points="${points(b.rows)}" fill="none" stroke="#2f7664" stroke-width="3"/><text x="4" y="20" font-size="11" fill="#697586">${money(maxBal)}</text><text x="${L}" y="${H-8}" font-size="11" fill="#697586">Start</text><text x="${W-R-38}" y="${H-8}" font-size="11" fill="#697586">Payoff</text>`;
}

function showOptions(){
  const type=$("loanType").value;
  ["conventional","fha","va","usda","custom"].forEach(n=>$(`${n}Options`)?.classList.toggle("hidden",n!==type));
  $("programBadge").textContent=names[type];
}

function preset(type){
  if(type==="conventional"){$("downPct").value=10;$("autoPmi").checked=true}
  if(type==="fha")$("downPct").value=3.5;
  if(type==="va"||type==="usda")$("downPct").value=0;
}

function saveUrl(){
  const p=new URLSearchParams();
  document.querySelectorAll("input,select").forEach(el=>{if(el.id)p.set(el.id,el.type==="checkbox"?(el.checked?"1":"0"):el.value)});
  history.replaceState(null,"",`${location.pathname}?${p.toString()}`);
}

function loadUrl(){
  const p=new URLSearchParams(location.search); if(![...p.keys()].length)return false;
  document.querySelectorAll("input,select").forEach(el=>{if(!el.id||!p.has(el.id))return; if(el.type==="checkbox")el.checked=p.get(el.id)==="1";else el.value=p.get(el.id)});
  return true;
}

function update(){
  showOptions();
  const type=$("loanType").value,price=num("price"),down=Math.min(100,num("downPct")),rate=num("rate"),term=Math.max(1,num("term"));
  const cur=scenario(price,down,rate,term,type),d=cur.d;
  $("downDollarHint").textContent=`${money(cur.downDollar)} down • ${money(d.base)} base loan`;
  $("loanDescriptor").textContent=d.descriptor; $("baseLoan").textContent=money(d.base); $("loanAmount").textContent=money(d.total);
  $("piPayment").textContent=`${money(cur.pi)}/mo`; $("taxPayment").textContent=`${money(cur.tax)}/mo`; $("insPayment").textContent=`${money(cur.ins)}/mo`;
  $("miPayment").textContent=`${money(cur.fee)}/mo`; $("otherPayment").textContent=`${money(cur.extras)}/mo`; $("upfrontFeeDisplay").textContent=`${money(d.upfront)}${d.finance&&d.upfront?" financed":""}`;
  $("fullPayment").textContent=`${money(cur.total)}/mo`;
  $("miDuration").textContent=d.annualRate?(type==="conventional"?`Estimated PMI: ${pct(d.annualRate,2)} annually, scheduled stop near ${duration(d.months)} based on entered LTV threshold.`:type==="fha"?`Estimated FHA annual MIP: ${pct(d.annualRate,2)} for approximately ${duration(d.months)}.`:type==="usda"?`Estimated USDA annual guarantee fee: ${pct(d.annualRate,2)}; modeled on declining balance.`:`Estimated annual program fee: ${pct(d.annualRate,2)}.`):"No monthly mortgage-insurance / guarantee fee is included.";

  const bType=$("buydown").value,cuts=steps(bType),fixed=cur.tax+cur.ins+cur.fee+cur.extras; let subsidy=0,rows=[];
  if(!cuts.length)rows=[{label:"All Years",rate,payment:cur.total,savings:0}];
  else{cuts.forEach((cut,i)=>{const rr=Math.max(0,rate-cut),p=payment(d.total,rr,term)+fixed,s=Math.max(0,cur.total-p);subsidy+=s*12;rows.push({label:`Year ${i+1}`,rate:rr,payment:p,savings:s})});rows.push({label:`Year ${cuts.length+1}+`,rate,payment:cur.total,savings:0})}
  $("buydownName").textContent=buyName(bType); const maxP=Math.max(...rows.map(r=>r.payment),1);
  $("buydownRows").innerHTML=rows.map(r=>`<div><div class="buydown-row-top"><span><strong>${r.label}</strong><span class="rate-text"> @ ${pct(r.rate,3)}</span></span><span><strong>${money(r.payment)}/mo</strong>${r.savings?`<span class="saving"> (${money(r.savings)} saved)</span>`:""}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,r.payment/maxP*100)}%"></div></div></div>`).join("");
  $("subsidyCost").textContent=money(subsidy);

  $("downDollar").textContent=money(cur.downDollar); $("closingDollar").textContent=money(cur.closing); $("programFeeCash").textContent=money(d.cashUpfront);
  $("prepaidDollar").textContent=money(cur.prepaids); $("otherUpfrontDollar").textContent=money(cur.other); $("creditDollar").textContent=`− ${money(cur.credits)}`; $("cashClose").textContent=money(cur.cash);

  const income=num("income"),debts=num("debts");
  $("housingRatio").textContent=income?pct(cur.total/income*100):"—"; $("dti").textContent=income?pct((cur.total+debts)/income*100):"—";
  $("incomeAfterHousing").textContent=income?money(income-cur.total):"—"; $("incomeAfterDebts").textContent=income?money(income-cur.total-debts):"—";

  const perma=scenario(price,down,num("permanentRate"),term,type,num("permanentPoints")),alt=scenario(price,Math.min(100,num("altDownPct")),rate,term,type);
  const tempCash=cur.cash+($("buydownFunding").value==="buyer"?subsidy:0),yr1=rows[0]?.payment??cur.total;
  const comps=[
    ["Standard",`${pct(rate,3)} / ${pct(down,1)} down`,cur.total,cur.cash],
    [cuts.length?`${buyName(bType)} — Yr 1`:"Temporary Buydown",cuts.length?`${pct(rows[0].rate,3)} Yr 1`:"Not selected",cuts.length?yr1:cur.total,cuts.length?tempCash:cur.cash],
    ["Permanent Rate Buydown",`${pct(num("permanentRate"),3)} / ${pct(num("permanentPoints"),3)} pts`,perma.total,perma.cash],
    ["Larger Down Payment",`${pct(rate,3)} / ${pct(Math.min(100,num("altDownPct")),1)} down`,alt.total,alt.cash]
  ];
  $("comparisonBody").innerHTML=comps.map(s=>{const delta=s[2]-cur.total,cls=delta<-.5?"positive":delta>.5?"negative":"",txt=Math.abs(delta)<.5?"—":`${delta>0?"+":"−"}${money(Math.abs(delta))}`;return `<tr><td><strong>${s[0]}</strong></td><td>${s[1]}</td><td>${money(s[2])}/mo</td><td>${money(s[3])}</td><td class="${cls}">${txt}</td></tr>`}).join("");

  const scheduled=amortize(d.total,rate,term),extra=amortize(d.total,rate,term,num("extraMonthly"),num("extraOnce"),Math.max(1,num("extraOnceMonth")));
  $("scheduledPayoff").textContent=duration(scheduled.months); $("extraPayoff").textContent=duration(extra.months);
  $("scheduledInterest").textContent=money(scheduled.totalInterest); $("extraInterest").textContent=money(extra.totalInterest);
  $("interestSaved").textContent=money(Math.max(0,scheduled.totalInterest-extra.totalInterest)); $("timeSaved").textContent=duration(Math.max(0,scheduled.months-extra.months));
  $("payoffBadge").textContent=num("extraMonthly")||num("extraOnce")?"Extra-payment strategy on":"No extra principal";
  $("amortizationBody").innerHTML=extra.rows.slice(0,12).map(r=>`<tr><td>${r.month}</td><td>${money(r.payment)}</td><td>${money(r.principal)}</td><td>${money(r.interest)}</td><td>${money(r.extra)}</td><td>${money(r.balance)}</td></tr>`).join("");
  chart(scheduled,extra);

  const warn=[];
  if(num("downPct")>100)warn.push("Down payment was capped at 100%.");
  if(rate===0)warn.push("A 0% note rate is being modeled.");
  if(type==="fha"&&down<3.5)warn.push("FHA is modeled below the common 3.5% down level; verify eligibility.");
  if(type==="usda"&&down>0)warn.push("USDA is commonly used with 0% down; your entered down payment is still being modeled.");
  if(num("permanentRate")>=rate&&num("permanentPoints")>0)warn.push("Permanent-bydown points are entered without a lower rate.");
  $("validation").textContent=warn.join(" ");
  saveUrl();
}

const defaults={loanType:"conventional",price:500000,downPct:10,rate:6.5,term:30,buydown:"none",buydownFunding:"seller",autoPmi:true,pmiRate:.5,pmiStopLtv:78,fhaUpfront:1.75,fhaThreshold:832750,financeFhaFee:true,vaUse:"first",vaExempt:false,financeVaFee:true,usdaUpfront:1,usdaAnnual:.35,financeUsdaFee:true,customUpfront:0,customAnnual:0,financeCustomFee:true,taxPct:1,insurance:1500,hoa:0,flood:0,otherMonthly:0,closingPct:2.5,credits:0,prepaids:0,otherUpfront:0,income:10000,debts:500,permanentRate:6,permanentPoints:1,altDownPct:20,extraMonthly:0,extraOnce:0,extraOnceMonth:12};
function reset(){Object.entries(defaults).forEach(([id,v])=>{const el=$(id);if(!el)return;el.type==="checkbox"?el.checked=Boolean(v):el.value=v});update()}

const loaded=loadUrl(); showOptions();
document.querySelectorAll("input,select").forEach(el=>{if(!el.id)return;el.addEventListener(el.type==="checkbox"||el.tagName==="SELECT"?"change":"input",update)});
$("loanType").addEventListener("change",()=>{preset($("loanType").value);showOptions();update()});
$("resetBtn").addEventListener("click",reset);
$("printBtn").addEventListener("click",()=>window.print());
loaded?update():reset();


let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  const btn=$("installBtn");
  if(btn)btn.hidden=false;
});
$("installBtn")?.addEventListener("click",async()=>{
  if(!deferredInstallPrompt)return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  $("installBtn").hidden=true;
});
window.addEventListener("appinstalled",()=>{
  const btn=$("installBtn");
  if(btn)btn.hidden=true;
});
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}
