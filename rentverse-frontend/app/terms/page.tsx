import ContentWrapper from '@/components/ContentWrapper'

export default function TermsPage() {
    return (
        <ContentWrapper>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-8">Terms & Conditions</h1>
                <p className="text-slate-600 mb-8">Last updated: December 2024</p>

                <div className="prose prose-lg text-slate-700 space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using RentVerse (&quot;the Platform&quot;), you agree to be bound by these
                            Terms and Conditions. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">2. Use of Service</h2>
                        <p>
                            RentVerse provides an online platform for property owners to list rental properties
                            and for potential tenants to search for and inquire about these properties. We do not
                            own, manage, or control any of the properties listed on the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">3. User Accounts</h2>
                        <p>
                            To access certain features, you must create an account. You are responsible for
                            maintaining the confidentiality of your account credentials and for all activities
                            that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">4. Property Listings</h2>
                        <p>
                            Property owners are responsible for the accuracy of their listings. RentVerse reserves
                            the right to remove any listing that violates our policies or contains false information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">5. User Conduct</h2>
                        <p>Users agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Post false or misleading information</li>
                            <li>Harass or threaten other users</li>
                            <li>Attempt to circumvent our platform for direct transactions</li>
                            <li>Use the platform for any illegal purposes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">6. Limitation of Liability</h2>
                        <p>
                            RentVerse is not liable for any disputes between property owners and tenants.
                            We are a platform provider and do not guarantee the quality or legality of any
                            property listing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">7. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the
                            platform after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-800">8. Contact</h2>
                        <p>
                            For questions about these Terms & Conditions, please contact us at{' '}
                            <a href="mailto:legal@rentverse.my" className="text-teal-600 hover:underline">
                                legal@rentverse.my
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </ContentWrapper>
    )
}
