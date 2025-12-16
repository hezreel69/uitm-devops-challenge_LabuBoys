'use client'

import { useState } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
    {
        question: 'How do I search for properties?',
        answer: 'Use our search bar on the homepage to enter your desired location. You can filter by property type, price range, number of bedrooms, and more. Our interactive map also lets you explore properties in specific areas.',
    },
    {
        question: 'Is there a fee to use RentVerse?',
        answer: 'Searching for properties on RentVerse is completely free. Property owners pay a small listing fee to advertise their properties on our platform.',
    },
    {
        question: 'How do I contact a property owner?',
        answer: 'Once you find a property you\'re interested in, click on the listing to view details. You\'ll find a contact form or the owner\'s contact information on the property page.',
    },
    {
        question: 'Are the listings verified?',
        answer: 'Yes, we verify all property listings before they go live. Our team checks property details and photos to ensure accuracy. Verified listings are marked with a verification badge.',
    },
    {
        question: 'How do I list my property on RentVerse?',
        answer: 'Create an account, then click on "List your property" in the navigation. Fill in your property details, upload photos, set your price, and submit for review. Once approved, your listing will go live.',
    },
    {
        question: 'What areas does RentVerse cover?',
        answer: 'We currently cover all major cities and states in Malaysia, including Kuala Lumpur, Selangor, Penang, Johor, and more. We\'re constantly expanding our coverage.',
    },
    {
        question: 'How can I save properties I\'m interested in?',
        answer: 'Create an account and click the heart icon on any property to add it to your wishlist. You can access your saved properties anytime from your account dashboard.',
    },
    {
        question: 'What should I do if I encounter a problem with a listing?',
        answer: 'If you notice any issues with a listing, please report it using the "Report" button on the property page. Our team will investigate and take appropriate action.',
    },
]

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <ContentWrapper>
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="font-serif text-4xl md:text-5xl text-teal-900 mb-4 text-center">
                    Help Center
                </h1>
                <p className="text-lg text-slate-700 mb-12 text-center">
                    Find answers to frequently asked questions about RentVerse.
                </p>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="text-slate-500 flex-shrink-0" size={20} />
                                ) : (
                                    <ChevronDown className="text-slate-500 flex-shrink-0" size={20} />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 text-slate-600">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center p-8 bg-teal-50 rounded-2xl">
                    <h2 className="text-xl font-semibold text-teal-900 mb-2">Still have questions?</h2>
                    <p className="text-slate-600 mb-4">
                        Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                    </p>
                    <a
                        href="/contact"
                        className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </ContentWrapper>
    )
}
