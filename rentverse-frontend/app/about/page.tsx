import ContentWrapper from '@/components/ContentWrapper'

export default function AboutPage() {
    return (
        <ContentWrapper>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-8">About RentVerse</h1>

                <div className="prose prose-lg text-slate-700 space-y-6">
                    <p>
                        RentVerse is Malaysia&apos;s premier property rental platform, connecting tenants with
                        their perfect homes across the nation. Founded with a vision to simplify the rental
                        process, we&apos;ve grown to become a trusted marketplace for thousands of property seekers
                        and owners.
                    </p>

                    <h2 className="text-2xl font-semibold text-slate-800 mt-8">Our Mission</h2>
                    <p>
                        To make finding and renting a home as simple and stress-free as possible. We believe
                        everyone deserves a place they can call home, and we&apos;re here to help make that happen.
                    </p>

                    <h2 className="text-2xl font-semibold text-slate-800 mt-8">What We Offer</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Thousands of verified property listings across Malaysia</li>
                        <li>Advanced search filters to find your perfect match</li>
                        <li>Interactive maps to explore neighborhoods</li>
                        <li>Direct communication with property owners</li>
                        <li>Secure and transparent rental process</li>
                    </ul>

                    <h2 className="text-2xl font-semibold text-slate-800 mt-8">Our Team</h2>
                    <p>
                        We&apos;re a passionate team of real estate enthusiasts and tech innovators based in
                        Kuala Lumpur. Our diverse team brings together expertise in property management,
                        software development, and customer service to deliver the best rental experience.
                    </p>
                </div>
            </div>
        </ContentWrapper>
    )
}
