'use client'
import { useEffect } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'
import { setConversionPoint } from '../../lib/attribution'
export default function CampaignTracking({campaignId,campaignName}:{campaignId:string;campaignName:string}){useEffect(()=>{trackConversionEvent('campaign_landing_viewed',{campaignId,campaignName});setConversionPoint('campaign_landing')},[campaignId,campaignName]);return null}
