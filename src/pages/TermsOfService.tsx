import { type CSSProperties } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Cta from "../components/Cta";
import imgBg from "../assets/features/644bc.png";

export default function TermsOfService() {
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
                Terms & Conditions
              </h1>
              <p
                style={{ "--i": 1 } as CSSProperties}
                className="hero-in font-sans text-base leading-6 sm:text-lg sm:leading-7 text-[#494c52] max-w-[800px]"
              >
                Please read these terms carefully. By using ZedSMS, you accept these terms and agree to use our service responsibly.
              </p>
              <p className="font-sans text-sm text-[#494c52]">
                Version 1.1 • Effective date: 2 October 2026
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="relative w-full bg-white px-6 sm:px-8 lg:px-10 xl:px-12 min-[1440px]:px-[75px] py-12 lg:py-[60px]">
        <article className="mx-auto max-w-[900px]">
          <div className="space-y-8">
            {/* Key Points */}
            <div className="bg-[#f0f4ff] border border-[#d4e3ff] rounded-2xl p-6 sm:p-8">
              <h2 className="font-display font-semibold text-[22px] leading-7 text-[#0f1013] mb-4">
                The Key Points (Please Read)
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">1.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>Instant digital supply.</strong> When you pay, your Credit is added and/or your Number is activated straight away.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">2.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>Purchases are non-refundable</strong> once supplied, except in specific cases in section 5.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">3.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>Two types of Number.</strong> Private Numbers are assigned to you only. Shared Numbers are used by multiple customers for receiving SMS from one service.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">4.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>No guarantees on third-party acceptance.</strong> We do not guarantee a Number will receive verification codes or be accepted by any app or platform.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">5.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>Contact us first.</strong> If something is wrong, email support@zedsms.com before raising a chargeback.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">6.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>No emergency calls.</strong> ZedSMS does not connect calls to 999, 911, 112 or any emergency number.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">7.</span>
                  <span className="font-sans text-base leading-6 text-[#0f1013]"><strong>Personal use only.</strong> No bulk, marketing, or automated messaging. No reselling. Outgoing messages are automatically screened for abuse.</span>
                </li>
              </ul>
            </div>

            {/* About These Terms */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                1. About These Terms
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                These Terms, together with our Privacy Policy, Price List, and any offer terms shown at the time of purchase, form the agreement between you and ZedSMS Ltd (company number 16143779) for use of the ZedSMS website, mobile apps, and web app.
              </p>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                You accept these Terms by creating an account, ticking the acceptance box, or making a purchase. We record the version you accepted, the date and time, and the IP address used.
              </p>
            </div>

            {/* Who Can Use ZedSMS */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                2. Who Can Use ZedSMS
              </h2>
              <ul className="space-y-3 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">You must be at least <strong>18 years old</strong> and legally able to enter into contracts.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">You must provide accurate information when you register and keep it up to date.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">You are responsible for everything done through your Account. Keep your password and login methods secure.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">You may open more than one Account. Each Account is separate.</span>
                </li>
              </ul>
            </div>

            {/* The Service */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                3. The Service
              </h2>
              <div className="space-y-4 text-[#494c52]">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">What ZedSMS Provides</h3>
                  <p className="font-sans text-base leading-6">
                    ZedSMS provides app-based virtual Numbers of different types, paid for with Credit. The Service needs a working internet connection and a compatible device.
                  </p>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Not a Replacement Phone Line</h3>
                  <p className="font-sans text-base leading-6">
                    The Service is a secondary number service. It is not a replacement for a mobile or landline service.
                  </p>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Delivery of SMS and Calls</h3>
                  <p className="font-sans text-base leading-6">
                    SMS and calls pass through third-party carriers. We will use reasonable care, but we cannot guarantee that every message or call will be delivered instantly or be received from every sender.
                  </p>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Third-Party Platforms</h3>
                  <p className="font-sans text-base leading-6">
                    Many apps and websites choose not to accept virtual numbers. We do not promise that any Number will receive verification codes from or be accepted by any third party. This is not a failure of our Service and does not entitle you to a refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Numbers */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                4. Numbers
              </h2>

              <div className="bg-[#f9f9fa] border border-[#e6e6e6] rounded-2xl p-6 mb-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e6e6e6]">
                      <th className="text-left font-display font-semibold text-[#0f1013] py-3 px-3">Feature</th>
                      <th className="text-left font-display font-semibold text-[#0f1013] py-3 px-3">Private Number</th>
                      <th className="text-left font-display font-semibold text-[#0f1013] py-3 px-3">Shared Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e6e6e6]">
                      <td className="font-sans text-[#494c52] py-3 px-3">Receive SMS</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✓ Yes</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✓ Yes</td>
                    </tr>
                    <tr className="border-b border-[#e6e6e6]">
                      <td className="font-sans text-[#494c52] py-3 px-3">Send SMS</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✓ Yes</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✗ No</td>
                    </tr>
                    <tr className="border-b border-[#e6e6e6]">
                      <td className="font-sans text-[#494c52] py-3 px-3">Make/Receive Calls</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✓ Yes</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">✗ No</td>
                    </tr>
                    <tr>
                      <td className="font-sans text-[#494c52] py-3 px-3">Typical Use</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">Personal contacts & accounts</td>
                      <td className="font-sans text-[#0f1013] py-3 px-3">Receiving from one service</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 text-[#494c52]">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Expiry and Auto-Renew</h3>
                  <p className="font-sans text-base leading-6">
                    You can turn auto-renew on or off for each Number at any time in the app. Auto-renew ON: if your Credit balance covers the renewal fee, the Number renews automatically 7 days before expiry. Auto-renew OFF: the Number expires at the end of the paid period.
                  </p>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">What Happens When Numbers Expire</h3>
                  <p className="font-sans text-base leading-6 mb-2">
                    If a Number is not renewed by its expiry date, it expires and stops working. Some expired Numbers can be restored:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6"><strong>United Kingdom:</strong> Within 7 days (additional restoration charge applies)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6"><strong>United States & Canada:</strong> Within 15 days (if not already taken by another customer)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6"><strong>Australia:</strong> No restoration period</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="font-sans text-base leading-6">
                    <strong>Important:</strong> We cannot guarantee that any expired Number can be restored, and a Number expiring because it was not renewed is not a reason for a refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Acceptable Use */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                5. Acceptable Use
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                The Service is for personal communication. You must not use it to:
              </p>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Do anything illegal, fraudulent, or deceptive (scams, phishing, impersonation, money laundering)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Send bulk, marketing, promotional, or automated (A2P) messages</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Harass, threaten, abuse, stalk or intimidate anyone</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Send sexual content involving minors, or obscene or hateful content</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Resell or commercially exploit the Service without our written agreement</span>
                </li>
              </ul>
            </div>

            {/* Credit, Prices and Payment */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                6. Credit, Prices and Payment
              </h2>
              <div className="space-y-4 text-[#494c52]">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Prices and Payment Methods</h3>
                  <p className="font-sans text-base leading-6 mb-3">
                    Prices are shown in the app before you pay, including any VAT or sales tax. You can pay:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6">By card (processed by Stripe)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6">By cryptocurrency (NOWPayments or MixPay)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#2155f5] font-bold">•</span>
                      <span className="font-sans text-base leading-6">Through Apple App Store in-app purchase</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Cryptocurrency Payments</h3>
                  <ul className="space-y-2 ml-6">
                    <li className="flex gap-2">
                      <span className="text-[#e9a320] font-bold">⚠</span>
                      <span className="font-sans text-base leading-6"><strong>A new payment address every time.</strong> Never reuse an old address.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e9a320] font-bold">⚠</span>
                      <span className="font-sans text-base leading-6"><strong>Check before you send.</strong> Verify the address, network, token, and amount.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#e9a320] font-bold">⚠</span>
                      <span className="font-sans text-base leading-6"><strong>Crypto transactions are final.</strong> Payments sent to wrong addresses cannot be recovered or refunded.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Refund Policy */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                7. Refund Policy
              </h2>
              <div className="bg-[#fef3f3] border border-[#ffd4d4] rounded-xl p-6 mb-6">
                <p className="font-sans text-base leading-6 text-[#0f1013] mb-3">
                  <strong>All purchases are final and non-refundable once supplied</strong>, except as set out below. This is because Credit and Numbers are delivered instantly.
                </p>
              </div>

              <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-3">We Will Refund Where:</h3>
              <ul className="space-y-2 text-[#494c52] mb-6">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">✓</span>
                  <span className="font-sans text-base leading-6">You were charged twice for the same purchase</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">✓</span>
                  <span className="font-sans text-base leading-6">We failed to supply what you paid for and cannot fix it</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">✓</span>
                  <span className="font-sans text-base leading-6">We withdraw or change a Number due to our fault</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">✓</span>
                  <span className="font-sans text-base leading-6">Your country's consumer law gives you a refund right we cannot exclude</span>
                </li>
              </ul>

              <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-3">We Will Not Refund Where:</h3>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">A third party refuses or blocks a Number</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">You changed your mind after the Credit was supplied</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">You bought the wrong Number or the wrong amount of Credit</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">You did not turn off auto-renew before a renewal was charged</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">Cryptocurrency was sent to the wrong address or network</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold min-w-fit">✗</span>
                  <span className="font-sans text-base leading-6">Your Account was closed because you broke these Terms</span>
                </li>
              </ul>
            </div>

            {/* Disputes and Chargebacks */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                8. Payment Disputes and Chargebacks
              </h2>
              <div className="bg-[#fff8f3] border border-[#ffe0cc] rounded-xl p-6 mb-4">
                <p className="font-sans text-base leading-6 text-[#0f1013]">
                  <strong>Most issues are resolved faster by us than by your bank.</strong> Before raising a dispute, chargeback, or store refund request, please email support@zedsms.com and give us a chance to resolve it.
                </p>
              </div>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                If you raise a dispute with your bank without contacting us first, we will suspend your Account while the dispute is open and may recover reasonable costs from your Credit if the dispute is decided in our favour.
              </p>
            </div>

            {/* Suspension and Termination */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                9. Suspension and Termination
              </h2>
              <div className="space-y-4 text-[#494c52]">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">By You</h3>
                  <p className="font-sans text-base leading-6">
                    You can close your Account at any time in the app or by emailing support@zedsms.com. Any Numbers are released. Unused Credit is not refundable on closure.
                  </p>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">By Us</h3>
                  <p className="font-sans text-base leading-6 mb-3">
                    We may suspend or close your Account immediately if we reasonably believe:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-sans text-base leading-6">You have broken the Acceptable Use section or used the Service for fraud</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-sans text-base leading-6">A payment was unauthorised or fraudulent, or has been disputed</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-sans text-base leading-6">You gave false information when registering</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span className="font-sans text-base leading-6">A regulator or court requires us to</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-lg text-[#0f1013] mb-2">Appeals</h3>
                  <p className="font-sans text-base leading-6">
                    If you think we suspended you in error, email complaints@zedsms.com. A person will review it.
                  </p>
                </div>
              </div>
            </div>

            {/* Limitations */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                10. Our Responsibility to You
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                We will provide the Service with reasonable care and skill. We are responsible for foreseeable loss caused by our breaking these Terms. We are not responsible for:
              </p>
              <ul className="space-y-2 text-[#494c52]">
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Third parties refusing or blocking Numbers or not sending codes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Failures of carriers, networks, or your device outside our control</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Inability to contact emergency services</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Loss caused by someone using your Account if you did not keep login secure</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#2155f5] font-bold min-w-fit">•</span>
                  <span className="font-sans text-base leading-6">Events outside our reasonable control (network failures, cyber-attacks, natural events)</span>
                </li>
              </ul>
            </div>

            {/* Complaints */}
            <div>
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                11. Complaints
              </h2>
              <p className="font-sans text-base leading-6 text-[#494c52] mb-4">
                Email complaints@zedsms.com with your Account email and details. We will acknowledge within 5 working days and aim to resolve within 20 working days.
              </p>
              <p className="font-sans text-base leading-6 text-[#494c52]">
                If your complaint is not resolved within 8 weeks, you may refer it to an independent alternative dispute resolution scheme.
              </p>
            </div>

            {/* General */}
            <div className="border-t border-[#e6e6e6] pt-8">
              <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-[32px] sm:leading-[36px] tracking-[-0.02em] text-[#0f1013] mb-4">
                12. General
              </h2>
              <div className="space-y-3 text-[#494c52]">
                <p className="font-sans text-base leading-6">
                  <strong>Governing Law:</strong> These Terms are governed by the law of England and Wales. You may bring proceedings in the courts of England and Wales or in the courts of your country if you are a Consumer.
                </p>
                <p className="font-sans text-base leading-6">
                  <strong>Changes to Terms:</strong> We may change these Terms for regulatory or operational reasons. Changes to your disadvantage will be notified 30 days before they apply.
                </p>
                <p className="font-sans text-base leading-6">
                  <strong>Questions?</strong> Contact us at support@zedsms.com
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <Cta />
      <Footer />
    </>
  );
}
