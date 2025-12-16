import ContentWrapper from '@/components/ContentWrapper'
import { Briefcase, MapPin, Clock } from 'lucide-react'

const jobOpenings = [
    {
        title: 'Senior Full Stack Developer',
        department: 'Engineering',
        location: 'Kuala Lumpur',
        type: 'Full-time',
    },
    {
        title: 'Product Designer',
        department: 'Design',
        location: 'Kuala Lumpur',
        type: 'Full-time',
    },
    {
        title: 'Customer Success Manager',
        department: 'Operations',
        location: 'Remote',
        type: 'Full-time',
    },
    {
        title: 'Marketing Specialist',
        department: 'Marketing',
        location: 'Kuala Lumpur',
        type: 'Full-time',
    },
]

export default function CareersPage() {
    return (
        <ContentWrapper>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-4">Join Our Team</h1>
                <p className="text-lg text-slate-700 mb-12">
                    We&apos;re on a mission to revolutionize the rental experience in Malaysia.
                    Join us and be part of something great!
                </p>

                <div className="bg-teal-50 p-8 rounded-2xl mb-12">
                    <h2 className="text-2xl font-semibold text-teal-900 mb-4">Why Work at RentVerse?</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-teal-600">✓</span>
                            <span className="text-slate-700">Competitive salary & benefits</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-teal-600">✓</span>
                            <span className="text-slate-700">Flexible work arrangements</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-teal-600">✓</span>
                            <span className="text-slate-700">Learning & development budget</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-teal-600">✓</span>
                            <span className="text-slate-700">Collaborative team environment</span>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Open Positions</h2>
                <div className="space-y-4">
                    {jobOpenings.map((job, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl p-6 hover:border-teal-300 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">{job.title}</h3>
                                    <p className="text-slate-600">{job.department}</p>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} />
                                        {job.type}
                                    </div>
                                </div>
                                <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                                    Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-600">
                        Don&apos;t see a role that fits? Send your resume to{' '}
                        <a href="mailto:careers@rentverse.my" className="text-teal-600 hover:underline">
                            careers@rentverse.my
                        </a>
                    </p>
                </div>
            </div>
        </ContentWrapper>
    )
}
