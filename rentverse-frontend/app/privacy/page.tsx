import ContentWrapper from '@/components/ContentWrapper'

export default function PrivacyPage() {
    return (
        <ContentWrapper>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-8">Privacy Policy</h1>
                <p className="text-slate-600 mb-8">Last updated: December 2024</p>

                <div className="prose prose-lg text-slate-700 space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Account information (name, email, phone number)</li>
                            <li>Property search preferences</li>
                            <li>Property listing details (for owners)</li>
                            <li>Communication between users</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and improve our services</li>
                            <li>Connect property seekers with property owners</li>
                            <li>Send you relevant property recommendations</li>
                            <li>Process transactions and send related information</li>
                            <li>Communicate with you about updates and promotions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">3. Information Sharing</h2>
                        <p>
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Property owners/seekers for the purpose of facilitating rentals</li>
                            <li>Service providers who assist in our operations</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">4. Data Security</h2>
                        <p>
                            We implement appropriate security measures to protect your personal information.
                            However, no method of transmission over the Internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">5. Cookies</h2>
                        <p>
                            We use cookies and similar technologies to improve user experience, analyze usage,
                            and deliver personalized content. You can control cookie preferences through your
                            browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of marketing communications</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">7. Contact Us</h2>
                        <p>
                            For privacy-related inquiries, please contact our Data Protection Officer at{' '}
                            <a href="mailto:privacy@rentverse.my" className="text-teal-600 hover:underline">
                                privacy@rentverse.my
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </ContentWrapper>
    )
}
