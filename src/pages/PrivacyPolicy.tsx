import { type CSSProperties } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Cta from "../components/Cta";
import imgBg from "../assets/features/644bc.png";

export default function PrivacyPolicy() {
  return (
    <>
      <div data-hero className="relative w-full bg-[#f9f9fa] overflow-hidden">
        <img
          src={imgBg}
          alt=""
          aria-hidden
          className="absolute inset-x-0 top-0 h-[588px] w-full object-cover pointer-events-none select-none"
        />

        <Navbar />

        <section className="relative pt-[112px] sm:pt-[136px] lg:pt-[148px] pb-12 lg:pb-[60px] px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px]">
          <div className="mx-auto max-w-[1290px] flex flex-col gap-8">
            <div className="flex flex-col gap-4 max-w-[1050px]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-display font-medium text-[#2155f5]">Legal</span>
              </div>
              <h1 className="hero-in font-display font-semibold text-[40px] leading-[44px] sm:text-[56px] sm:leading-[60px] xl:text-[68px] xl:leading-[70px] tracking-[-0.015em] text-[#0f1013]">
                Privacy Policy
              </h1>
              <p
                style={{ "--i": 1 } as CSSProperties}
                className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52] max-w-[800px]"
              >
                Your privacy matters to us. This policy explains what personal information we collect, why, who we share it with, how long we keep it, and your rights.
              </p>
              <p className="font-sans text-sm text-[#494c52]">
                Version 1.1 • Effective date: 2 October 2026
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="relative w-full bg-white px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
        <article className="mx-auto max-w-[900px] prose prose-sm sm:prose lg:prose-lg">
          <div className="space-y-8">
            {/* Summary Section */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                Summary
              </h2>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span>We collect what we need to run a phone-number service, take payment, stop fraud and abuse, and meet telecoms and tax law.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span>We <strong>do not sell</strong> your personal information and we <strong>do not</strong> use your message content for advertising.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span>Outgoing messages are <strong>automatically screened for spam and fraud</strong> before sending.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span>You can access, correct, export or delete your data, subject to legal retention limits.</span>
                </li>
              </ul>
            </div>

            {/* Controller Section */}
            <div className="bg-[#f9f9fa] border border-[#e6e6e6] rounded-2xl p-6 sm:p-8">
              <h3 className="font-display font-semibold text-xl leading-7 text-[#0f1013] mb-3">ZedSMS Ltd</h3>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                Company number 16143779, registered office 128 City Road, London, England, EC1V 2NX.
              </p>
              <p className="font-sans text-base leading-6 text-[#494c52] mt-3">
                <strong>Privacy contact:</strong> privacy@zedsms.com
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                1. Information We Collect
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-xl leading-7 text-[#0f1013] mb-3">Information You Give Us</h3>
                  <ul className="space-y-2 text-[#494c52]">
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Account:</strong> Email address, name (optional), password (hashed), sign-in provider identifier</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Support & complaints:</strong> Messages, screenshots and call-backs when you contact us</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Number settings:</strong> Display names, voicemail greetings, forwarding settings</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-xl leading-7 text-[#0f1013] mb-3">Information Created When You Use the Service</h3>
                  <ul className="space-y-2 text-[#494c52]">
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Numbers:</strong> Numbers allocated to you, activation, renewal and release dates</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Communications records:</strong> Sender and recipient numbers, date and time, duration, delivery status, cost</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Message content:</strong> Content of SMS you send and receive, stored in your inbox across devices</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-xl leading-7 text-[#0f1013] mb-3">Payment and Transaction Information</h3>
                  <ul className="space-y-2 text-[#494c52]">
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Transaction data:</strong> Amount, currency, date/time, items bought, receipt number</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Payment method:</strong> Card brand, last 4 digits, expiry (full card numbers are handled only by our payment processor)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                      <span><strong>Device and technical:</strong> IP address, device model, operating system, app version, browser type</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                2. How We Use Your Information
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="space-y-3 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Create and run your Account:</strong> Allocate numbers, send and deliver SMS and calls, show your history</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Take payment:</strong> Issue receipts, apply correct tax, process refunds and disputes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Prevent fraud and abuse:</strong> Automatically screen messages, monitor patterns, and detect suspicious activity</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Customer support:</strong> Respond to your inquiries and resolve complaints</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Service messages:</strong> Send receipts, renewal reminders, security alerts</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Comply with law:</strong> Respond to court orders and lawful requests from regulators</span>
                </li>
              </ul>
            </div>

            {/* Who We Share Information With */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                3. Who We Share Information With
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                We share only what each party needs to provide the service:
              </p>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Telecoms carriers:</strong> To carry your SMS and calls and supply numbers</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Payment processors:</strong> Stripe (card), NOWPayments and MixPay (crypto), Apple App Store (in-app)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Hosting and infrastructure providers:</strong> Server hosting, email, push notifications, crash reporting</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Regulators and law enforcement:</strong> Where required by law or to protect safety</span>
                </li>
              </ul>
              <p className="font-sans text-base leading-6 text-[#494c52] mt-4">
                <strong>We do not sell personal information</strong> and we do not share it for cross-context behavioural advertising.
              </p>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                4. How Long We Keep Information
              </h2>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Account details:</strong> While open, then up to 12 months after closure</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Message content:</strong> Until you delete it or close your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Communications records:</strong> 24 months from the event</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Transaction and tax records:</strong> 6 years after the end of financial year (UK tax law)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Technical logs:</strong> Up to 90 days unless linked to security investigations</span>
                </li>
              </ul>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                5. Your Rights
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                Depending on where you live, you may have the right to:
              </p>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Access</strong> a copy of your personal information</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Correct</strong> inaccurate information</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Delete</strong> your information (subject to legal retention limits)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Restrict or object</strong> to our use of your information</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span><strong>Data portability</strong> — receive information in a machine-readable format</span>
                </li>
              </ul>
              <div className="mt-6 p-6 bg-[#f0f4ff] border border-[#d4e3ff] rounded-xl">
                <p className="font-sans text-base leading-6 text-[#0f1013]">
                  <strong>To exercise your rights:</strong> Email privacy@zedsms.com from your account email. We respond within one month. There is normally no fee.
                </p>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                6. Security
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                We use encryption in transit, encrypted storage for sensitive data, access controls and logging, and network protections. Staff access to message content and personal data is limited. If a breach is likely to put your rights at risk, we will notify you and the relevant regulator as the law requires.
              </p>
            </div>

            {/* Changes to Policy */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                7. Changes to This Policy
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                We will post updates here with a new effective date. If a change materially affects how we use your information, we will notify you by email before it takes effect.
              </p>
            </div>

            {/* Contact */}
            <div className="border-t border-[#e6e6e6] pt-8">
              <p className="font-sans text-base leading-6 text-[#494c52]">
                <strong>Questions?</strong> Contact us at privacy@zedsms.com
              </p>
            </div>
          </div>
        </article>
      </section>

      <Cta />
      <Footer />
    </>
  );
}
