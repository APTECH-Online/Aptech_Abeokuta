import { notFound } from 'next/navigation'
import Container from '../../../../components/ui/Container'
import ChallengePlayer from '../../../../components/tech-zone/ChallengePlayer'
import { getPublicChallenge } from '../../../../lib/tech-zone'
export default async function ChallengePage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const data=await getPublicChallenge(slug);if(!data)return notFound();if(!data.questions.length)return notFound();return <section className="section"><Container className="max-w-4xl"><ChallengePlayer challenge={data.challenge as any} questions={data.questions}/></Container></section>}
