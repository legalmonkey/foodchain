import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const HelpPage = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const faqs = [
    {
      q: "What should I do if my food arrives cold, damaged, or missing items?",
      a: "Open your delivered order and click 'File a Grievance'. Select the category (Food Quality, Missing Item, Hygiene/Packaging), describe what was wrong, and upload clear photo or video evidence. Your evidence is pinned to IPFS via Pinata and submitted to the blockchain. The restaurant will have an opportunity to accept fault (triggering an instant refund) or contest it before the community jury.",
    },
    {
      q: "How does the community jury resolve my dispute fairly?",
      a: "When a complaint is contested, 5 independent jurors who have staked test POL on Polygon Amoy are randomly assigned to your case. They view your IPFS evidence and vote whether to Uphold or Reject the complaint. Jurors who vote with the majority share rewards, while minority voters are slashed. This economic incentive ensures fair, unbiased verdicts without corporate bias.",
    },
    {
      q: "What kind of evidence is accepted for a grievance?",
      a: "Clear photos of incorrect items, damaged packaging, undercooked food, or foreign objects are ideal. For spills or tamper-evident seals, short video clips clearly showing the delivery package before and after opening are strongly recommended. All evidence files are immutably preserved on decentralized IPFS.",
    },
    {
      q: "How can I become a juror and earn rewards?",
      a: "Any registered user with a MetaMask wallet can join the juror pool. Simply navigate to the 'Community Jury' tab, connect your wallet on Polygon Amoy, and stake at least 0.01 test POL. You will be assigned active dispute cases and receive rewards for evaluating evidence accurately.",
    },
    {
      q: "Are the restaurant ratings and reputation scores real?",
      a: "Yes. Unlike traditional star ratings that can be bought or scrubbed, every restaurant's on-chain reputation score starts at 70 and updates automatically: -10 points for each upheld customer grievance, and +2 points for every unblemished delivery and successfully defended contested complaint.",
    },
  ];

  const handleSubmitContact = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-8 sm:p-12 shadow-neo text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-brand-redLight text-brand-red text-xs font-black px-3 py-1 rounded border border-brand-red">
          <HelpCircle className="w-4 h-4" />
          <span>HELP CENTER & CONSUMER ADVOCACY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-brand-dark tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto">
          Everything you need to know about food ordering, IPFS evidence standards, and decentralized dispute redressal.
        </p>
      </div>

      {/* FAQs Accordion */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-6 sm:p-8 shadow-neo space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="border-2 border-brand-dark rounded-lg overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-black text-sm sm:text-base text-brand-dark hover:bg-brand-grayLight transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-brand-red shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed bg-brand-grayLight border-t border-gray-200">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-brand-dark text-white border-2 border-brand-dark rounded-xl p-8 shadow-neo space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-red text-white text-xs font-black px-3 py-1 rounded">
            <MessageSquare className="w-4 h-4" />
            <span>DIRECT CONSUMER ADVOCATE</span>
          </div>
          <h2 className="text-2xl font-black uppercase">Need Special Assistance?</h2>
          <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
            Our platform operations team monitors on-chain dispute finalizations 24/7. If you have inquiries regarding transaction relayers or testnet faucet tokens, reach out directly.
          </p>

          <div className="pt-4 space-y-2 text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-red" />
              <span>Network: Polygon Amoy Testnet (Chain ID 80002)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-red" />
              <span>Smart Contract Escrow: Verified OpenZeppelin</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-brand-dark rounded-xl p-6 sm:p-8 shadow-neo space-y-4">
          <h3 className="text-lg font-black uppercase text-brand-dark">Send a Message</h3>

          {contactSubmitted ? (
            <div className="p-6 bg-green-50 border-2 border-green-700 rounded-lg text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-700 mx-auto" />
              <div className="font-black text-sm text-green-800">Message Received!</div>
              <p className="text-xs text-green-700 font-medium">A support advocate will respond to your inquiry shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs font-semibold p-2.5 border-2 border-brand-dark rounded-md bg-brand-gray"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full text-xs font-semibold p-2.5 border-2 border-brand-dark rounded-md bg-brand-gray"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-700 block mb-1">Inquiry / Question</label>
                <textarea
                  rows="3"
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or feedback..."
                  className="w-full text-xs font-medium p-2.5 border-2 border-brand-dark rounded-md bg-brand-gray"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full neo-btn-primary py-2.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Submit Inquiry</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
