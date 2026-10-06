import {createFileRoute,useNavigate} from "@tanstack/react-router";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";

const UPI_ID="9910474663@icici";

declare global {
  interface Window { Razorpay?: new (options: any) => any; }
}

export const Route=createFileRoute("/subscribe")({component:Subscribe});

function loadRazorpay(){
  return new Promise<void>((resolve,reject)=>{
    if(window.Razorpay){resolve();return;}
    const script=document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.async=true;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function Subscribe(){
  const nav=useNavigate();
  const [plan,setPlan]=useState<"pro"|"enterprise">("pro");
  const [instituteName,setInstituteName]=useState("");
  const [slug,setSlug]=useState("");
  const [code,setCode]=useState("");
  const [utr,setUtr]=useState("");
  const [qr,setQr]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const amount=plan==="pro"?299:499;

  useEffect(()=>{
    const upi=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("YourTuitionCenter")}&am=${amount}&cu=INR&tn=${encodeURIComponent(plan==="pro"?"Pro monthly subscription":"Enterprise monthly subscription")}`;
    QRCode.toDataURL(upi,{width:280,margin:2}).then(setQr);
  },[amount,plan]);

  async function submit(e:any){
    e.preventDefault();
    setMessage("");
    if(!instituteName.trim()||!slug.trim()||code.length<4){
      setMessage("Please complete the institute name, website slug and staff access code.");
      return;
    }
    setLoading(true);
    try{
      await loadRazorpay();
      const response=await fetch("/api/razorpay/order",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({plan,instituteName,slug,staffAccessCode:code})
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Unable to start Razorpay payment.");

      const gateway=new window.Razorpay!({
        key:data.keyId,
        amount:data.amount*100,
        currency:data.currency,
        name:"YourTuitionCenter",
        description:plan==="pro"?"Pro subscription":"Enterprise subscription",
        order_id:data.orderId,
        prefill:{name:instituteName},
        theme:{color:"#2563eb"},
        modal:{ondismiss:()=>setLoading(false)},
        handler:async(payment:any)=>{
          const verify=await fetch("/api/razorpay/verify",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payment)
          });
          const result=await verify.json();
          if(!verify.ok) throw new Error(result.error||"Payment verification failed.");
          localStorage.setItem("ytc_setup",JSON.stringify({
            plan,instituteName,slug,staffAccessCode:code,
            paymentMethod:"Razorpay",paymentAmount:amount,
            paymentStatus:"paid",paymentId:payment.razorpay_payment_id,
            orderId:payment.razorpay_order_id
          }));
          nav({to:"/dashboard"});
        }
      });
      gateway.on("payment.failed",(failure:any)=>{
        setMessage(failure?.error?.description||"Payment failed. Please try again.");
        setLoading(false);
      });
      gateway.open();
    }catch(error){
      setMessage(error instanceof Error?error.message:"Unable to start payment.");
      setLoading(false);
    }
  }

  function fallbackSubmit(e:any){
    e.preventDefault();
    localStorage.setItem("ytc_setup",JSON.stringify({
      plan,instituteName,slug,staffAccessCode:code,
      paymentMethod:"UPI",paymentAmount:amount,upiId:UPI_ID,
      paymentStatus:"pending-verification",utr:utr.trim()
    }));
    alert("UPI payment details submitted for verification.");
    nav({to:"/dashboard"});
  }

  return <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
    <Card className="w-full max-w-2xl rounded-3xl p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Centre setup</p>
      <h1 className="mt-2 text-3xl font-extrabold">Create your digital tuition centre</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pay securely with Razorpay. UPI QR remains available as a manual fallback.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><Label>Institute name</Label><Input required value={instituteName} onChange={e=>setInstituteName(e.target.value)} placeholder="Your Tuition Center"/></div>
        <div><Label>Website slug</Label><Input required value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))} placeholder="your-tuition-center"/></div>
        <div><Label>Staff access code</Label><Input required minLength={4} value={code} onChange={e=>setCode(e.target.value)} placeholder="Required only during staff/admin signup"/></div>
        <div><Label>Plan</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={plan} onChange={e=>setPlan(e.target.value as "pro"|"enterprise")}><option value="pro">Pro — ₹299/month</option><option value="enterprise">Enterprise — ₹499/month</option></select></div>

        {message&&<p className="text-sm text-destructive">{message}</p>}
        <Button disabled={loading} className="w-full rounded-full">{loading?"Opening secure payment…":"Pay securely with Razorpay"}</Button>
      </form>

      <div className="mt-6 rounded-2xl border bg-background p-5 text-center">
        <p className="text-sm font-semibold">Manual UPI fallback — ₹{amount}</p>
        <p className="mt-1 font-mono text-sm font-bold">{UPI_ID}</p>
        {qr&&<img src={qr} alt={`UPI QR for ₹${amount}`} className="mx-auto mt-4 h-56 w-56 rounded-xl border p-2"/>}
        <form onSubmit={fallbackSubmit} className="mt-4 space-y-3">
          <Input required minLength={6} value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Enter UTR after UPI payment"/>
          <Button variant="outline" className="w-full rounded-full">Submit UPI for manual verification</Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Razorpay checkout verifies the payment signature on the server. Monthly recurring billing still requires a Razorpay Subscription plan; the current checkout records the selected plan and processes the initial payment.</p>
    </Card>
  </main>
}