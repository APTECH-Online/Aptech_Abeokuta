'use client'
import { useActionState } from 'react'
import { assignBooking, type BookingActionResult } from './actions'
const initial: BookingActionResult = { ok:false }
export default function BookingAssignmentForm({bookingId,assignedTo,staff}:{bookingId:string;assignedTo:string|null;staff:{id:string;full_name:string}[]}) {
 const [result,action,pending]=useActionState(assignBooking,initial)
 return <form action={action} className="flex min-w-[190px] flex-col gap-2 sm:flex-row sm:items-center"><input type="hidden" name="bookingId" value={bookingId}/><select name="assignedTo" defaultValue={assignedTo || ''} className="form-input text-xs" aria-label="Assign counsellor"><option value="">Unassigned</option>{staff.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select><button type="submit" className="btn btn-secondary !px-3 !py-2 !text-xs" disabled={pending}>{pending?'Saving…':'Assign'}</button>{result.message&&<span role="status" className="text-xs" style={{color:result.ok?'#18764a':'#b42318'}}>{result.message}</span>}</form>
}
