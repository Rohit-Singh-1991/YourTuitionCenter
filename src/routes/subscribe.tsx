import {createFileRoute,useNavigate} from "@tanstack/react-router";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";

const UPI_ID="9910474663@icici";

export const Route=createFileRoute("/subscribe")({component:Subscribe});

function Subscribe(){
  const nav=useNavigate();
  const [plan,setPlan]=useState<"pro"|"enterprise">("pro");
  const [instituteName,setInstituteName]=useState("");
  const [slug,setSlug]=useState("");
  const [code,setCode]=useState("");
  const [utr,setUtr]=useState("");
  const [qr,setQr]=useState("");
  const amount=plan==="pro"?299:499;

  useEffect(()=>{
    const upi=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("YourTuitionCenter")}&am=${amount}&cu=INR&tn=${encodeURIComponent(plan==="pro"?"Pro monthly subscription":"Enterprise monthly subscription")}`;
    QRCode.toDataURL(upi,{width:280,margin:2}).then(setQr);
  },[amount,plan]);

  function submit(e:any){
    e.preventDefault();
    localStorage.setItem("ytc_setup",JSON.stringify({
      plan,instituteName,slug,staffAccessCode:code,
      paymentMethod:"UPI",paymentAmount:amount,upiId:UPI_ID,
      paymentStatus:"pending-verification",utr:utr.trim()
    }));
    alert("Payment details submitted for verification. Your workspace will be activated after the payment is verified.");
    nav({to:"/dashboard"});
  }

  return <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
    <Card className="w-full max-w-2xl rounded-3xl p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Centre setup</p>
      <h1 className="mt-2 text-3xl font-extrabold">Create your digital tuition centre</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pay by UPI QR. This fallback works without a payment-gateway account. Payment is manually verified before the subscription is activated.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><Label>Institute name</Label><Input required value={instituteName} onChange={e=>setInstituteName(e.target.value)} placeholder="Your Tuition Center"/></div>
        <div><Label>Website slug</Label><Input required value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))} placeholder="your-tuition-center"/></div>
        <div><Label>Staff access code</Label><Input required minLength={4} value={code} onChange={e=>setCode(e.target.value)} placeholder="Required only during staff/admin signup"/></div>
        <div><Label>Monthly plan</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={plan} onChange={e=>setPlan(e.target.value as "pro"|"enterprise")}><option value="pro">Pro — ₹299/month</option><option value="enterprise">Enterprise — ₹499/month</option></select></div>

        <div className="rounded-2xl border bg-background p-5 text-center">
          <p className="text-sm font-semibold">Pay ₹{amount} to</p>
          <p className="mt-1 font-mono text-sm font-bold">{UPI_ID}</p>
          {qr && <img src={qr} alt={`UPI QR for ₹${amount}`} className="mx-auto mt-4 h-56 w-56 rounded-xl border p-2"/>}
          <a href={`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=YourTuitionCenter&am=${amount}&cu=INR`} className="mt-4 inline-block text-sm font-semibold text-primary underline">Open UPI app on mobile</a>
          <p className="mt-2 text-xs text-muted-foreground">Scan with Google Pay, PhonePe, Paytm or another UPI app.</p>
        </div>

        <div><Label>UTR / transaction reference</Label><Input required minLength={6} value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Enter the UTR after payment"/></div>
        <Button className="w-full rounded-full">Submit payment for verification</Button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">Razorpay can be connected later for automatic payment verification and recurring subscriptions. A direct UPI QR cannot securely confirm payment by itself, so this flow never marks a payment as successful without verification.</p>
    </Card>
  </main>
}