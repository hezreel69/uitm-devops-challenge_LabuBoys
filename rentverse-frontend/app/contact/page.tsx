import ContentWrapper from '@/components/ContentWrapper'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export default function ContactPage() {
    return (
        <ContentWrapper>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-8">Contact Us</h1>

                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <p className="text-lg text-slate-700 mb-8">
                            Have questions or need assistance? We&apos;re here to help! Reach out to us through
                            any of the channels below.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <Mail className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Email</h3>
                                    <p className="text-slate-600">support@rentverse.my</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <Phone className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Phone</h3>
                                    <p className="text-slate-600">+60 3-1234 5678</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <MapPin className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Address</h3>
                                    <p className="text-slate-600">
                                        Level 10, Menara KLCC<br />
                                        Jalan Ampang, 50088<br />
                                        Kuala Lumpur, Malaysia
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-teal-100 p-3 rounded-lg">
                                    <Clock className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Business Hours</h3>
                                    <p className="text-slate-600">
                                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                                        Saturday: 9:00 AM - 1:00 PM<br />
                                        Sunday: Closed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl">
                        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Send us a message</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="How can we help you?"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </ContentWrapper>
    )
}
