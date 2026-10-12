export const SAAS_PLANS = { free:{key:"free",name:"Free",price:0,monthly:false,websiteOnly:true}, pro:{key:"pro",name:"Pro",price:299,monthly:true,websiteOnly:false}, enterprise:{key:"enterprise",name:"Enterprise",price:499,monthly:true,websiteOnly:false} } as const;
export type SaaSPlan=keyof typeof SAAS_PLANS;
export const PLAN_FEATURES={free:["Public website"],pro:["Website + CMS","Parent portal","Academic workflows","Fees/admissions/enquiries","Staff workspace","Selected admin controls restricted"],enterprise:["Everything in Pro","Full admin","Full staff","Complete CMS","All operational modules","Advanced settings"]} as const;
export const isPaidPlan=(p?:string|null)=>p==="pro"||p==="enterprise";
export const hasFullAccess=(p?:string|null)=>p==="enterprise";