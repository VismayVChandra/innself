import{createClient}from'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://rpdmvqyfmghppdxwprkp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZG12cXlmbWdocHBkeHdwcmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTM1NDAsImV4cCI6MjA5NjMyOTU0MH0.tQaSKrGAiQqgazGqpw7bbQH7PbOjCvon-8GwSZ6Woq0'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

/* ── Utilities ─────────────────────────────── */
export function show(id){document.getElementById(id)?.classList.add('show')}
export function hide(id){document.getElementById(id)?.classList.remove('show')}
export function loading(on){on?show('loading'):hide('loading')}

export function toast(msg,type='info',ms=3000){
  const el=document.getElementById('toast')
  if(!el)return
  el.textContent=msg
  el.className=`show ${type}`
  setTimeout(()=>el.className='',ms)
}

export function redirectByRole(role){
  const map={customer:'/customer/home.html',
    technician:'/technician/register.html',admin:'/admin/dashboard.html'}
  window.location.href=map[role]||'/'
}

export function getInitials(name){
  return(name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
}

export function timeAgo(date){
  const s=Math.floor((Date.now()-new Date(date))/1000)
  if(s<60)return 'just now'
  if(s<3600)return Math.floor(s/60)+'m ago'
  if(s<86400)return Math.floor(s/3600)+'h ago'
  return Math.floor(s/86400)+'d ago'
}

export function fmtMoney(n){
  return'₹'+(n||0).toLocaleString('en-IN')
}

/* ── Auth ──────────────────────────────────── */
export async function signUp(email,password,name){
  const{data,error}=await sb.auth.signUp({
    email,password,options:{data:{name}}
  })
  if(error)throw error
  return data
}

export async function signIn(email,password){
  const{data,error}=await sb.auth.signInWithPassword({email,password})
  if(error)throw error
  return data
}

export async function signOut(){
  await sb.auth.signOut()
  window.location.href='/'
}

export async function getUser() {
  const {
    data: { user: authUser },
    error: authError
  } = await sb.auth.getUser();

  if (authError) throw authError;
  if (!authUser) return null;

  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;

  console.log("Auth User:", authUser);
  console.log("Database User:", data);

  if (!data) {
    throw new Error(
      "No matching profile found in the users table. Check that auth.users.id matches users.id."
    );
  }

  return data;
}
export async function requireAuth(allowedRoles){
  const user=await getUser()
  if(!user){window.location.href='/';return null}
  if(allowedRoles&&!allowedRoles.includes(user.role)){
    window.location.href='/'
    return null
  }
  return user
}

/* ── Customer ──────────────────────────────── */
export async function completeCustomerProfile(name){
  const{data,error}=await sb.rpc('complete_customer_profile',{p_name:name})
  if(error)throw error
  return data
}

export async function createJob(fields){
  const{data,error}=await sb.rpc('create_job',{
    p_category:fields.category,
    p_title:fields.title,
    p_description:fields.description,
    p_photo_urls:fields.photo_urls||[],
    p_lat:fields.lat||0,
    p_lng:fields.lng||0,
    p_address:fields.address||'',
    p_budget_min:fields.budget_min||null,
    p_budget_max:fields.budget_max||null,
    p_preferred_start:fields.preferred_start||null,
    p_is_urgent:fields.is_urgent||false
  })
  if(error)throw error
  return data
}

export async function getMyJobs(){
  const{data,error}=await sb.from('jobs')
    .select('*').order('created_at',{ascending:false})
  if(error)throw error
  return data
}

export async function getBidsForJob(jobId){
  const{data,error}=await sb.from('bids')
    .select(`*, users!technician_id(name,avatar_url,rating_avg,rating_count)`)
    .eq('job_id',jobId)
    .eq('status','pending')
    .order('created_at',{ascending:false})
  if(error)throw error
  return data
}

export async function acceptBid(bidId){
  const{data,error}=await sb.rpc('accept_bid',{p_bid_id:bidId})
  if(error)throw error
  return data
}

export async function getJobById(jobId){
  const{data,error}=await sb.from('jobs')
    .select(`*, users!assigned_tech_id(name,avatar_url,rating_avg)`)
    .eq('id',jobId).single()
  if(error)throw error
  return data
}

export async function confirmJob(jobId){
  const{error}=await sb.rpc('confirm_job_completion',{p_job_id:jobId})
  if(error)throw error
}

export async function raiseDispute(jobId,reason){
  const{data,error}=await sb.rpc('raise_dispute',{
    p_job_id:jobId,p_reason:reason,p_evidence_urls:[]
  })
  if(error)throw error
  return data
}

export async function submitReview(jobId,rating,comment){
  const{data,error}=await sb.rpc('submit_review',{
    p_job_id:jobId,p_rating:rating,p_comment:comment
  })
  if(error)throw error
  return data
}

export async function cancelJob(jobId){
  const{error}=await sb.rpc('cancel_job',{p_job_id:jobId,p_note:''})
  if(error)throw error
}

/* ── Technician ────────────────────────────── */
export async function registerTechnician(fields){
  const{data,error}=await sb.rpc('register_technician',{
    p_name:fields.name,
    p_bio:fields.bio||null,
    p_service_categories:fields.categories,
    p_service_radius_km:fields.radius||10
  })
  if(error)throw error
  return data
}

export async function submitKYC(docUrl){
  const{error}=await sb.rpc('submit_kyc',{p_kyc_doc_url:docUrl})
  if(error)throw error
}

export async function getOpenJobs(category){
  let q=sb.from('v_open_jobs').select('*')
  if(category&&category!=='all')q=q.eq('category',category)
  const{data,error}=await q.order('created_at',{ascending:false}).limit(50)
  if(error)throw error
  return data||[]
}

export async function submitBid(fields){
  const{data,error}=await sb.rpc('submit_bid',{
    p_job_id:fields.jobId,
    p_price:fields.price,
    p_proposed_start:fields.proposedStart,
    p_estimated_duration_hrs:fields.durationHrs||null,
    p_note:fields.note||null
  })
  if(error)throw error
  return data
}

export async function withdrawBid(bidId){
  const{error}=await sb.rpc('withdraw_bid',{p_bid_id:bidId})
  if(error)throw error
}

export async function updateJobStatus(jobId,newStatus){
  const{data,error}=await sb.rpc('update_job_status',{
    p_job_id:jobId,p_new_status:newStatus
  })
  if(error)throw error
  return data
}

export async function getMyBids(){
  const{data,error}=await sb.from('bids')
    .select(`*, jobs(title,category,status,location_address)`)
    .order('created_at',{ascending:false})
  if(error)throw error
  return data||[]
}

export async function getWallet(){
  const{data,error}=await sb.from('technician_profiles')
    .select('wallet_balance,total_jobs_completed').single()
  if(error)throw error
  return data
}

export async function getWalletTransactions(){
  const{data,error}=await sb.from('wallet_transactions')
    .select('*').order('created_at',{ascending:false}).limit(30)
  if(error)throw error
  return data||[]
}

export async function requestWithdrawal(amount){
  const{data,error}=await sb.rpc('request_withdrawal',{p_amount:amount})
  if(error)throw error
  return data
}

export async function setAvailability(val){
  const{error}=await sb.rpc('update_technician_availability',{p_is_available:val})
  if(error)throw error
}

export async function uploadFile(bucket,file,path){
  const{data,error}=await sb.storage.from(bucket).upload(path,file,{upsert:true})
  if(error)throw error
  return data.path
}

/* ── Admin ─────────────────────────────────── */
export async function getAdminStats(){
  const{data,error}=await sb.from('v_admin_stats').select('*').single()
  if(error)throw error
  return data
}

export async function getActivityFeed(){
  const{data,error}=await sb.from('v_admin_activity_feed')
    .select('*').limit(20)
  if(error)throw error
  return data||[]
}

export async function getKYCQueue(){
  const{data,error}=await sb.from('v_kyc_queue').select('*')
  if(error)throw error
  return data||[]
}

export async function reviewKYC(techId,decision,reason){
  const{error}=await sb.rpc('review_kyc',{
    p_technician_id:techId,p_decision:decision,
    p_rejection_reason:reason||null
  })
  if(error)throw error
}

export async function getDisputes(){
  const{data,error}=await sb.from('v_disputes_queue').select('*')
  if(error)throw error
  return data||[]
}

export async function resolveDispute(disputeId,decision,note,percent){
  const{error}=await sb.rpc('resolve_dispute',{
    p_dispute_id:disputeId,p_decision:decision,
    p_resolution_note:note,p_refund_percent:percent||0
  })
  if(error)throw error
}

export async function getAllUsers(){
  const{data,error}=await sb.from('v_admin_users').select('*')
  if(error)throw error
  return data||[]
}

export async function suspendUser(userId,reason){
  const{error}=await sb.rpc('suspend_user',{p_user_id:userId,p_reason:reason})
  if(error)throw error
}

export async function restoreUser(userId){
  const{error}=await sb.rpc('restore_user',{p_user_id:userId})
  if(error)throw error
}

export async function getPendingReviews(){
  const{data,error}=await sb.from('v_pending_reviews').select('*')
  if(error)throw error
  return data||[]
}

export async function moderateReview(reviewId,approve,flagReason){
  const{error}=await sb.rpc('moderate_review',{
    p_review_id:reviewId,p_approve:approve,
    p_flag_reason:flagReason||null
  })
  if(error)throw error
}

/* ── Realtime ────────────────────────────────  */
export function subscribeToJob(jobId,callback){
  return sb.channel('job-'+jobId)
    .on('postgres_changes',{
      event:'UPDATE',schema:'public',table:'jobs',
      filter:`id=eq.${jobId}`
    },payload=>callback(payload.new))
    .subscribe()
}

export function subscribeToBids(jobId,callback){
  return sb.channel('bids-'+jobId)
    .on('postgres_changes',{
      event:'INSERT',schema:'public',table:'bids',
      filter:`job_id=eq.${jobId}`
    },payload=>callback(payload.new))
    .subscribe()
}

export function unsubscribe(channel){
  sb.removeChannel(channel)
}